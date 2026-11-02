import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { ELEMENTS, getElement } from '../data';
import { chargeLabel, ionCharges, ionShells, isotopeNotation, particles } from '../engine/atom';
import { searchElements } from '../engine/search';
import { evaluate, score, seededShuffle } from '../engine/quiz';
import { QUESTIONS } from '../data/lessons';
import * as P from '../engine/progress';
import { IdbProgressStore } from '../storage/store';

describe('particles', () => {
  it('counts C-12 and C-14 correctly', () => {
    expect(particles(6, 12)).toMatchObject({ protons: 6, neutrons: 6, electrons: 6 });
    expect(particles(6, 14)).toMatchObject({ protons: 6, neutrons: 8, electrons: 6 });
  });
  it('removes electrons for cations and adds for anions', () => {
    expect(particles(12, 24, 2)).toMatchObject({ electrons: 10, charge: 2 });
    expect(particles(17, 35, -1)).toMatchObject({ electrons: 18, charge: -1 });
  });
  it('rejects impossible inputs', () => {
    expect(() => particles(6, 5)).toThrow();
    expect(() => particles(1, 1, 2)).toThrow();
    expect(() => particles(0, 1)).toThrow();
  });
});

describe('ion shells (simplified model)', () => {
  const sh = (s: string) => getElement(ELEMENTS.findIndex((e) => e.symbol === s) + 1)!.shells;
  it('gives the textbook arrangements', () => {
    expect(ionShells(sh('Na'), 1)).toEqual([2, 8]);
    expect(ionShells(sh('Mg'), 2)).toEqual([2, 8]);
    expect(ionShells(sh('Al'), 3)).toEqual([2, 8]);
    expect(ionShells(sh('Cl'), -1)).toEqual([2, 8, 8]);
    expect(ionShells(sh('O'), -2)).toEqual([2, 8]);
    expect(ionShells(sh('Fe'), 2)).toEqual([2, 8, 14]);
    expect(ionShells(sh('Fe'), 3)).toEqual([2, 8, 13]);
    expect(ionShells(sh('H'), 1)).toEqual([]);
  });
  it('offers only common, correctly modelled ions', () => {
    const ch = (sym: string) => ionCharges(ELEMENTS.find((e) => e.symbol === sym)!);
    expect(ch('Na')).toEqual([0, 1]);
    expect(ch('Mg')).toEqual([0, 2]);
    expect(ch('Al')).toEqual([0, 3]);
    expect(ch('Cl')).toEqual([-1, 0]);
    expect(ch('O')).toEqual([-2, 0]);
    expect(ch('N')).toEqual([-3, 0]);
    expect(ch('H')).toEqual([-1, 0, 1]);
    expect(ch('Fe')).toEqual([0, 2, 3]);
    expect(ch('Cu')).toEqual([0, 1, 2]);
    expect(ch('Ne')).toEqual([0]);
    expect(ch('He')).toEqual([0]);
    expect(ch('C')).toEqual([0]);
    expect(ch('Pb')).toEqual([0]);
  });
  it('every offered ion has a non-negative electron count and shells matching it', () => {
    for (const e of ELEMENTS) {
      for (const c of ionCharges(e)) {
        const shells = ionShells(e.shells, c)!;
        expect(shells.reduce((a, b) => a + b, 0), `${e.symbol} ${c}`).toBe(e.number - c);
      }
    }
  });
});

describe('labels', () => {
  it('formats charge and isotope notation', () => {
    expect(chargeLabel(2)).toBe('2+');
    expect(chargeLabel(-1)).toBe('−');
    expect(isotopeNotation('C', 14)).toBe('¹⁴C');
  });
});

describe('search', () => {
  it('finds by atomic number, symbol and name', () => {
    expect(searchElements(ELEMENTS, '26').map((e) => e.symbol)).toEqual(['Fe']);
    expect(searchElements(ELEMENTS, 'fe')[0].symbol).toBe('Fe');
    expect(searchElements(ELEMENTS, 'Iron')[0].symbol).toBe('Fe');
    expect(searchElements(ELEMENTS, 'sod')[0].symbol).toBe('Na');
    expect(searchElements(ELEMENTS, 'zzz')).toEqual([]);
    expect(searchElements(ELEMENTS, '')).toHaveLength(118);
  });
  it('every one of the 118 elements is findable by number, symbol and name', () => {
    for (const e of ELEMENTS) {
      expect(searchElements(ELEMENTS, String(e.number)).map((x) => x.number)).toEqual([e.number]);
      expect(searchElements(ELEMENTS, e.symbol)[0].number).toBe(e.number);
      expect(searchElements(ELEMENTS, e.name)[0].number).toBe(e.number);
    }
  });
});

