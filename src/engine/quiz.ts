export interface Choice { id: string; text: string }

export interface Question {
  id: string;
  stem: string;
  choices: Choice[];
  correct: string;
  /** Why the correct answer is right. */
  explanation: string;
  /** Why the commonest wrong choices are tempting, keyed by choice id. */
  distractorNotes: Record<string, string>;
}

export interface Evaluation {
  correct: boolean;
  selected: string;
  /** Explanation of the concept, plus a note about the selected wrong choice when there is one. */
  feedback: { explanation: string; wrongNote: string | null };
}

export function evaluate(q: Question, selected: string): Evaluation {
  if (!q.choices.some((c) => c.id === selected)) throw new Error(`Unknown choice "${selected}" for ${q.id}`);
  const correct = selected === q.correct;
  return {
    correct,
    selected,
    feedback: { explanation: q.explanation, wrongNote: correct ? null : q.distractorNotes[selected] ?? null },
  };
}

export interface QuizResult { total: number; correct: number; percent: number }

export function score(answers: Record<string, boolean>): QuizResult {
  const total = Object.keys(answers).length;
  const correct = Object.values(answers).filter(Boolean).length;
  return { total, correct, percent: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

/** Deterministic shuffle so quiz order is stable for tests but varies per attempt via seed. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
