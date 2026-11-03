import { useId, useState } from 'react';
import '../styles-knowledge-check.css';
import { Check, X } from 'lucide-react';
import { evaluate, type Question } from '../engine/quiz';

export function KnowledgeCheck({ question }: { question: Question }) {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const evaluation = checked && selected ? evaluate(question, selected) : null;

  return (
    <section className="knowledge-check" aria-label="Section knowledge check">
      <span className="eyebrow">PAUSE AND CHECK</span>
      <fieldset className="knowledge-check-field" disabled={checked}>
        <legend>{question.stem}</legend>
        <div className="knowledge-check-options">
          {question.choices.map((choice) => {
            const isSelected = selected === choice.id;
            const isCorrect = checked && choice.id === question.correct;
            const isWrong = checked && isSelected && !evaluation?.correct;
            const state = isCorrect ? 'right' : isWrong ? 'wrong' : 'idle';

            return (
              <label className="knowledge-check-option" data-state={state} key={choice.id}>
                <input
                  type="radio"
                  name={id}
                  value={choice.id}
                  checked={isSelected}
                  onChange={() => setSelected(choice.id)}
                />
                <span>{choice.text}</span>
                {isCorrect && <span className="knowledge-check-mark"><Check size={15} aria-hidden="true" /> Correct</span>}
                {isWrong && <span className="knowledge-check-mark"><X size={15} aria-hidden="true" /> Your choice</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
      {evaluation ? (
        <div className={`knowledge-check-feedback ${evaluation.correct ? 'good' : 'bad'}`} role="status">
          <strong>{evaluation.correct ? 'That’s right.' : 'Not quite. Review this idea.'}</strong>
          {evaluation.feedback.wrongNote && <p>{evaluation.feedback.wrongNote}</p>}
          <p>{evaluation.feedback.explanation}</p>
        </div>
      ) : (
        <button className="btn primary knowledge-check-submit" type="button" disabled={!selected} onClick={() => setChecked(true)}>
          Check answer
        </button>
      )}
    </section>
  );
}
