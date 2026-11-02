import { ELEMENTS } from '../data';
import type { ElementData } from '../data/types';
import { seededShuffle, type Choice, type Question } from './quiz';
import { TREND_BY_ID, trendValue, withUnit, type Trend, type TrendId } from './trends';

/** Progress id for attempts at the periodic-trends practice quiz. */
export const TRENDS_QUIZ_ID = 'trends';
export const TRENDS_QUIZ_LENGTH = 10;

const IDS = ['a', 'b', 'c', 'd'];
const MAIN_GROUPS = [1, 2, 13, 14, 15, 16, 17];
const label = (e: ElementData) => `${e.name} (${e.symbol})`;

type Dir = 'max' | 'min';
const PHRASE: Record<TrendId, Record<Dir, string>> = {
  radius: { max: 'the largest atomic radius', min: 'the smallest atomic radius' },
  ionisation: { max: 'the highest first ionisation energy', min: 'the lowest first ionisation energy' },
  electronegativity: { max: 'the highest electronegativity', min: 'the lowest electronegativity' },
};

interface Scope { kind: 'period' | 'group'; n: number; members: ElementData[] }

/** Main-group elements of periods 2 to 5 (across) and of groups 1, 2, 13 to 17 from period 2 down (down). */
function scopes(): Scope[] {
  const main = ELEMENTS.filter((e) => e.period !== null && e.period >= 2 && e.period <= 6 && e.group !== null && MAIN_GROUPS.includes(e.group));
  const out: Scope[] = [];
  for (const p of [2, 3, 4, 5]) out.push({ kind: 'period', n: p, members: main.filter((e) => e.period === p).sort((a, b) => a.number - b.number) });
  for (const g of MAIN_GROUPS) out.push({ kind: 'group', n: g, members: main.filter((e) => e.group === g).sort((a, b) => a.number - b.number) });
  return out;
}

function subsets4<T>(xs: T[]): T[][] {
  const r: T[][] = [];
  for (let a = 0; a < xs.length; a++) for (let b = a + 1; b < xs.length; b++) for (let c = b + 1; c < xs.length; c++) for (let d = c + 1; d < xs.length; d++) r.push([xs[a], xs[b], xs[c], xs[d]]);
  return r;
}

/**
 * Which end of the list the general trend predicts for a given extreme.
 * Radius: biggest at the left of a period and the bottom of a group. Ionisation energy and electronegativity: the reverse.
 */
function expectedAnswer(t: Trend, scope: Scope, dir: Dir, set: ElementData[]): ElementData {
  const ordered = [...set].sort((a, b) => (scope.kind === 'period' ? a.group! - b.group! : a.period! - b.period!));
  const first = ordered[0], last = ordered[ordered.length - 1];
  const bigAtEnd = t.id === 'radius' ? scope.kind === 'group' : scope.kind === 'period' ? true : false;
  const maxEl = bigAtEnd ? last : first;
  return dir === 'max' ? maxEl : (maxEl === last ? first : last);
}

function build(t: Trend, scope: Scope, dir: Dir, set: ElementData[]): Question | null {
  const vals = set.map((e) => trendValue(t, e));
  if (vals.some((v) => v === null) || new Set(vals).size !== 4) return null;
  const v = (e: ElementData) => trendValue(t, e)!;
  const answer = set.reduce((best, e) => ((dir === 'max' ? v(e) > v(best) : v(e) < v(best)) ? e : best));
  // Only ask when the data agrees with the general trend, so the explanation never contradicts the answer.
  if (answer !== expectedAnswer(t, scope, dir, set)) return null;
  const word = dir === 'max' ? 'greater' : 'smaller';
  const wrong = set.filter((e) => e !== answer);
  const where = scope.kind === 'period' ? `period ${scope.n}` : `group ${scope.n}`;
  const rule = scope.kind === 'period' ? t.across : t.down;
  const choices: Choice[] = [answer, ...wrong].map((e, i) => ({ id: IDS[i], text: label(e) }));
  const distractorNotes: Record<string, string> = {};
  wrong.forEach((e, i) => { distractorNotes[IDS[i + 1]] = `${label(e)} is ${withUnit(t, v(e))}, which is ${word === 'greater' ? 'less' : 'more'} than ${label(answer)} at ${withUnit(t, v(answer))}.`; });
  return {
    id: `${t.id}-${dir}-${scope.kind}${scope.n}-${set.map((e) => e.symbol).join('')}`,
    stem: `Which of these ${where} elements has ${PHRASE[t.id][dir]}?`,
    choices, correct: 'a', distractorNotes,
    explanation: `${rule} In this set, ${label(answer)} is ${withUnit(t, v(answer))}, ${word} than the others.`,
  };
}

let POOL: Question[] | null = null;
/** Every question that can be asked. Built once from the element data and the trend definitions. */
export function allTrendsQuestions(): Question[] {
  if (POOL) return POOL;
  const out: Question[] = [];
  for (const t of Object.values(TREND_BY_ID)) for (const s of scopes()) for (const set of subsets4(s.members)) for (const dir of ['max', 'min'] as Dir[]) {
    const q = build(t, s, dir, set);
    if (q) out.push(q);
  }
  return (POOL = out);
}

/** A fresh set of questions, mixed across the three trends, shuffled with the seed. */
export function trendsQuestions(seed: number): Question[] {
  const pool = seededShuffle(allTrendsQuestions(), seed);
  const per: Record<string, number> = {};
  const cap = Math.ceil(TRENDS_QUIZ_LENGTH / 3);
  const picked: Question[] = [];
  for (const q of pool) {
    const k = q.id.split('-')[0];
    if ((per[k] ?? 0) >= cap) continue;
    per[k] = (per[k] ?? 0) + 1; picked.push(q);
    if (picked.length === TRENDS_QUIZ_LENGTH) break;
  }
  return picked;
}