describe('quiz', () => {
  it('has valid, answerable questions with explanations', () => {
    for (const q of QUESTIONS) {
      expect(q.choices.some((c) => c.id === q.correct), q.id).toBe(true);
      expect(q.explanation.length, q.id).toBeGreaterThan(20);
      for (const c of q.choices) if (c.id !== q.correct) expect(q.distractorNotes[c.id], `${q.id}/${c.id}`).toBeTruthy();
      expect(new Set(q.choices.map((c) => c.id)).size).toBe(q.choices.length);
    }
  });
  it('evaluates correct and wrong answers', () => {
    const q = QUESTIONS[0];
    expect(evaluate(q, q.correct).correct).toBe(true);
    const wrong = q.choices.find((c) => c.id !== q.correct)!.id;
    const r = evaluate(q, wrong);
    expect(r.correct).toBe(false);
    expect(r.feedback.wrongNote).toBeTruthy();
    expect(() => evaluate(q, 'nope')).toThrow();
  });
  it('scores and shuffles deterministically', () => {
    expect(score({ a: true, b: false, c: true })).toEqual({ total: 3, correct: 2, percent: 67 });
    expect(seededShuffle([1, 2, 3, 4, 5], 7)).toEqual(seededShuffle([1, 2, 3, 4, 5], 7));
    expect([...seededShuffle([1, 2, 3, 4, 5], 7)].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('quiz answers agree with the element data', () => {
  const byId = (id: string) => QUESTIONS.find((q) => q.id === id)!;
  const text = (id: string) => byId(id).choices.find((c) => c.id === byId(id).correct)!.text;
  it('Na has 11 protons; Cl-35 has 17 electrons; C-14 has 8 neutrons; K-39 mass number', () => {
    expect(text('protons-na')).toBe(String(getElement(11)!.number));
    expect(text('electrons-cl')).toBe(String(particles(17, 35).electrons));
    expect(text('neutrons-c14')).toBe(String(particles(6, 14).neutrons));
    expect(text('mass-number-k')).toBe(String(19 + 20));
    expect(text('electrons-mg2')).toBe(String(particles(12, 24, 2).electrons));
    expect(text('shells-cl').replace(/, /g, ',')).toBe(getElement(17)!.shells.join(','));
    expect(ionShells(getElement(11)!.shells, 1)).toEqual(getElement(10)!.shells);
  });
});

describe('progress', () => {
  it('records attempts, mastery and recent elements', () => {
    let p = P.emptyProgress();
    p = P.viewElement(p, 26);
    p = P.viewElement(p, 6);
    p = P.viewElement(p, 26);
    expect(p.recentElements).toEqual([26, 6]);
    p = P.recordAttempt(p, { quizId: 'q', at: 'x', correct: 3, total: 4 });
    p = P.recordAttempt(p, { quizId: 'q', at: 'y', correct: 4, total: 4 });
    expect(P.bestScore(p, 'q')).toBe(100);
    expect(P.mastery(p, 'q')).toBe(88);
    expect(P.bestScore(p, 'none')).toBeNull();
  });
  it('migrates garbage and old shapes safely', () => {
    expect(P.migrate(null)).toEqual(P.emptyProgress());
    expect(P.migrate({ completedLessons: 'x', attempts: 5 }).completedLessons).toEqual([]);
    expect(P.migrate({ completedLessons: ['a'] }).completedLessons).toEqual(['a']);
  });
  it('persists through the IndexedDB store across instances (simulated reload)', async () => {
    const a = new IdbProgressStore();
    let p = await a.load();
    p = P.completeLesson(P.recordAttempt(p, { quizId: 'q', at: 't', correct: 5, total: 6 }), 'atoms');
    await a.save(p);
    const b = new IdbProgressStore();
    const loaded = await b.load();
    expect(loaded.completedLessons).toEqual(['atoms']);
    expect(loaded.attempts).toHaveLength(1);
  });
});
