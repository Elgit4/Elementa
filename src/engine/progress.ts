export const PROGRESS_VERSION = 1;

export interface QuizAttempt {
  quizId: string;
  at: string; // ISO timestamp
  correct: number;
  total: number;
}

export interface Progress {
  version: number;
  completedLessons: string[];
  /** Highest section index reached per lesson (for "continue learning"). */
  lessonPosition: Record<string, number>;
  attempts: QuizAttempt[];
  recentElements: number[];
  daily: Record<string, { correct: boolean }>; // keyed by YYYY-MM-DD
  theme: 'dark' | 'light';
}

export const emptyProgress = (): Progress => ({
  version: PROGRESS_VERSION,
  completedLessons: [],
  lessonPosition: {},
  attempts: [],
  recentElements: [],
  daily: {},
  theme: 'dark',
});

/** Bring older stored shapes up to the current version without losing data. */
export function migrate(stored: unknown): Progress {
  const base = emptyProgress();
  if (!stored || typeof stored !== 'object') return base;
  const s = stored as Partial<Progress>;
  return {
    ...base,
    ...s,
    version: PROGRESS_VERSION,
    completedLessons: Array.isArray(s.completedLessons) ? s.completedLessons : [],
    lessonPosition: s.lessonPosition && typeof s.lessonPosition === 'object' ? s.lessonPosition : {},
    attempts: Array.isArray(s.attempts) ? s.attempts : [],
    recentElements: Array.isArray(s.recentElements) ? s.recentElements : [],
    daily: s.daily && typeof s.daily === 'object' ? s.daily : {},
    theme: s.theme === 'light' ? 'light' : 'dark',
  };
}

export function viewElement(p: Progress, n: number, max = 8): Progress {
  return { ...p, recentElements: [n, ...p.recentElements.filter((x) => x !== n)].slice(0, max) };
}

export function setLessonPosition(p: Progress, lessonId: string, index: number): Progress {
  const prev = p.lessonPosition[lessonId] ?? 0;
  const next = Math.max(prev, index);
  if (p.lessonPosition[lessonId] === next) return p;
  return { ...p, lessonPosition: { ...p.lessonPosition, [lessonId]: next } };
}

export function completeLesson(p: Progress, lessonId: string): Progress {
  return p.completedLessons.includes(lessonId) ? p : { ...p, completedLessons: [...p.completedLessons, lessonId] };
}

export function recordAttempt(p: Progress, a: QuizAttempt): Progress {
  return { ...p, attempts: [...p.attempts, a].slice(-50) };
}

export function bestScore(p: Progress, quizId: string): number | null {
  const xs = p.attempts.filter((a) => a.quizId === quizId && a.total > 0).map((a) => Math.round((a.correct / a.total) * 100));
  return xs.length ? Math.max(...xs) : null;
}

/** Mastery estimate for a quiz: mean of the last three attempts, as a percentage. A rough indicator, not a validated measure. */
export function mastery(p: Progress, quizId: string): number | null {
  const last = p.attempts.filter((a) => a.quizId === quizId && a.total > 0).slice(-3);
  if (!last.length) return null;
  return Math.round((last.reduce((s, a) => s + a.correct / a.total, 0) / last.length) * 100);
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function recordDaily(p: Progress, key: string, correct: boolean): Progress {
  return p.daily[key] ? p : { ...p, daily: { ...p.daily, [key]: { correct } } };
}
