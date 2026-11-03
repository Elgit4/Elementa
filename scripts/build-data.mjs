// Builds src/data/elements.json from the MIT-licensed periodic-table-data-complete dataset.
// Only factual fields are kept (the Wikipedia-derived summaries are deliberately NOT bundled).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const raw = require('periodic-table-data-complete/pTable.json').filter((e) => e.atomic_number <= 118);

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const unsup = (s) => [...s].map((c) => SUP[c] ?? c).join('');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const FAMILY = {
  'diatomic nonmetal': 'nonmetal',
  'polyatomic nonmetal': 'nonmetal',
  'noble gas': 'noble-gas',
  'alkali metal': 'alkali-metal',
  'alkaline earth metal': 'alkaline-earth',
  metalloid: 'metalloid',
  'post-transition metal': 'post-transition',
  'transition metal': 'transition-metal',
  lanthanide: 'lanthanide',
  actinide: 'actinide',
};
function family(series) {
  if (FAMILY[series]) return { family: FAMILY[series], familyPredicted: false };
  const s = series.toLowerCase();
  const f = s.includes('transition metal') && s.includes('post') ? 'post-transition'
    : s.includes('transition metal') ? 'transition-metal'
    : s.includes('metalloid') ? 'metalloid'
    : s.includes('noble gas') ? 'noble-gas'
    : s.includes('alkali') ? 'alkali-metal' : 'unknown';
  return { family: f, familyPredicted: true };
}

// "¹²C: 98.93%, ¹³C: 1.07%" -> [{mass:12, abundance:98.93}]
function parseAbundances(str) {
  if (!str) return [];
  return str.split(',').map((p) => {
    const m = unsup(p.trim()).match(/^(\d+)[A-Za-z]+:\s*([\d.]+)%/);
    return m ? { mass: +m[1], abundance: +m[2] } : null;
  }).filter(Boolean);
}
function parseMassList(str) {
  if (!str || str === 'None') return [];
  return str.split(',').map((p) => { const m = unsup(p.trim()).match(/^(\d+)/); return m ? +m[1] : null; }).filter((x) => x !== null);
}

// The source's isotope lists omit the observed isotope for these two; corrected from IUPAC-recognised discoveries.
const ISOTOPE_FIXES = { 116: { add: [293], pick: 293 }, 118: { add: [294], pick: 294 } };

// Known typos in the source data, corrected (each is also guarded by a unit test).
const CONFIG_SHORT_FIXES = { 57: '[Xe] 5d¹ 6s²' }; // source reads "[Xe] 5d¹⁶s²"

const out = raw.map((e) => {
  const z = e.atomic_number;
  const known = parseMassList(e.isotopes_known);
  const stable = new Set(parseMassList(e.isotopes_stable));
  const ab = parseAbundances(e.isotopic_abundances);
  const abMap = new Map(ab.map((a) => [a.mass, a.abundance]));
  const fix = ISOTOPE_FIXES[z];
  const masses = [...new Set([...known, ...ab.map((a) => a.mass), ...(fix?.add ?? [])])].sort((a, b) => a - b);
  let defaultMass; let defaultBasis;
  if (ab.length) {
    defaultMass = ab.reduce((a, b) => (b.abundance > a.abundance ? b : a)).mass; defaultBasis = 'most-abundant';
  } else {
    // No natural abundance data: pick the known isotope closest to the rounded atomic mass
    // (conventionally the mass number of the longest-lived isotope for such elements).
    const target = Math.round(e.atomic_mass);
    defaultMass = masses.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a), masses[0]);
    defaultBasis = 'representative';
  }
  if (fix) defaultMass = fix.pick;
  const isotopes = masses.map((m) => ({ mass: m, neutrons: m - z, stable: stable.has(m), abundance: abMap.has(m) ? abMap.get(m) : null }));
  const { family: fam, familyPredicted } = family(e.series);
  const sem = CONFIG_SHORT_FIXES[z] ?? e.electron_configuration_semantic ?? '';
  return {
    number: z, symbol: e.symbol, name: e.name,
    relativeAtomicMass: num(e.atomic_mass),
    group: num(e.group), period: num(e.period), block: e.block ? e.block.replace('-block', '') : null,
    family: fam, familyPredicted, seriesRaw: e.series,
    phase: e.phase ?? null, phaseRef: 'standard conditions, as reported by the source',
    appearance: e.appearance ?? null,
    density: num(e.density?.stp) !== null ? { value: e.density.stp, unit: 'kg/m³', ref: 'STP' } : null,
    meltingPointK: num(e.melting_point), boilingPointK: num(e.boiling_point),
    electronegativity: num(e.electronegativity_pauling),
    firstIonisationKJ: num(e.ionization_energies?.[0]),
    oxidationStates: e.oxidation_states ?? null,
    radiusPm: { calculated: num(e.radius?.calculated), empirical: num(e.radius?.empirical), covalent: num(e.radius?.covalent) },
    electronConfig: e.electron_configuration ?? null,
    electronConfigShort: sem.replace(/^\*/, ''),
    configPredicted: sem.startsWith('*'),
    shells: e.electrons_per_shell,
    discovered: e.discovered ? { year: num(e.discovered.year), by: e.discovered.by ?? null } : null,
    crustAbundancePercent: num(e.abundance?.crust),
    isotopes, defaultIsotope: defaultMass, defaultIsotopeBasis: defaultBasis,
    cpk: e.cpk_hex ?? null,
  };
});
writeFileSync(new URL('../src/data/elements.json', import.meta.url), JSON.stringify(out));
writeFileSync(new URL('../src/data/element-labels.json', import.meta.url), JSON.stringify(out.map(({ number, symbol, name }) => ({ number, symbol, name }))));
console.log('wrote', out.length, 'elements and compact labels');
