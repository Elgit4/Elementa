import type { ElementData } from '../data/types';

export type TrendId = 'radius' | 'ionisation' | 'electronegativity';

/** A documented departure from the general trend. Both ends are checked against the data by tests. */
export interface TrendException {
  from: number;
  to: number;
  /** Plain-language reason a student can learn, or null when it is only noted as a small reversal. */
  reason: string | null;
}

export interface Trend {
  id: TrendId;
  label: string;
  unit: string;
  definition: string;
  get: (el: ElementData) => number | null;
  decimals: number;
  across: string;
  down: string;
  why: string[];
  exceptions: TrendException[];
  notes: string[];
}

export const TRENDS: Trend[] = [
  {
    id: 'radius',
    label: 'Atomic radius',
    unit: 'pm',
    definition: 'A measure of the size of an atom, in picometres (1 pm = 10⁻¹² m).',
    get: (e) => e.radiusPm.calculated,
    decimals: 0,
    across: 'Atomic radius decreases from left to right across a period.',
    down: 'Atomic radius increases down a group.',
    why: [
      'Across a period each atom has one more proton, but the extra electron goes into the same shell. The nuclear charge grows while the number of shells stays the same, so the nucleus pulls the outer electrons in more strongly.',
      'Down a group each element has one more occupied shell. The outer electrons are farther from the nucleus and are shielded by the inner electrons, so the atom is larger.',
    ],
    exceptions: [],
    notes: [
      'These are calculated (theoretical) radii. Other methods give different numbers, so the element detail panel may show another value for the same element. Compare tiles with each other, not with values from other tables.',
    ],
  },
  {
    id: 'ionisation',
    label: 'First ionisation energy',
    unit: 'kJ/mol',
    definition: 'The energy needed to remove the most loosely held electron from each atom in one mole of gaseous atoms.',
    get: (e) => e.firstIonisationKJ,
    decimals: 0,
    across: 'First ionisation energy generally increases across a period.',
    down: 'First ionisation energy generally decreases down a group.',
    why: [
      'Across a period the nuclear charge increases while electrons are added to the same shell, so the outer electron is held more tightly and more energy is needed to remove it.',
      'Down a group the outer electron is in a shell farther from the nucleus and is shielded by more inner electrons, so it is easier to remove.',
    ],
    exceptions: [
      { from: 4, to: 5, reason: 'The outer electron of boron is in a 2p subshell, which is slightly higher in energy than the 2s subshell beryllium loses an electron from, so it is easier to remove.' },
      { from: 12, to: 13, reason: 'The same reason applies: aluminium’s outer electron is in a 3p subshell, higher in energy than magnesium’s 3s.' },
      { from: 7, to: 8, reason: 'In oxygen two electrons share one 2p orbital. Repulsion between them makes one easier to remove than in nitrogen, where each 2p orbital holds a single electron.' },
      { from: 15, to: 16, reason: 'The same reason applies: sulfur has a paired 3p electron, phosphorus does not.' },
      { from: 55, to: 87, reason: null },
      { from: 56, to: 88, reason: null },
    ],
    notes: ['The reversals below caesium and barium involve rare, radioactive elements. The main pattern is clear through period 6.'],
  },
  {
    id: 'electronegativity',
    label: 'Electronegativity',
    unit: '',
    definition: 'How strongly an atom attracts the shared electrons in a chemical bond (Pauling scale, no unit).',
    get: (e) => e.electronegativity,
    decimals: 2,
    across: 'Electronegativity generally increases across a period (noble gases aside).',
    down: 'Electronegativity generally decreases down a group.',
    why: [
      'Atoms with a high nuclear charge and a small radius attract bonding electrons more strongly, so values rise across a period.',
      'Down a group the bonding electrons are farther from the nucleus and more shielded, so the attraction is weaker.',
    ],
    exceptions: [],
    notes: [
      'Several noble gases have no value in this dataset because they form almost no compounds. Transition metals change little across a period, so the trend is clearest in the main groups.',
    ],
  },
];

export const TREND_BY_ID: Record<TrendId, Trend> = Object.fromEntries(TRENDS.map((t) => [t.id, t])) as Record<TrendId, Trend>;

export const trendValue = (t: Trend, el: ElementData): number | null => {
  const v = t.get(el);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

export interface TrendSummary {
  min: number;
  max: number;
  /** All available values, ascending. Colour position is the rank of a value within this list. */
  sorted: number[];
  lowest: ElementData[];
  highest: ElementData[];
  /** Elements with no value in the dataset (shown hatched, never filled with a guess). */
  missing: ElementData[];
}

export function summarise(t: Trend, all: ElementData[]): TrendSummary {
  const have = all.filter((e) => trendValue(t, e) !== null);
  const vals = have.map((e) => trendValue(t, e)!);
  const min = Math.min(...vals), max = Math.max(...vals);
  return {
    min, max,
    sorted: [...vals].sort((a, b) => a - b),
    lowest: have.filter((e) => trendValue(t, e) === min),
    highest: have.filter((e) => trendValue(t, e) === max),
    missing: all.filter((e) => trendValue(t, e) === null),
  };
}

/**
 * Colour position of a value, 0 to 1, by rank among the available values (ties share the lower rank).
 * Rank, not proportion, is used because most elements sit in a narrow band and a linear scale would
 * make the pattern across a period almost invisible. The real value is always printed on the tile.
 * Null when the element has no value.
 */
export function trendFraction(value: number | null, s: Pick<TrendSummary, 'sorted'>): number | null {
  if (value === null) return null;
  const n = s.sorted.length;
  if (n < 2) return 0;
  let lo = 0, hi = n; // count of values strictly below `value`
  while (lo < hi) { const mid = (lo + hi) >> 1; if (s.sorted[mid] < value) lo = mid + 1; else hi = mid; }
  return lo / (n - 1);
}

export function formatTrendValue(t: Trend, v: number | null): string {
  if (v === null) return 'no value';
  return t.decimals > 0 ? v.toFixed(t.decimals) : String(Math.round(v));
}

export const withUnit = (t: Trend, v: number | null) => (v === null ? 'no value' : `${formatTrendValue(t, v)}${t.unit ? ' ' + t.unit : ''}`);

/** Ranges of consecutive atomic numbers, e.g. [57,58,87,88,89] -> "57–58, 87–89". */
export function numberRanges(nums: number[]): string {
  const out: string[] = [];
  const s = [...nums].sort((a, b) => a - b);
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(i === j ? `${s[i]}` : `${s[i]}–${s[j]}`);
    i = j + 1;
  }
  return out.join(', ');
}
