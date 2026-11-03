import { ELEMENTS, getElement } from '../data';
import { toSubscript } from './atom';
import { IONIC_METALS, IONIC_NONMETALS, MOLECULES, analyseMolecule, displayFormula, ionSymbol, ionicCompound } from './bonding';
import { seededShuffle, type Choice, type Question } from './quiz';

export { BONDING_QUIZ_ID } from './quizIds';
export const BONDING_QUIZ_LENGTH = 10;

const IDS = ['a', 'b', 'c', 'd'];
const chargeText = (c: number) => `${Math.abs(c)}${c > 0 ? '+' : '−'}`;
const signed = (c: number) => (c > 0 ? `+${c}` : `−${-c}`);
const pairs = (n: number) => `${n} ${n === 1 ? 'pair' : 'pairs'}`;
const electrons = (n: number) => `${n} ${n === 1 ? 'electron' : 'electrons'}`;

interface Option { text: string; note?: string }

/** Build a four-choice question: the first option is correct, the next three are wrong and each needs a note. */
function make(id: string, stem: string, correct: string, wrong: Option[], explanation: string): Question {
  const opts = [{ text: correct }, ...wrong];
  if (opts.length !== 4 || new Set(opts.map((o) => o.text)).size !== 4) throw new Error(`${id}: needs four distinct choices`);
  const choices: Choice[] = opts.map((o, i) => ({ id: IDS[i], text: o.text }));
  const distractorNotes: Record<string, string> = {};
  wrong.forEach((w, i) => { distractorNotes[IDS[i + 1]] = w.note ?? ''; });
  return { id, stem, choices, correct: 'a', explanation, distractorNotes };
}

/* ───────── Ionic: predict the formula ───────── */
function formulaQuestion(mz: number, nz: number): Question {
  const r = ionicCompound(mz, nz);
  const mq = r.metal.charge, nq = -r.nonmetal.charge;
  const text = (a: number, b: number) => `${r.metal.symbol}${a === 1 ? '' : toSubscript(a)}${r.nonmetal.symbol}${b === 1 ? '' : toSubscript(b)}`;
  const correct = r.formulaDisplay;
  const noteFor = (a: number, b: number): string => {
    const total = a * mq - b * nq;
    if (total === 0) return `The charges balance (${a} × (${signed(mq)}) + ${b} × (−${nq}) = 0), but a formula must show the simplest ratio of ions. Divide both numbers by ${a / r.metalCount} to get ${correct}.`;
    return `In ${text(a, b)} the charges add up to ${signed(total)}, not zero: ${a} × (${signed(mq)}) + ${b} × (−${nq}) = ${signed(total)}.`;
  };
  const order: [number, number][] = [[r.nonmetalCount, r.metalCount], [1, 1], [r.metalCount * 2, r.nonmetalCount * 2], [2, 1], [1, 2], [3, 1], [1, 3], [3, 2], [2, 3], [2, 2], [4, 3], [3, 4]];
  const seen = new Set([correct]);
  const wrong: Option[] = [];
  for (const [a, b] of order) {
    const t = text(a, b);
    if (seen.has(t)) continue;
    seen.add(t); wrong.push({ text: t, note: noteFor(a, b) });
    if (wrong.length === 3) break;
  }
  return make(`formula-${r.metal.symbol}-${r.nonmetal.symbol}`,
    `What is the formula of the compound formed when ${r.metal.name.toLowerCase()} reacts with ${r.nonmetal.name.toLowerCase()}?`,
    correct, wrong,
    `${r.metal.name} forms ${ionSymbol(r.metal.symbol, r.metal.charge)} and ${r.nonmetal.name.toLowerCase()} forms ${ionSymbol(r.nonmetal.symbol, r.nonmetal.charge)}. The charges must add up to zero: ${r.metalCount} × (${signed(mq)}) + ${r.nonmetalCount} × (−${nq}) = 0, so the formula is ${correct} (${r.name.toLowerCase()}).`);
}

/* ───────── Ionic: ion charge ───────── */
function chargeQuestion(z: number): Question {
  const isMetal = (IONIC_METALS as readonly number[]).includes(z);
  const r = isMetal ? ionicCompound(z, 9).metal : ionicCompound(11, z).nonmetal;
  const c = r.charge;
  const reason = isMetal
    ? `${r.name} has ${electrons(r.outer)} in its outer shell and loses them to reach a full shell, so it forms ${ionSymbol(r.symbol, c)}.`
    : `${r.name} has ${electrons(r.outer)} in its outer shell and gains ${electrons(r.moved)} to reach eight, so it forms ${ionSymbol(r.symbol, c)}.`;
  const candidates = [-c, ...[1, 2, 3].filter((m) => m !== Math.abs(c)).map((m) => Math.sign(c) * m)].filter((x, i, a) => x !== c && a.indexOf(x) === i);
  const wrong: Option[] = candidates.slice(0, 3).map((w) => ({
    text: chargeText(w),
    note: Math.sign(w) !== Math.sign(c)
      ? (isMetal ? 'Metal atoms lose electrons, so their ions are positive.' : 'Non-metal atoms gain electrons, so their ions are negative.')
      : `Count the outer electrons: ${r.name.toLowerCase()} has ${r.outer}. ${reason}`,
  }));
  return make(`charge-${r.symbol}`, `What is the charge on the ion formed by ${r.name.toLowerCase()}?`, chargeText(c), wrong, reason);
}

