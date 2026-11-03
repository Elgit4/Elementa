import { ELEMENT_LABELS } from '../data/element-labels';
import type { Question } from './quiz';
import { seededShuffle } from './quiz';

/** Elements used for the daily challenge: the first 30, which are the most common in early courses. */
const POOL = ELEMENT_LABELS.slice(0, 30);

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Same question for everyone on the same date key (YYYY-MM-DD). */
export function dailyQuestion(dateKey: string): Question {
  const seed = hashString(dateKey);
  const answer = POOL[seed % POOL.length];
  const kind = (seed >>> 8) % 3;
  const others = seededShuffle(POOL.filter((e) => e.number !== answer.number), seed).slice(0, 3);
  const options = seededShuffle([answer, ...others], seed ^ 0x9e3779b9);
  const ids = ['a', 'b', 'c', 'd'];
  const make = (stem: string, text: (e: (typeof POOL)[number]) => string, explanation: string, note: (e: (typeof POOL)[number]) => string): Question => ({
    id: `daily-${dateKey}`,
    stem,
    choices: options.map((e, i) => ({ id: ids[i], text: text(e) })),
    correct: ids[options.indexOf(answer)],
    explanation,
    distractorNotes: Object.fromEntries(options.map((e, i) => [ids[i], note(e)])),
  });
  if (kind === 0) {
    return make(`Which element has the symbol ${answer.symbol}?`, (e) => e.name,
      `${answer.symbol} is the symbol for ${answer.name} (atomic number ${answer.number}).`,
      (e) => `${e.name} has the symbol ${e.symbol}.`);
  }
  if (kind === 1) {
    return make(`Which element has atomic number ${answer.number}?`, (e) => e.name,
      `${answer.name} has ${answer.number} protons, so its atomic number is ${answer.number}.`,
      (e) => `${e.name} has atomic number ${e.number}.`);
  }
  return make(`How many protons does an atom of ${answer.name} have?`, (e) => String(e.number),
    `The number of protons is the atomic number. ${answer.name} has ${answer.number}.`,
    (e) => `${e.number} is the atomic number of ${e.name}.`);
}
