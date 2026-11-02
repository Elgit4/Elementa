import { getElement, ELEMENTS } from '../data';
import { ionShells, toSubscript, toSuperscript } from './atom';
import { isoelectronicNobleGas, outerShellElectrons } from './display';

/* ───────────── Ionic bonding: main-group metal + non-metal, simplified electron-transfer model ───────────── */

/** Li, Na, K, Mg, Ca, Al. Each loses all of its outer electrons. */
export const IONIC_METALS = [3, 11, 19, 12, 20, 13] as const;
/** F, Cl, Br, O, S, N. Each gains electrons to reach eight in its outer shell. */
export const IONIC_NONMETALS = [9, 17, 35, 8, 16, 7] as const;

/** Anion names are listed, not built from the element name, so they are always the accepted spelling. */
const ANION_NAMES: Record<string, string> = { F: 'fluoride', Cl: 'chloride', Br: 'bromide', O: 'oxide', S: 'sulfide', N: 'nitride' };

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** Ion with a superscript charge, e.g. Mg²⁺ and Cl⁻. */
export const ionSymbol = (symbol: string, charge: number) => `${symbol}${Math.abs(charge) === 1 ? '' : toSuperscript(Math.abs(charge))}${charge > 0 ? '⁺' : '⁻'}`;
const signed = (c: number) => (c > 0 ? `+${c}` : `−${-c}`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export interface IonSide {
  z: number;
  symbol: string;
  name: string;
  /** Electrons in the outer shell of the neutral atom. */
  outer: number;
  /** Electrons lost (metal) or gained (non-metal) by each atom. */
  moved: number;
  charge: number;
  shellsBefore: number[];
  shellsAfter: number[];
  /** Symbol of the noble gas whose electron arrangement the ion now has. */
  nobleGas: string | null;
}

export interface IonicResult {
  metal: IonSide;
  nonmetal: IonSide & { anionName: string };
  metalCount: number;
  nonmetalCount: number;
  /** Total electrons transferred for one formula unit. */
  transferred: number;
  formula: string;
  formulaDisplay: string;
  name: string;
}

function side(z: number, kind: 'metal' | 'nonmetal'): IonSide {
  const el = getElement(z);
  if (!el) throw new RangeError(`no element ${z}`);
  const outer = outerShellElectrons(el);
  const moved = kind === 'metal' ? outer : 8 - outer;
  const charge = kind === 'metal' ? moved : -moved;
  const after = ionShells(el.shells, charge);
  if (!after) throw new RangeError(`${el.symbol} is outside the simplified model`);
  return { z, symbol: el.symbol, name: el.name, outer, moved, charge, shellsBefore: el.shells, shellsAfter: after, nobleGas: isoelectronicNobleGas(ELEMENTS, after)?.symbol ?? null };
}

export function ionicCompound(metalZ: number, nonmetalZ: number): IonicResult {
  if (!(IONIC_METALS as readonly number[]).includes(metalZ)) throw new RangeError(`element ${metalZ} is not an offered metal`);
  if (!(IONIC_NONMETALS as readonly number[]).includes(nonmetalZ)) throw new RangeError(`element ${nonmetalZ} is not an offered non-metal`);
  const metal = side(metalZ, 'metal');
  const nm = side(nonmetalZ, 'nonmetal');
  const g = gcd(metal.charge, -nm.charge);
  const metalCount = -nm.charge / g;
  const nonmetalCount = metal.charge / g;
  const sub = (n: number) => (n === 1 ? '' : String(n));
  const subD = (n: number) => (n === 1 ? '' : toSubscript(n));
  const anionName = ANION_NAMES[nm.symbol];
  return {
    metal,
    nonmetal: { ...nm, anionName },
    metalCount,
    nonmetalCount,
    transferred: metalCount * metal.moved,
    formula: `${metal.symbol}${sub(metalCount)}${nm.symbol}${sub(nonmetalCount)}`,
    formulaDisplay: `${metal.symbol}${subD(metalCount)}${nm.symbol}${subD(nonmetalCount)}`,
    name: `${metal.name} ${anionName}`,
  };
}

export interface Step { title: string; text: string }

/** The explanation shown to students. Every number comes from the result, never typed in. */
export function ionicSteps(r: IonicResult): Step[] {
  const { metal: m, nonmetal: n } = r;
  const arrangement = (s: number[]) => s.join(',');
  return [
    {
      title: 'The atoms',
      text: `${m.name} has ${plural(m.outer, 'electron')} in its outer shell (arrangement ${arrangement(m.shellsBefore)}). ${n.name} has ${plural(n.outer, 'electron')} in its outer shell (arrangement ${arrangement(n.shellsBefore)}).`,
    },
    {
      title: 'Electrons are transferred',
      text: `Each ${m.name.toLowerCase()} atom loses ${plural(m.moved, 'electron')}. Each ${n.name.toLowerCase()} atom gains ${plural(n.moved, 'electron')} to reach eight in its outer shell. ${r.metalCount === 1 && r.nonmetalCount === 1 ? '' : `To balance the electrons, ${plural(r.metalCount, `${m.name.toLowerCase()} atom`)} react${r.metalCount === 1 ? 's' : ''} with ${plural(r.nonmetalCount, `${n.name.toLowerCase()} atom`)}. `}Electrons lost (${r.metalCount} × ${m.moved} = ${r.transferred}) equal electrons gained (${r.nonmetalCount} × ${n.moved} = ${r.transferred}).`,
    },
    {
      title: 'Ions are formed',
      text: `${m.name} becomes ${ionSymbol(m.symbol, m.charge)} (arrangement ${arrangement(m.shellsAfter)}${m.nobleGas ? `, the same as ${m.nobleGas}` : ''}). ${n.name} becomes ${ionSymbol(n.symbol, n.charge)} (arrangement ${arrangement(n.shellsAfter)}${n.nobleGas ? `, the same as ${n.nobleGas}` : ''}). Oppositely charged ions attract each other: this attraction is the ionic bond.`,
    },
    {
      title: 'The formula',
      text: `The charges must add up to zero: ${r.metalCount} × (${signed(m.charge)}) + ${r.nonmetalCount} × (${signed(n.charge)}) = 0. The formula is ${r.formulaDisplay} and the compound is called ${r.name.toLowerCase()}. In the solid, huge numbers of ions pack into a lattice; the formula gives the simplest ratio of ions.`,
    },
  ];
}

/* ───────────── Covalent bonding: simple molecules, shared pairs and lone pairs ───────────── */

export interface MoleculeAtom {
  symbol: string;
  x: number;
  y: number;
  /** Direction of each lone pair, in degrees clockwise from the +x axis (screen coordinates). */
  lp: number[];
}
export interface MoleculeBond { a: number; b: number; order: 1 | 2 | 3 }
export interface MoleculeDef { id: string; name: string; formula: string; atoms: MoleculeAtom[]; bonds: MoleculeBond[] }

/** 2D drawings show which atoms are bonded, not the true 3D shape. */
export const MOLECULES: MoleculeDef[] = [
  { id: 'h2', name: 'Hydrogen', formula: 'H2', atoms: [{ symbol: 'H', x: 130, y: 100, lp: [] }, { symbol: 'H', x: 230, y: 100, lp: [] }], bonds: [{ a: 0, b: 1, order: 1 }] },
  { id: 'cl2', name: 'Chlorine', formula: 'Cl2', atoms: [{ symbol: 'Cl', x: 120, y: 100, lp: [270, 90, 180] }, { symbol: 'Cl', x: 240, y: 100, lp: [270, 90, 0] }], bonds: [{ a: 0, b: 1, order: 1 }] },
  { id: 'o2', name: 'Oxygen', formula: 'O2', atoms: [{ symbol: 'O', x: 120, y: 100, lp: [225, 135] }, { symbol: 'O', x: 240, y: 100, lp: [315, 45] }], bonds: [{ a: 0, b: 1, order: 2 }] },
  { id: 'n2', name: 'Nitrogen', formula: 'N2', atoms: [{ symbol: 'N', x: 120, y: 100, lp: [180] }, { symbol: 'N', x: 240, y: 100, lp: [0] }], bonds: [{ a: 0, b: 1, order: 3 }] },
  { id: 'hcl', name: 'Hydrogen chloride', formula: 'HCl', atoms: [{ symbol: 'H', x: 120, y: 100, lp: [] }, { symbol: 'Cl', x: 240, y: 100, lp: [270, 90, 0] }], bonds: [{ a: 0, b: 1, order: 1 }] },
  { id: 'h2o', name: 'Water', formula: 'H2O', atoms: [{ symbol: 'O', x: 180, y: 70, lp: [240, 300] }, { symbol: 'H', x: 110, y: 150, lp: [] }, { symbol: 'H', x: 250, y: 150, lp: [] }], bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }] },
  { id: 'nh3', name: 'Ammonia', formula: 'NH3', atoms: [{ symbol: 'N', x: 180, y: 85, lp: [270] }, { symbol: 'H', x: 100, y: 155, lp: [] }, { symbol: 'H', x: 180, y: 170, lp: [] }, { symbol: 'H', x: 260, y: 155, lp: [] }], bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }] },
  { id: 'ch4', name: 'Methane', formula: 'CH4', atoms: [{ symbol: 'C', x: 180, y: 100, lp: [] }, { symbol: 'H', x: 180, y: 30, lp: [] }, { symbol: 'H', x: 180, y: 170, lp: [] }, { symbol: 'H', x: 100, y: 100, lp: [] }, { symbol: 'H', x: 260, y: 100, lp: [] }], bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }] },
  { id: 'co2', name: 'Carbon dioxide', formula: 'CO2', atoms: [{ symbol: 'O', x: 80, y: 100, lp: [225, 135] }, { symbol: 'C', x: 180, y: 100, lp: [] }, { symbol: 'O', x: 280, y: 100, lp: [315, 45] }], bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 }] },
];

