import { describe, expect, it } from 'vitest';
import { ELEMENTS } from '../data';
import { allTrendsQuestions, trendsQuestions, TRENDS_QUIZ_LENGTH } from '../engine/trendsQuiz';
import { evaluate } from '../engine/quiz';

// Independent oracle: raw values taken straight from the dataset by symbol, not through the trend engine.
const raw = (sym: string, k: 'radius' | 'ionisation' | 'electronegativity') => {
  const e = ELEMENTS.find((x) => x.symbol === sym)!;
  return k === 'radius' ? e.radiusPm.calculated : k === 'ionisation' ? e.firstIonisationKJ : e.electronegativity;
};
const symOf = (text: string) => /\(([A-Z][a-z]?)\)$/.exec(text)![1];

describe('trends quiz', () => {
  const pool = allTrendsQuestions();
  it('has a large pool covering all three trends and both directions', () => {
    expect(pool.length).toBeGreaterThan(150);
    for (const k of ['radius', 'ionisation', 'electronegativity']) expect(pool.some((q) => q.id.startsWith(k + '-max'))).toBe(true);
    for (const k of ['radius', 'ionisation', 'electronegativity']) expect(pool.some((q) => q.id.startsWith(k + '-min'))).toBe(true);
  });
  it('every question: four distinct choices, one correct, every wrong choice has a note, ids unique', () => {
    expect(new Set(pool.map((q) => q.id)).size).toBe(pool.length);
    for (const q of pool) {
      expect(new Set(q.choices.map((c) => c.text)).size).toBe(4);
      expect(q.choices.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
      for (const c of q.choices.slice(1)) expect(q.distractorNotes?.[c.id]?.length).toBeGreaterThan(10);
    }
  });
  it('the marked answer really is the extreme of the dataset values (independent check)', () => {
    for (const q of pool) {
      const [k, dir] = q.id.split('-') as ['radius' | 'ionisation' | 'electronegativity', 'max' | 'min'];
      const vals = q.choices.map((c) => ({ id: c.id, v: raw(symOf(c.text), k) }));
      expect(vals.every((x) => typeof x.v === 'number')).toBe(true);
      const nums = vals.map((x) => x.v as number);
      expect(new Set(nums).size).toBe(4);
      const target = dir === 'max' ? Math.max(...nums) : Math.min(...nums);
      expect(vals.find((x) => x.v === target)!.id).toBe(q.correct);
    }
  });
  it('the stem wording matches the id', () => {
    for (const q of pool) {
      const [k, dir] = q.id.split('-');
      const want = { radius: dir === 'max' ? 'largest atomic radius' : 'smallest atomic radius', ionisation: dir === 'max' ? 'highest first ionisation energy' : 'lowest first ionisation energy', electronegativity: dir === 'max' ? 'highest electronegativity' : 'lowest electronegativity' }[k]!;
      expect(q.stem).toContain(want);
    }
  });
  it('known examples: period 3 radius and group 17 electronegativity', () => {
    const q = pool.find((x) => x.id === 'radius-max-period3-NaMgAlSi')!;
    expect(q.choices[0].text).toBe('Sodium (Na)');
    const g = pool.find((x) => x.id === 'electronegativity-max-group17-FClBrI')!;
    expect(g.choices[0].text).toBe('Fluorine (F)');
  });
  it('never asks a question whose answer contradicts the general trend (e.g. B vs Be)', () => {
    expect(pool.some((q) => q.id === 'ionisation-min-period2-BeBCN')).toBe(false);
  });
  it('quiz sets: right length, no repeated ids, mixed trends, deterministic by seed', () => {
    for (let s = 1; s <= 40; s++) {
      const qs = trendsQuestions(s);
      expect(qs.length).toBe(TRENDS_QUIZ_LENGTH);
      expect(new Set(qs.map((q) => q.id)).size).toBe(TRENDS_QUIZ_LENGTH);
      expect(new Set(qs.map((q) => q.id.split('-')[0])).size).toBe(3);
    }
    expect(trendsQuestions(7).map((q) => q.id)).toEqual(trendsQuestions(7).map((q) => q.id));
    expect(trendsQuestions(7).map((q) => q.id)).not.toEqual(trendsQuestions(8).map((q) => q.id));
  });
  it('evaluate marks right and wrong correctly with explanation', () => {
    const q = pool[0];
    expect(evaluate(q, q.correct).correct).toBe(true);
    const r = evaluate(q, 'b'); expect(r.correct).toBe(false); expect(r.feedback.wrongNote?.length ?? 0).toBeGreaterThan(10);
  });
});

describe('trends quiz distractor notes tell the truth', () => {
  it('"less/more than" matches the numbers for every wrong choice', () => {
    for (const q of allTrendsQuestions()) {
      const [k] = q.id.split('-') as ['radius' | 'ionisation' | 'electronegativity'];
      const ans = raw(symOf(q.choices[0].text), k) as number;
      for (const c of q.choices.slice(1)) {
        const v = raw(symOf(c.text), k) as number;
        const note = q.distractorNotes![c.id];
        expect(note).toContain(v < ans ? 'less than' : 'more than');
        expect(note).not.toContain(v < ans ? 'more than' : 'less than');
      }
    }
  });
});
