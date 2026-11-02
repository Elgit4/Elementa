import { describe, expect, it } from 'vitest';
import { getElement } from '../data';
import { BONDING_QUIZ_LENGTH, allBondingQuestions, bondingQuestions } from '../engine/bondingQuiz';
import { evaluate } from '../engine/quiz';

// Independent oracle, typed from textbook knowledge (not read from the engine).
const ION_CHARGE: Record<string, number> = { Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Al: 3, F: -1, Cl: -1, Br: -1, O: -2, S: -2, N: -3 };
const SUB: Record<string, string> = { '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6' };
const parseFormula = (f: string) => [...f.replace(/[₁-₆]/g, (c) => SUB[c]).matchAll(/([A-Z][a-z]?)(\d*)/g)].map((m) => [m[1], m[2] ? Number(m[2]) : 1] as const);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const text = (q: ReturnType<typeof allBondingQuestions>[number], id: string) => q.choices.find((c) => c.id === id)!.text;

describe('generated bonding questions are well formed', () => {
  const all = allBondingQuestions();
  it('builds the whole pool without error, with unique ids', () => {
    expect(all.length).toBe(36 + 36 + 12 + 12 + 7 + 9);
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
  });
  it('every question has four distinct choices, a valid answer, an explanation, and a note on every wrong choice', () => {
    for (const q of all) {
      expect(q.choices, q.id).toHaveLength(4);
      expect(new Set(q.choices.map((c) => c.text)).size, q.id).toBe(4);
      expect(q.choices.some((c) => c.id === q.correct), q.id).toBe(true);
      expect(q.explanation.length, q.id).toBeGreaterThan(20);
      for (const c of q.choices.filter((x) => x.id !== q.correct)) expect(q.distractorNotes[c.id]?.length ?? 0, `${q.id}/${c.id}`).toBeGreaterThan(10);
      expect(q.distractorNotes[q.correct]).toBeUndefined();
    }
  });
  it('evaluate() agrees: only the marked answer is correct', () => {
    for (const q of all) for (const c of q.choices) expect(evaluate(q, c.id).correct, `${q.id}/${c.id}`).toBe(c.id === q.correct);
  });
});

describe('answers are chemically right (checked against an independent table)', () => {
  const all = allBondingQuestions();
  it('formula questions: the correct answer balances in lowest terms and no wrong choice is also valid', () => {
    const fq = all.filter((q) => q.id.startsWith('formula-'));
    expect(fq).toHaveLength(36);
    for (const q of fq) {
      const [, m, n] = q.id.split('-');
      const valid = (f: string) => {
        const parts = parseFormula(f);
        if (parts.length !== 2 || parts[0][0] !== m || parts[1][0] !== n) return false;
        const [a, b] = [parts[0][1], parts[1][1]];
        return a * ION_CHARGE[m] + b * ION_CHARGE[n] === 0 && gcd(a, b) === 1;
      };
      expect(valid(text(q, q.correct)), `${q.id} correct`).toBe(true);
      for (const c of q.choices.filter((x) => x.id !== q.correct)) expect(valid(c.text), `${q.id} wrong choice ${c.text} must not be valid`).toBe(false);
    }
  });
  it('charge questions match the table', () => {
    for (const q of all.filter((x) => x.id.startsWith('charge-'))) {
      const sym = q.id.split('-')[1]; const c = ION_CHARGE[sym];
      expect(text(q, q.correct), q.id).toBe(`${Math.abs(c)}${c > 0 ? '+' : '−'}`);
    }
  });
  it('electron-transfer questions: lost = gained for the textbook formula', () => {
    for (const q of all.filter((x) => x.id.startsWith('transfer-'))) {
      const [, m, n] = q.id.split('-');
      const a = ION_CHARGE[m], b = -ION_CHARGE[n];
      const g = gcd(a, b); const metalAtoms = b / g; // lowest-terms ratio
      expect(Number(text(q, q.correct)), q.id).toBe(metalAtoms * a);
    }
  });
  it('noble-gas questions: the named gas has the ion\'s electron count', () => {
    const NOBLE_Z: Record<string, number> = { He: 2, Ne: 10, Ar: 18, Kr: 36 };
    for (const q of all.filter((x) => x.id.startsWith('noble-'))) {
      const sym = q.id.split('-')[1]; const z = getElement([3, 11, 19, 12, 20, 13, 9, 17, 35, 8, 16, 7].find((n) => getElement(n)!.symbol === sym)!)!.number;
      const gas = text(q, q.correct).match(/\((\w+)\)/)![1];
      expect(NOBLE_Z[gas], q.id).toBe(z - ION_CHARGE[sym]);
    }
  });
  it('lone-pair questions match the textbook counts', () => {
    const EXPECT: Record<string, number> = { 'cl2-Cl': 3, 'o2-O': 2, 'n2-N': 1, 'hcl-Cl': 3, 'h2o-O': 2, 'nh3-N': 1, 'co2-O': 2 };
    const lq = all.filter((x) => x.id.startsWith('lonepairs-'));
    expect(lq).toHaveLength(Object.keys(EXPECT).length);
    for (const q of lq) expect(Number(text(q, q.correct)), q.id).toBe(EXPECT[q.id.replace('lonepairs-', '')]);
  });
  it('bond-type questions match the textbook bonds', () => {
    const EXPECT: Record<string, string> = { h2: 'single', cl2: 'single', o2: 'double', n2: 'triple', hcl: 'single', h2o: 'single', nh3: 'single', ch4: 'single', co2: 'double' };
    for (const q of all.filter((x) => x.id.startsWith('bondtype-'))) expect(text(q, q.correct), q.id).toContain(EXPECT[q.id.replace('bondtype-', '')]);
  });
});

describe('a quiz for a seed', () => {
  it('has ten unique questions of the intended mix and is deterministic', () => {
    for (let seed = 0; seed < 100; seed++) {
      const qs = bondingQuestions(seed);
      expect(qs).toHaveLength(BONDING_QUIZ_LENGTH);
      expect(new Set(qs.map((q) => q.id)).size).toBe(BONDING_QUIZ_LENGTH);
      const kinds = qs.map((q) => q.id.split('-')[0]).sort();
      expect(kinds).toEqual(['bondtype', 'bondtype', 'charge', 'formula', 'formula', 'formula', 'lonepairs', 'lonepairs', 'noble', 'transfer']);
      expect(bondingQuestions(seed).map((q) => q.id)).toEqual(qs.map((q) => q.id));
    }
  });
  it('varies between seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 50; seed++) bondingQuestions(seed).forEach((q) => seen.add(q.id));
    expect(seen.size).toBeGreaterThan(60);
  });
});
