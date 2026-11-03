import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { Question } from '../engine/quiz';
import { evaluate, score, seededShuffle, type Evaluation } from '../engine/quiz';
import { ChemistryMascot } from './ChemistryMascot';

interface Props {
  questions: Question[];
  seed: number;
  onFinish: (result: { correct: number; total: number }) => void;
  finishLabel?: string;
  resultActions?: ReactNode;
}

export function Quiz({ questions, seed, onFinish, finishLabel = 'Finish', resultActions }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState<{ q: Question; choice: string }[]>([]);
  const headRef = useRef<HTMLHeadingElement>(null);

  const q = questions[index];
  const choices = useMemo(() => seededShuffle(q?.choices ?? [], seed * 31 + index + 1), [q, seed, index]);
  useEffect(() => { headRef.current?.focus(); }, [index, done]);

  if (done) {
    const s = score(answers);
    return (
      <section className="quiz-result card" aria-labelledby="qr-title">
        <div className="quiz-result-hero"><ChemistryMascot mood={s.percent >= 80 ? "cheer" : s.percent >= 50 ? "think" : "focus"} size={112} /><div><span className="eyebrow">{s.percent >= 80 ? "EXCELLENT PROGRESS" : s.percent >= 50 ? "KEEP BUILDING" : "A CHANCE TO LEARN"}</span><h2 id="qr-title" ref={headRef} tabIndex={-1}>You scored {s.correct} out of {s.total}</h2><strong className="quiz-result-percent">{s.percent}%</strong></div></div>
        <p className="muted">{s.percent >= 80 ? 'Strong work. You can move on, or revisit the lesson to keep it fresh.' : s.percent >= 50 ? 'A good start. Read the explanations below, then try again.' : 'This topic needs another look. Read the lesson again, then retry the quiz.'}</p>
        {missed.length > 0 && (
          <div className="missed">
            <h3>Questions to review</h3>
            <ul>
              {missed.map(({ q: mq, choice }) => {
                const ev = evaluate(mq, choice);
                return (
                  <li key={mq.id}>
                    <p><b>{mq.stem}</b></p>
                    <p>You chose: {mq.choices.find((c) => c.id === choice)!.text}. {ev.feedback.wrongNote}</p>
                    <p>Correct answer: {mq.choices.find((c) => c.id === mq.correct)!.text}. {mq.explanation}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="row">{resultActions}</div>
      </section>
    );
  }

  const check = () => {
    if (!selected) return;
    const ev = evaluate(q, selected);
    setResult(ev);
    setAnswers((a) => ({ ...a, [q.id]: ev.correct }));
    if (!ev.correct) setMissed((m) => [...m, { q, choice: selected }]);
  };
  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
      const s = score(answers);
      onFinish({ correct: s.correct, total: s.total });
    } else {
      setIndex(index + 1); setSelected(null); setResult(null);
    }
  };

  return (
    <section className="quiz card" aria-labelledby="q-title">
      <p className="muted small" aria-live="polite">Question {index + 1} of {questions.length}</p>
      <progress className="bar" value={index + (result ? 1 : 0)} max={questions.length} aria-label="Quiz progress" />
      <h2 id="q-title" ref={headRef} tabIndex={-1}>{q.stem}</h2>
      <div role="radiogroup" aria-labelledby="q-title" className="choices">
        {choices.map((c) => {
          const state = result ? (c.id === q.correct ? 'right' : c.id === selected ? 'wrong' : 'idle') : 'idle';
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={selected === c.id}
              className="choice"
              data-state={state}
              disabled={result !== null}
              onClick={() => setSelected(c.id)}
            >
              <span className="choice-text">{c.text}</span>
              {state === 'right' && <span className="choice-flag"><Check size={16} aria-hidden="true" /> Correct answer</span>}
              {state === 'wrong' && <span className="choice-flag"><X size={16} aria-hidden="true" /> Your answer</span>}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {result && (
          <div className={`feedback ${result.correct ? 'good' : 'bad'}`}>
            <ChemistryMascot mood={result.correct ? "cheer" : "think"} size={76} className="feedback-mascot" />
            <div className="feedback-copy"><p><b>{result.correct ? 'Correct.' : 'Not quite.'}</b> {result.feedback.wrongNote}</p>
            <p>{result.feedback.explanation}</p></div>
          </div>
        )}
      </div>
      <div className="row">
        {!result ? (
          <button className="btn primary" onClick={check} disabled={!selected}>Check answer</button>
        ) : (
          <button className="btn primary" onClick={next}>{index + 1 >= questions.length ? finishLabel : 'Next question'}</button>
        )}
      </div>
    </section>
  );
}
