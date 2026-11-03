import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/lessons';
import { BONDING_QUIZ_ID, TRENDS_QUIZ_ID } from '../engine/quizIds';
import { activeToday, badges, levelInfo, levelStart, quests, streak, totalXp } from '../engine/gamify';
import { emptyProgress, recordAttempt, recordDaily, completeLesson, type Progress } from '../engine/progress';

const D = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const att = (p: Progress, quizId: string, at: Date, correct: number, total = 10) => recordAttempt(p, { quizId, at: at.toISOString(), correct, total });
const today = D(2026, 11, 1);

describe('xp and levels', () => {
  it('empty progress is 0 XP, level 1, nothing earned', () => {
    const p = emptyProgress();
    expect(totalXp(p)).toBe(0);
    expect(levelInfo(0)).toMatchObject({ level: 1, title: 'Novice', into: 0, span: 50, fraction: 0, toNext: 50 });
    expect(badges(p, today).every((b) => !b.earned)).toBe(true);
    expect(streak(p, today)).toBe(0);
  });
  it('XP follows the documented rules (hand-worked)', () => {
    let p = emptyProgress();
    p = completeLesson(p, 'atoms');                 // 100
    p = att(p, 'bonding', today, 7);                // 5 + 14 = 19
    p = att(p, 'trends', today, 10);                // 5 + 20 = 25
    p = recordDaily(p, '2026-11-01', true);         // 15 + 10 = 25
    p = recordDaily(p, '2026-10-31', false);        // 15
    expect(totalXp(p)).toBe(100 + 19 + 25 + 25 + 15);
  });
  it('a corrupt attempt cannot inflate XP', () => {
    const p = att(emptyProgress(), 'x', today, 99, 10);
    expect(totalXp(p)).toBe(5 + 2 * 10);
    expect(totalXp(att(emptyProgress(), 'x', today, -4, 10))).toBe(5);
  });
  it('level boundaries: 49 XP is level 1, 50 is level 2, 199 is 2, 200 is 3, 450 is 4', () => {
    expect([0, 49, 50, 199, 200, 449, 450].map((x) => levelInfo(x).level)).toEqual([1, 1, 2, 2, 3, 3, 4]);
    expect([1, 2, 3, 4].map(levelStart)).toEqual([0, 50, 200, 450]);
  });
  it('level info is consistent: into + toNext = span, fraction within [0,1), titles exist at every level', () => {
    for (let xp = 0; xp < 5000; xp += 7) {
      const l = levelInfo(xp);
      expect(l.into + l.toNext).toBe(l.span);
      expect(l.fraction).toBeGreaterThanOrEqual(0); expect(l.fraction).toBeLessThan(1);
      expect(l.title.length).toBeGreaterThan(0);
    }
  });
});

describe('streak', () => {
  it('counts consecutive days back from today', () => {
    let p = emptyProgress();
    for (const d of [1, 31, 30]) p = recordDaily(p, d === 1 ? '2026-11-01' : `2026-10-${d}`, true);
    expect(streak(p, today)).toBe(3);
  });
  it('is still alive if only yesterday was active, and 0 if the last activity was two days ago', () => {
    expect(streak(recordDaily(emptyProgress(), '2026-10-31', true), today)).toBe(1);
    expect(streak(recordDaily(emptyProgress(), '2026-10-30', true), today)).toBe(0);
  });
  it('a gap breaks it, and quiz attempts count as activity', () => {
    let p = recordDaily(emptyProgress(), '2026-11-01', true);
    p = att(p, 'bonding', D(2026, 10, 30), 5);       // 31 Oct missing
    expect(streak(p, today)).toBe(1);
    p = att(p, 'bonding', D(2026, 10, 31), 5);
    expect(streak(p, today)).toBe(3);
  });
  it('crosses month and year boundaries', () => {
    let p = emptyProgress();
    p = recordDaily(p, '2027-01-01', true); p = recordDaily(p, '2026-12-31', true); p = recordDaily(p, '2026-12-30', true);
    expect(streak(p, D(2027, 1, 1))).toBe(3);
  });
  it('ignores unparsable timestamps', () => {
    const p = recordAttempt(emptyProgress(), { quizId: 'x', at: 'not a date', correct: 1, total: 2 });
    expect(streak(p, today)).toBe(0); expect(activeToday(p, today)).toBe(false);
  });
});

describe('badges and quests', () => {
  const id = (p: Progress, b: string) => badges(p, today).find((x) => x.id === b)!.earned;
  it('score badges need 80% or more, not just an attempt', () => {
    expect(id(att(emptyProgress(), BONDING_QUIZ_ID, today, 7), 'bonding')).toBe(false);
    expect(id(att(emptyProgress(), BONDING_QUIZ_ID, today, 8), 'bonding')).toBe(true);
    expect(id(att(emptyProgress(), TRENDS_QUIZ_ID, today, 8), 'trends')).toBe(true);
    expect(id(att(emptyProgress(), TRENDS_QUIZ_ID, today, 8), 'bonding')).toBe(false);
  });
  it('perfect score needs correct === total with a non-zero total', () => {
    expect(id(att(emptyProgress(), 'x', today, 10), 'perfect')).toBe(true);
    expect(id(att(emptyProgress(), 'x', today, 9), 'perfect')).toBe(false);
    expect(id(att(emptyProgress(), 'x', today, 0, 0), 'perfect')).toBe(false);
  });
  it('all-rounder needs all three quizzes', () => {
    let p = att(emptyProgress(), LESSONS[0].quizId, today, 1); p = att(p, BONDING_QUIZ_ID, today, 1);
    expect(id(p, 'all-rounder')).toBe(false);
    expect(id(att(p, TRENDS_QUIZ_ID, today, 1), 'all-rounder')).toBe(true);
  });
  it('daily habit, explorer and first lesson', () => {
    let p = recordDaily(recordDaily(emptyProgress(), '2026-10-01', true), '2026-10-02', false);
    expect(id(p, 'daily-3')).toBe(false); expect(id(recordDaily(p, '2026-10-03', true), 'daily-3')).toBe(true);
    expect(id({ ...emptyProgress(), recentElements: [1, 2, 3, 4] }, 'explorer')).toBe(false);
    expect(id({ ...emptyProgress(), recentElements: [1, 2, 3, 4, 5] }, 'explorer')).toBe(true);
    expect(id(completeLesson(emptyProgress(), 'atoms'), 'first-lesson')).toBe(true);
  });
  it('every badge has a unique id and a way to earn it', () => {
    const b = badges(emptyProgress(), today);
    expect(new Set(b.map((x) => x.id)).size).toBe(b.length);
    for (const x of b) { expect(x.title.length).toBeGreaterThan(0); expect(x.how.length).toBeGreaterThan(10); }
  });
  it('quests are only done when stored progress proves it', () => {
    const q0 = quests(emptyProgress(), today);
    expect(q0).toHaveLength(3); expect(q0.every((q) => !q.done)).toBe(true);
    let p = recordDaily(emptyProgress(), '2026-11-01', false);
    expect(quests(p, today).find((q) => q.id === 'daily')!.done).toBe(true);
    p = att(p, 'bonding', D(2026, 10, 31), 5);                    // yesterday does not count
    expect(quests(p, today).find((q) => q.id === 'practise')!.done).toBe(false);
    p = att(p, 'bonding', today, 5);
    expect(quests(p, today).find((q) => q.id === 'practise')!.done).toBe(true);
    p = completeLesson(p, LESSONS[0].id);
    expect(quests(p, today).find((q) => q.id === 'lesson')!.done).toBe(true);
  });
});