export interface AtomAnalysis {
  symbol: string;
  name: string;
  valence: number;
  sharedPairs: number;
  lonePairs: number;
  /** Electrons in the outer shell once bonding is counted: 2 per shared pair and 2 per lone pair. */
  outerElectrons: number;
  target: 2 | 8;
  full: boolean;
  /** The atom supplies one electron to each shared pair, plus two for each lone pair, so this equals its valence electrons. */
  electronsAccounted: number;
}

export interface MoleculeAnalysis {
  atoms: AtomAnalysis[];
  totalValence: number;
  totalSharedPairs: number;
  totalLonePairs: number;
  balanced: boolean;
  allFull: boolean;
  bondLabels: string[];
}

const ORDER_NAME = { 1: 'single', 2: 'double', 3: 'triple' } as const;

export function analyseMolecule(def: MoleculeDef): MoleculeAnalysis {
  const atoms = def.atoms.map((a, i): AtomAnalysis => {
    const el = ELEMENTS.find((e) => e.symbol === a.symbol);
    if (!el) throw new RangeError(`unknown element ${a.symbol}`);
    const valence = outerShellElectrons(el);
    const sharedPairs = def.bonds.filter((b) => b.a === i || b.b === i).reduce((s, b) => s + b.order, 0);
    const lonePairs = a.lp.length;
    const target: 2 | 8 = a.symbol === 'H' ? 2 : 8;
    const outerElectrons = 2 * sharedPairs + 2 * lonePairs;
    return { symbol: a.symbol, name: el.name, valence, sharedPairs, lonePairs, outerElectrons, target, full: outerElectrons === target, electronsAccounted: sharedPairs + 2 * lonePairs };
  });
  const totalValence = atoms.reduce((s, a) => s + a.valence, 0);
  const totalSharedPairs = def.bonds.reduce((s, b) => s + b.order, 0);
  const totalLonePairs = atoms.reduce((s, a) => s + a.lonePairs, 0);
  return {
    atoms,
    totalValence,
    totalSharedPairs,
    totalLonePairs,
    balanced: totalValence === 2 * totalSharedPairs + 2 * totalLonePairs && atoms.every((a) => a.electronsAccounted === a.valence),
    allFull: atoms.every((a) => a.full),
    bondLabels: def.bonds.map((b) => `${def.atoms[b.a].symbol}–${def.atoms[b.b].symbol}: ${ORDER_NAME[b.order]} bond (${b.order} shared ${b.order === 1 ? 'pair' : 'pairs'}, ${2 * b.order} electrons)`),
  };
}

/** Counts atoms in a simple formula such as "H2O" or "CO2". */
export function formulaCounts(formula: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[m[1]] = (out[m[1]] ?? 0) + (m[2] ? Number(m[2]) : 1);
  return out;
}
export const displayFormula = (formula: string) => formula.replace(/\d+/g, (d) => toSubscript(Number(d)));
