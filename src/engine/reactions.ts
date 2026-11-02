import { ELEMENTS } from '../data';
import { toSubscript } from './atom';

export type State = 's' | 'l' | 'g' | 'aq';

export interface Species { formula: string; state: State; name: string }

export interface Reaction {
  id: string;
  title: string;
  type: string;
  reactants: Species[];
  products: Species[];
  /** Balanced coefficients: reactants first, then products. */
  coefficients: number[];
  observations: string[];
  explanation: string[];
  safety?: string;
}

/** Counts atoms in a simple formula such as "CaCO3" or "H2O". Brackets are not supported. */
export function parseFormula(formula: string): Record<string, number> {
  if (/[()[\]·.]/.test(formula) || !/^([A-Z][a-z]?\d*)+$/.test(formula)) throw new RangeError(`unsupported formula "${formula}"`);
  const out: Record<string, number> = {};
  for (const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[m[1]] = (out[m[1]] ?? 0) + (m[2] ? Number(m[2]) : 1);
  return out;
}

export function atomCounts(side: Species[], coefs: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  side.forEach((sp, i) => { for (const [el, n] of Object.entries(parseFormula(sp.formula))) out[el] = (out[el] ?? 0) + n * coefs[i]; });
  return out;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export interface BalanceRow { element: string; left: number; right: number; ok: boolean }
export interface BalanceReport {
  rows: BalanceRow[];
  balanced: boolean;
  /** True when the coefficients share no common factor. */
  lowestTerms: boolean;
  commonFactor: number;
}

export function balanceReport(r: Pick<Reaction, 'reactants' | 'products'>, coefs: number[]): BalanceReport {
  const nR = r.reactants.length;
  if (coefs.length !== nR + r.products.length || coefs.some((c) => !Number.isInteger(c) || c < 1)) throw new RangeError('coefficients must be whole numbers of at least 1, one per species');
  const left = atomCounts(r.reactants, coefs.slice(0, nR));
  const right = atomCounts(r.products, coefs.slice(nR));
  const elements = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  const rows = elements.map((element) => ({ element, left: left[element] ?? 0, right: right[element] ?? 0, ok: (left[element] ?? 0) === (right[element] ?? 0) }));
  const commonFactor = coefs.reduce((a, b) => gcd(a, b));
  return { rows, balanced: rows.every((x) => x.ok), lowestTerms: commonFactor === 1, commonFactor };
}

/** Finds every balanced set of coefficients (1 to max) with no common factor. A correct equation has exactly one. */
export function solveLowest(r: Pick<Reaction, 'reactants' | 'products'>, max = 8): number[][] {
  const n = r.reactants.length + r.products.length;
  const found: number[][] = [];
  const cur: number[] = [];
  const walk = (i: number) => {
    if (i === n) { const rep = balanceReport(r, cur); if (rep.balanced && rep.lowestTerms) found.push([...cur]); return; }
    for (let c = 1; c <= max; c++) { cur[i] = c; walk(i + 1); }
  };
  walk(0);
  return found;
}

export const stateLabel = (s: State) => ({ s: 'solid', l: 'liquid', g: 'gas', aq: 'in aqueous solution' })[s];
export const displaySpecies = (sp: Species) => `${sp.formula.replace(/\d+/g, (d) => toSubscript(Number(d)))}(${sp.state})`;

export function equationText(r: Reaction, coefs: number[] = r.coefficients): string {
  const side = (list: Species[], offset: number) => list.map((sp, i) => `${coefs[offset + i] === 1 ? '' : coefs[offset + i]}${displaySpecies(sp)}`).join(' + ');
  return `${side(r.reactants, 0)} → ${side(r.products, r.reactants.length)}`;
}

const sp = (formula: string, state: State, name: string): Species => ({ formula, state, name });

export const REACTIONS: Reaction[] = [
  {
    id: 'mg-o2', title: 'Magnesium burning in oxygen', type: 'Combination (oxidation)',
    reactants: [sp('Mg', 's', 'magnesium'), sp('O2', 'g', 'oxygen')], products: [sp('MgO', 's', 'magnesium oxide')], coefficients: [2, 1, 2],
    observations: ['The magnesium burns with a very bright white flame.', 'A white powder, magnesium oxide, is left behind.', 'Heat and light are given out.'],
    explanation: ['Each magnesium atom gives two electrons to oxygen, forming Mg²⁺ and O²⁻ ions. The ions attract each other to make the ionic compound magnesium oxide.', 'Oxygen exists as O₂ molecules, so one O₂ molecule can take electrons from two magnesium atoms.'],
    safety: 'Never look directly at burning magnesium: the flame is very bright and can hurt your eyes.',
  },
  {
    id: 'zn-hcl', title: 'Zinc and hydrochloric acid', type: 'Displacement (metal + acid)',
    reactants: [sp('Zn', 's', 'zinc'), sp('HCl', 'aq', 'hydrochloric acid')], products: [sp('ZnCl2', 'aq', 'zinc chloride'), sp('H2', 'g', 'hydrogen')], coefficients: [1, 2, 1, 1],
    observations: ['Bubbles of gas form and the zinc slowly dissolves.', 'The test tube feels warm.', 'The gas burns with a squeaky pop when a lit splint is held at the mouth of the tube.'],
    explanation: ['Zinc is more reactive than hydrogen, so it displaces hydrogen from the acid.', 'Each zinc atom loses two electrons to form a Zn²⁺ ion. Two hydrogen ions gain those electrons and form one H₂ molecule.'],
  },
  {
    id: 'fe-cuso4', title: 'Iron and copper(II) sulfate solution', type: 'Displacement (metal + salt)',
    reactants: [sp('Fe', 's', 'iron'), sp('CuSO4', 'aq', 'copper(II) sulfate')], products: [sp('FeSO4', 'aq', 'iron(II) sulfate'), sp('Cu', 's', 'copper')], coefficients: [1, 1, 1, 1],
    observations: ['A reddish-brown solid (copper) coats the iron.', 'The blue solution slowly fades to a pale green.'],
    explanation: ['Iron is more reactive than copper, so it displaces copper from its solution.', 'Iron atoms become Fe²⁺ ions, which make the solution pale green. Cu²⁺ ions gain electrons and become copper atoms, which settle on the iron.'],
  },
  {
    id: 'hcl-naoh', title: 'Hydrochloric acid and sodium hydroxide', type: 'Neutralisation',
    reactants: [sp('HCl', 'aq', 'hydrochloric acid'), sp('NaOH', 'aq', 'sodium hydroxide')], products: [sp('NaCl', 'aq', 'sodium chloride'), sp('H2O', 'l', 'water')], coefficients: [1, 1, 1, 1],
    observations: ['There is no gas or colour change by itself, but the mixture gets warmer.', 'An indicator changes colour when the acid and alkali are exactly balanced.'],
    explanation: ['Hydrogen ions (H⁺) from the acid react with hydroxide ions (OH⁻) from the alkali to make water: H⁺ + OH⁻ → H₂O.', 'The sodium and chloride ions stay dissolved, so the solution contains sodium chloride.'],
  },
  {
    id: 'caco3-hcl', title: 'Calcium carbonate and hydrochloric acid', type: 'Acid + carbonate',
    reactants: [sp('CaCO3', 's', 'calcium carbonate'), sp('HCl', 'aq', 'hydrochloric acid')], products: [sp('CaCl2', 'aq', 'calcium chloride'), sp('H2O', 'l', 'water'), sp('CO2', 'g', 'carbon dioxide')], coefficients: [1, 2, 1, 1, 1],
    observations: ['The mixture fizzes as a colourless gas is given off.', 'The solid dissolves.', 'The gas turns limewater milky, which shows that it is carbon dioxide.'],
    explanation: ['An acid reacts with a carbonate to give a salt, water and carbon dioxide.', 'The carbon dioxide escaping from the liquid causes the fizzing.'],
  },
  {
    id: 'ch4-o2', title: 'Methane burning in plenty of oxygen', type: 'Combustion',
    reactants: [sp('CH4', 'g', 'methane'), sp('O2', 'g', 'oxygen')], products: [sp('CO2', 'g', 'carbon dioxide'), sp('H2O', 'g', 'water vapour')], coefficients: [1, 2, 1, 2],
    observations: ['Methane burns with a blue flame and gives out heat.', 'Carbon dioxide and water vapour are made.'],
    explanation: ['In plenty of oxygen, the carbon in methane becomes carbon dioxide and the hydrogen becomes water.', 'The reaction gives out a lot of heat energy, which is why methane (natural gas) is used as a fuel.'],
  },
  {
    id: 'na-h2o', title: 'Sodium and water', type: 'Metal + water',
    reactants: [sp('Na', 's', 'sodium'), sp('H2O', 'l', 'water')], products: [sp('NaOH', 'aq', 'sodium hydroxide'), sp('H2', 'g', 'hydrogen')], coefficients: [2, 2, 2, 1],
    observations: ['The sodium floats, melts into a ball and darts across the surface, fizzing.', 'Hydrogen gas is given off.', 'The solution turns alkaline: red litmus turns blue.'],
    explanation: ['Sodium is a very reactive alkali metal. Each sodium atom gives one electron, forming a Na⁺ ion.', 'Water is reduced to hydrogen gas and hydroxide ions (OH⁻), which make the solution alkaline.'],
    safety: 'This reaction is dangerous. Only a teacher should demonstrate it, behind a safety screen, with a very small piece of sodium.',
  },
];

const elementName = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)?.name ?? symbol;
const atoms = (n: number) => `${n} ${n === 1 ? 'atom' : 'atoms'}`;

export interface BalanceMessage { kind: 'balanced' | 'not-lowest' | 'unbalanced'; text: string }

/** Feedback for a student's attempt, in plain words. Names the first element that does not match. */
export function balanceMessage(r: Pick<Reaction, 'reactants' | 'products'>, coefs: number[]): BalanceMessage {
  const rep = balanceReport(r, coefs);
  if (!rep.balanced) {
    const bad = rep.rows.filter((x) => !x.ok);
    const first = bad[0];
    const more = bad.length > 1 ? ` ${bad.length - 1} other ${bad.length === 2 ? 'element' : 'elements'} also ${bad.length === 2 ? 'does' : 'do'} not match.` : '';
    return { kind: 'unbalanced', text: `Not balanced yet. ${elementName(first.element)} (${first.element}): ${atoms(first.left)} on the left and ${atoms(first.right)} on the right.${more}` };
  }
  if (!rep.lowestTerms) return { kind: 'not-lowest', text: `Balanced, but not in the simplest whole numbers. Divide every coefficient by ${rep.commonFactor}.` };
  return { kind: 'balanced', text: 'Balanced. Every kind of atom appears the same number of times on both sides, so no atoms are created or destroyed.' };
}