/* ───────── Ionic: electrons transferred ───────── */
function transferQuestion(mz: number, nz: number): Question {
  const r = ionicCompound(mz, nz);
  const t = r.transferred;
  const basis = `Electrons lost equal electrons gained: ${r.metalCount} × ${r.metal.moved} = ${t}, and ${r.nonmetalCount} × ${r.nonmetal.moved} = ${t}.`;
  const cand: Option[] = [];
  const add = (n: number, note: string) => { if (n > 0 && n !== t && !cand.some((o) => o.text === String(n))) cand.push({ text: String(n), note }); };
  add(r.metal.moved, `That is the number lost by one ${r.metal.name.toLowerCase()} atom. The formula contains ${r.metalCount} ${r.metal.name.toLowerCase()} ${r.metalCount === 1 ? 'atom' : 'atoms'}: ${r.metalCount} × ${r.metal.moved} = ${t}.`);
  add(r.nonmetal.moved, `That is the number gained by one ${r.nonmetal.name.toLowerCase()} atom. The formula contains ${r.nonmetalCount} ${r.nonmetal.name.toLowerCase()} ${r.nonmetalCount === 1 ? 'atom' : 'atoms'}: ${r.nonmetalCount} × ${r.nonmetal.moved} = ${t}.`);
  add(r.metal.moved + r.nonmetal.moved, `Do not add the electrons lost and gained together. The same electrons are lost by the metal and gained by the non-metal. ${basis}`);
  add(t * 2, `That counts the electrons twice (once lost, once gained). ${basis}`);
  add(t + 1, `Count carefully. ${basis}`);
  add(t + 2, `Count carefully. ${basis}`);
  add(t - 1, `Count carefully. ${basis}`);
  add(t + 3, `Count carefully. ${basis}`);
  add(t * 3, `Count carefully. ${basis}`);
  add(t + 4, `Count carefully. ${basis}`);
  return make(`transfer-${r.metal.symbol}-${r.nonmetal.symbol}`,
    `When ${r.metal.name.toLowerCase()} reacts with ${r.nonmetal.name.toLowerCase()} to form ${r.formulaDisplay}, how many electrons are transferred in total for one formula unit?`,
    String(t), cand.slice(0, 3), `${basis} So ${t} ${t === 1 ? 'electron is' : 'electrons are'} transferred.`);
}

/* ───────── Ionic: noble-gas arrangement ───────── */
const NOBLE = [2, 10, 18, 36];
function nobleQuestion(z: number): Question {
  const isMetal = (IONIC_METALS as readonly number[]).includes(z);
  const side = isMetal ? ionicCompound(z, 9).metal : ionicCompound(11, z).nonmetal;
  const gasName = (n: number) => `${getElement(n)!.name} (${getElement(n)!.symbol})`;
  const gasZ = ELEMENTS.find((e) => e.symbol === side.nobleGas)!.number;
  const ion = ionSymbol(side.symbol, side.charge);
  const arr = side.shellsAfter.join(',');
  const wrong: Option[] = NOBLE.filter((n) => n !== gasZ).map((n) => ({
    text: gasName(n),
    note: `${getElement(n)!.name} has the electron arrangement ${getElement(n)!.shells.join(',')}, but ${ion} has ${arr}.`,
  }));
  return make(`noble-${side.symbol}`, `Which noble gas has the same electron arrangement as the ${ion} ion?`, gasName(gasZ), wrong,
    `${side.name} forms ${ion}, with the electron arrangement ${arr}. ${getElement(gasZ)!.name} has the same arrangement (${getElement(gasZ)!.shells.join(',')}).`);
}

