import { useState } from 'react';
import { Check, Minus, Plus, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { REACTIONS, balanceMessage, balanceReport, displaySpecies, equationText, stateLabel, type Reaction } from '../engine/reactions';
import { ELEMENTS } from '../data';

const nameOf = (symbol: string) => ELEMENTS.find((e) => e.symbol === symbol)?.name ?? symbol;

function Stepper({ value, label, onChange }: { value: number; label: string; onChange: (n: number) => void }) {
  return (
    <span className="stepper" role="group" aria-label={`Coefficient of ${label}`}>
      <button className="chip" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease coefficient of ${label}`}><Minus size={14} aria-hidden="true" /></button>
      <output className="stepper-val" aria-live="polite">{value}</output>
      <button className="chip" onClick={() => onChange(value + 1)} disabled={value >= 9} aria-label={`Increase coefficient of ${label}`}><Plus size={14} aria-hidden="true" /></button>
    </span>
  );
}

function Balance({ r }: { r: Reaction }) {
  const n = r.reactants.length;
  const all = [...r.reactants, ...r.products];
  const [coefs, setCoefs] = useState<number[]>(() => all.map(() => 1));
  const [revealed, setRevealed] = useState(false);
  const rep = balanceReport(r, coefs);
  const msg = balanceMessage(r, coefs);
  const set = (i: number, v: number) => { setRevealed(false); setCoefs((c) => c.map((x, k) => (k === i ? Math.min(9, Math.max(1, v)) : x))); };
  return (
    <section className="card balance" aria-labelledby="bal-h">
      <h3 id="bal-h">Balance the equation yourself</h3>
      <p className="muted small">Atoms are never created or destroyed in a reaction, so each kind of atom must appear the same number of times on both sides. Change the numbers in front of the formulas (coefficients), not the formulas themselves.</p>
      <div className="equation" role="group" aria-label="Equation with coefficients">
        {all.map((sp, i) => (
          <span key={i} className="eq-part">
            {i === n && <span className="eq-arrow" aria-label="produces">→</span>}
            {i > 0 && i !== n && <span className="eq-plus" aria-hidden="true">+</span>}
            <Stepper value={coefs[i]} label={sp.name} onChange={(v) => set(i, v)} />
            <span className="sci eq-formula">{displaySpecies(sp)}</span>
          </span>
        ))}
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
        <table className="data-table">
          <caption>Atoms on each side</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Left side</th><th scope="col">Right side</th><th scope="col">Match?</th></tr></thead>
          <tbody>
            {rep.rows.map((row) => (
              <tr key={row.element}>
                <th scope="row">{nameOf(row.element)} ({row.element})</th><td>{row.left}</td><td>{row.right}</td>
                <td>{row.ok ? <span className="ok"><Check size={16} aria-hidden="true" /> Yes</span> : <span className="no"><X size={16} aria-hidden="true" /> No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`feedback ${msg.kind === 'balanced' ? 'good' : msg.kind === 'not-lowest' ? '' : 'bad'}`} role="status" aria-live="polite">{msg.text}</p>
      <div className="row">
        <button className="btn" onClick={() => { setCoefs(all.map(() => 1)); setRevealed(false); }}><RotateCcw size={16} aria-hidden="true" /> Start again</button>
        <button className="btn" onClick={() => { setCoefs(r.coefficients); setRevealed(true); }}>Show the answer</button>
      </div>
      {revealed && <p className="small muted">Balanced equation: <span className="sci">{equationText(r)}</span></p>}
    </section>
  );
}

export function Reactions() {
  const [id, setId] = useState(REACTIONS[0].id);
  const r = REACTIONS.find((x) => x.id === id)!;
  return (
    <section aria-labelledby="react-h" className="lab-experiment lab-experiment-reactions">
      <div className="lab-experiment-kicker"><span>03 / 03 · GUIDED SIMULATION</span><span className="lab-concept-tag">CONSERVATION OF ATOMS</span></div>
      <h2 id="react-h">Reactions: what happens to the atoms</h2>
      <p className="muted">Choose a reaction to see the balanced equation, what you would observe, and why it happens. Then try balancing it yourself.</p>
      <div className="chips reaction-picker" role="group" aria-label="Choose a reaction">
        {REACTIONS.map((x) => <button key={x.id} className="chip" aria-pressed={id === x.id} onClick={() => setId(x.id)}>{x.title}</button>)}
      </div>
      <div className="react-grid" key={r.id}>
        <div>
          <h3>{r.title} <span className="tag">{r.type}</span></h3>
          <p className="equation-big sci" aria-label={`Balanced equation: ${r.reactants.map((s, i) => `${r.coefficients[i]} ${s.name}`).join(' plus ')} makes ${r.products.map((s, i) => `${r.coefficients[r.reactants.length + i]} ${s.name}`).join(' plus ')}`}>{equationText(r)}</p>
          <p className="small muted">State symbols: {([...new Set([...r.reactants, ...r.products].map((s) => s.state))] as const).map((st) => `(${st}) ${stateLabel(st)}`).join(', ')}.</p>
          {r.safety && <p className="banner warn" role="note"><TriangleAlert size={18} aria-hidden="true" /> <span>{r.safety}</span></p>}
          <h3>What you would see</h3>
          <ul>{r.observations.map((o) => <li key={o}>{o}</li>)}</ul>
          <h3>Why it happens</h3>
          {r.explanation.map((e) => <p key={e}>{e}</p>)}
        </div>
        <Balance r={r} />
      </div>
    </section>
  );
}
