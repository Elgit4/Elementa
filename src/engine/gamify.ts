import { LESSONS } from '../data/lessons';
import { BONDING_QUIZ_ID } from './bondingQuiz';
import { TRENDS_QUIZ_ID } from './trendsQuiz';
import { bestScore, dayKey, type Progress } from './progress';

/**
 * Game layer. Everything here is derived from the progress the app already stores,
 * so there is no new storage and no migration. XP is a motivation tool, not a measure
 * of exam readiness: the honest learning signal is still the quiz score and mastery.
 */

export const LESSON_XP = 100;
export const ATTEMPT_BASE_XP = 5;
export const CORRECT_XP = 2;
export const DAILY_XP = 15;
export const DAILY_CORRECT_BONUS_XP = 10;

export function totalXp(p: Progress): number {
  const lessons = p.completedLessons.length * LESSON_XP;
  const attempts = p.attempts.reduce((sum, a) => sum + ATTEMPT_BASE_XP + CORRECT_XP * Math.max(0, Math.min(a.correct, a.total)), 0);
  const daily = Object.values(p.daily).reduce((sum, d) => sum + DAILY_XP + (d.correct ? DAILY_CORRECT_BONUS_XP : 0), 0);
  return lessons + attempts + daily;
}

export interface LevelInfo {
  level: number;
  title: string;
  /** XP earned inside this level. */
  into: number;
  /** XP needed to complete this level. */
  span: number;
  /** 0 to 1. */
  fraction: number;
  toNext: number;
}

const TITLES = ['Novice', 'Apprentice', 'Lab assistant', 'Chemist', 'Senior chemist', 'Master chemist'];
/** XP at which a level starts. Level 1 starts at 0, level 2 at 50, level 3 at 200, level 4 at 450 ... */
export const levelStart = (level: number) => 50 * (level - 1) * (level - 1);

export function levelInfo(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(safe / 50)) + 1;
  const start = levelStart(level), end = levelStart(level + 1);
  return { level, title: TITLES[Math.min(level, TITLES.length) - 1], into: safe - start, span: end - start, fraction: (safe - start) / (end - start), toNext: end - safe };
}

function activeDays(p: Progress): Set<string> {
  const days = new Set(Object.keys(p.daily));
  for (const a of p.attempts) { const d = new Date(a.at); if (!Number.isNaN(d.getTime())) days.add(dayKey(d)); }
  return days;
}

const addDays = (d: Date, n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };

/**
 * Consecutive days with any activity (a daily challenge or a quiz attempt), counted back from today.
 * If today has no activity yet the streak is still alive as long as yesterday had some, so a student
 * is not shown a zero before they have had the chance to study today.
 */
export function streak(p: Progress, today: Date): number {
  const days = activeDays(p);
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(dayKey(cursor))) { n++; cursor = addDays(cursor, -1); }
  return n;
}

export const activeToday = (p: Progress, today: Date) => activeDays(p).has(dayKey(today));

export interface Badge { id: string; title: string; how: string; earned: boolean }

export function badges(p: Progress, today: Date): Badge[] {
  const lessonQuiz = LESSONS[0]?.quizId;
  const tried = (id: string | undefined) => !!id && p.attempts.some((a) => a.quizId === id);
  const best = (id: string) => bestScore(p, id) ?? 0;
  return [
    { id: 'first-lesson', title: 'First lesson', how: 'Finish a lesson and its quiz.', earned: p.completedLessons.length > 0 },
    { id: 'perfect', title: 'Perfect score', how: 'Score 100% in any quiz.', earned: p.attempts.some((a) => a.total > 0 && a.correct === a.total) },
    { id: 'bonding', title: 'Bond maker', how: 'Score 80% or more in the bonding practice.', earned: best(BONDING_QUIZ_ID) >= 80 },
    { id: 'trends', title: 'Trend spotter', how: 'Score 80% or more in the periodic trends practice.', earned: best(TRENDS_QUIZ_ID) >= 80 },
    { id: 'all-rounder', title: 'All-rounder', how: 'Try the lesson quiz, bonding practice and trends practice.', earned: tried(lessonQuiz) && tried(BONDING_QUIZ_ID) && tried(TRENDS_QUIZ_ID) },
    { id: 'daily-3', title: 'Daily habit', how: 'Answer 3 daily challenges.', earned: Object.keys(p.daily).length >= 3 },
    { id: 'streak-3', title: 'Three-day streak', how: 'Study 3 days in a row.', earned: streak(p, today) >= 3 },
    { id: 'explorer', title: 'Explorer', how: 'Open 5 different elements.', earned: new Set(p.recentElements).size >= 5 },
  ];
}

export interface Quest { id: string; title: string; detail: string; href: string; done: boolean }

/** Three small goals for today. Each can be checked from stored progress, so none is ever shown as done by guesswork. */
export function quests(p: Progress, today: Date): Quest[] {
  const key = dayKey(today);
  const attemptToday = p.attempts.some((a) => { const d = new Date(a.at); return !Number.isNaN(d.getTime()) && dayKey(d) === key; });
  const lesson = LESSONS[0];
  return [
    { id: 'daily', title: 'Answer the daily challenge', detail: `+${DAILY_XP} XP`, href: '#/', done: p.daily[key] !== undefined },
    { id: 'practise', title: 'Finish a practice quiz', detail: `+${ATTEMPT_BASE_XP} XP and ${CORRECT_XP} XP per correct answer`, href: '#/lab', done: attemptToday },
    lesson
      ? { id: 'lesson', title: p.completedLessons.includes(lesson.id) ? 'Revise a lesson' : 'Complete your first lesson', detail: p.completedLessons.includes(lesson.id) ? 'Lesson already completed' : `+${LESSON_XP} XP`, href: `#/learn/${lesson.id}`, done: p.completedLessons.includes(lesson.id) }
      : { id: 'lesson', title: 'Explore the periodic table', detail: 'Open any element', href: '#/explore', done: p.recentElements.length > 0 },
  ];
}