/* ───────── Covalent ───────── */
function lonePairQuestion(moleculeId: string, symbol: string): Question {
  const def = MOLECULES.find((m) => m.id === moleculeId)!;
  const a = analyseMolecule(def).atoms.find((x) => x.symbol === symbol)!;
  const left = a.valence - a.sharedPairs;
  const explanation = `${a.name} has ${electrons(a.valence)} in its outer shell. ${a.sharedPairs} ${a.sharedPairs === 1 ? 'is' : 'are'} used in shared pairs, leaving ${left}, which form ${a.lonePairs} lone ${a.lonePairs === 1 ? 'pair' : 'pairs'}.`;
  const vals = [0, 1, 2, 3, 4].filter((v) => v !== a.lonePairs).sort((x, y) => Math.abs(x - a.lonePairs) - Math.abs(y - a.lonePairs) || x - y).slice(0, 3);
  const wrong: Option[] = vals.map((v) => ({
    text: String(v),
    note: `${v === a.sharedPairs ? `That is the number of shared pairs, not lone pairs. ` : ''}${explanation}`,
  }));
  return make(`lonepairs-${def.id}-${a.symbol}`, `How many lone pairs are on the ${a.name.toLowerCase()} atom in ${def.name.toLowerCase()} (${displayFormula(def.formula)})?`, String(a.lonePairs), wrong, explanation);
}

function bondTypeQuestion(moleculeId: string): Question {
  const def = MOLECULES.find((m) => m.id === moleculeId)!;
  const bond = def.bonds[0];
  const A = def.atoms[bond.a], B = def.atoms[bond.b];
  const nameA = getElement(ELEMENTS.find((e) => e.symbol === A.symbol)!.number)!.name.toLowerCase();
  const nameB = getElement(ELEMENTS.find((e) => e.symbol === B.symbol)!.number)!.name.toLowerCase();
  const label = (o: number) => `A ${['single', 'double', 'triple'][o - 1]} bond (${pairs(o)} shared)`;
  const explanation = `The ${A.symbol} and ${B.symbol} atoms share ${pairs(bond.order)} of electrons (${2 * bond.order} electrons), which is a ${['single', 'double', 'triple'][bond.order - 1]} covalent bond. ${def.id === 'o2' || def.id === 'n2' || def.id === 'co2' ? 'This is what gives each atom a full outer shell of eight.' : ''}`.trim();
  const wrong: Option[] = ([1, 2, 3] as const).filter((o) => o !== bond.order).map((o) => ({
    text: label(o),
    note: `A ${['single', 'double', 'triple'][o - 1]} bond is ${pairs(o)} shared, but ${A.symbol} and ${B.symbol} share ${pairs(bond.order)} here.`,
  }));
  wrong.push({ text: 'An ionic bond (electrons are transferred)', note: 'Both atoms are non-metals, so they share electrons rather than transferring them.' });
  return make(`bondtype-${def.id}`, `What type of bond joins the ${nameA} and ${nameB} atoms in ${def.name.toLowerCase()} (${displayFormula(def.formula)})?`, label(bond.order), wrong.slice(0, 3), explanation);
}

/* ───────── Assembling a quiz ───────── */
const allPairs = () => IONIC_METALS.flatMap((m) => IONIC_NONMETALS.map((n) => [m, n] as const));
const loneAtoms = () => MOLECULES.flatMap((m) => [...new Set(analyseMolecule(m).atoms.filter((a) => a.lonePairs > 0).map((a) => a.symbol))].map((s) => [m.id, s] as const));
const pick = <T,>(items: T[], n: number, seed: number) => seededShuffle(items, seed).slice(0, n);

/**
 * A fresh ten-question quiz for a seed: 3 formulas, 1 ion charge, 1 electron count, 1 noble-gas arrangement,
 * 2 lone-pair counts and 2 bond types. Every answer, choice and note is computed by the bonding engine.
 */
export function bondingQuestions(seed: number): Question[] {
  const ions = [...IONIC_METALS, ...IONIC_NONMETALS];
  const qs: Question[] = [
    ...pick(allPairs(), 3, seed * 7 + 1).map(([m, n]) => formulaQuestion(m, n)),
    ...pick([...ions], 1, seed * 7 + 2).map((z) => chargeQuestion(z)),
    ...pick(allPairs(), 1, seed * 7 + 3).map(([m, n]) => transferQuestion(m, n)),
    ...pick([...ions], 1, seed * 7 + 4).map((z) => nobleQuestion(z)),
    ...pick(loneAtoms(), 2, seed * 7 + 5).map(([id, s]) => lonePairQuestion(id, s)),
    ...pick(MOLECULES.map((m) => m.id), 2, seed * 7 + 6).map((id) => bondTypeQuestion(id)),
  ];
  return seededShuffle(qs, seed * 7 + 7);
}

export const allBondingQuestions = (): Question[] => [
  ...allPairs().flatMap(([m, n]) => [formulaQuestion(m, n), transferQuestion(m, n)]),
  ...[...IONIC_METALS, ...IONIC_NONMETALS].flatMap((z) => [chargeQuestion(z), nobleQuestion(z)]),
  ...loneAtoms().map(([id, s]) => lonePairQuestion(id, s)),
  ...MOLECULES.map((m) => bondTypeQuestion(m.id)),
];
