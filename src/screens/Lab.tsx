import { useMemo, useState } from 'react';
import { ArrowRight, FlaskConical, Link2, Atom as AtomIcon, Scale, Target } from 'lucide-react';
import { getElement } from '../data';
import { DotCross, type Stage } from '../components/DotCross';
import { MoleculeDiagram } from '../components/MoleculeDiagram';
import { Quiz } from '../components/Quiz';
import { trendsQuestions, TRENDS_QUIZ_ID, TRENDS_QUIZ_LENGTH } from '../engine/trendsQuiz';
import type { Question } from '../engine/quiz';
import { Spinner } from '../components/Loading';
import { PageHeader, Breadcrumbs } from '../components/PageHeader';
import { go, type Route } from '../router';
import { Reactions } from '../components/Reactions';
import { REACTIONS } from '../engine/reactions';
import { useProgress } from '../state/useProgress';
import { bestScore, mastery, recordAttempt } from '../engine/progress';
import { BONDING_QUIZ_ID, BONDING_QUIZ_LENGTH, bondingQuestions } from '../engine/bondingQuiz';
import { IONIC_METALS, IONIC_NONMETALS, MOLECULES, analyseMolecule, displayFormula, ionicCompound, ionicSteps } from '../engine/bonding';

const label = (z: number) => `${getElement(z)!.name} (${getElement(z)!.symbol})`;

function Ionic() {
  const [metal, setMetal] = useState<number>(11);
  const [nonmetal, setNonmetal] = useState<number>(17);
  const [step, setStep] = useState(0);
  const r = ionicCompound(metal, nonmetal);
  const steps = ionicSteps(r);
  const last = step === steps.length - 1;
  const change = (fn: () => void) => { fn(); setStep(0); };
  return (
    <section aria-labelledby="ionic-h" className="lab-experiment lab-experiment-ionic">\n      <div className="lab-experiment-kicker"><span>01 / 03 · GUIDED SIMULATION</span><span className="lab-concept-tag">ELECTRON TRANSFER</span></div>
      <h2 id="ionic-h">Ionic bonding: electron transfer</h2>
      <p className="muted">A metal atom gives electrons to a non-metal atom. Choose a metal and a non-metal, then step through what happens.</p>
      <div className="lab-controls lab-controls-featured">
        <div className="field"><label htmlFor="lab-metal">Metal</label>
          <select id="lab-metal" className="select" value={metal} onChange={(e) => change(() => setMetal(Number(e.target.value)))}>
            {IONIC_METALS.map((z) => <option key={z} value={z}>{label(z)}</option>)}
          </select></div>
        <div className="field"><label htmlFor="lab-nonmetal">Non-metal</label>
          <select id="lab-nonmetal" className="select" value={nonmetal} onChange={(e) => change(() => setNonmetal(Number(e.target.value)))}>
            {IONIC_NONMETALS.map((z) => <option key={z} value={z}>{label(z)}</option>)}
          </select></div>
      </div>
      <div className="lab-grid">
        <DotCross r={r} stage={step as Stage} />
        <div className="lab-step-content">
          <div className="lab-stage-marker"><span>MODEL STAGE {step + 1} / {steps.length}</span><strong>{steps[step].title}</strong></div>
          <progress className="bar" value={step + 1} max={steps.length} aria-label={`Step ${step + 1} of ${steps.length}`} />
          <p className="small muted">Step {step + 1} of {steps.length}</p>
          <ol className="lab-steps">
            {steps.slice(0, step + 1).map((s, i) => (
              <li key={s.title} aria-current={i === step ? 'step' : undefined} data-current={i === step || undefined}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="row between">
            <button className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
            {last
              ? <button className="btn" onClick={() => setStep(0)}>Start again</button>
              : <button className="btn primary" onClick={() => setStep(step + 1)}>Next step <ArrowRight size={16} aria-hidden="true" /></button>}
          </div>
          <p className="sr-only" role="status" aria-live="polite">{steps[step].title}. {last ? `${r.name}, formula ${r.formula}.` : ''}</p>
          {last && <p className="callout lab-result"><b>{r.name}</b>: <span className="sci">{r.formulaDisplay}</span></p>}
        </div>
      </div>
    </section>
  );
}

function Covalent() {
  const [id, setId] = useState('h2o');
  const def = MOLECULES.find((m) => m.id === id)!;
  const a = analyseMolecule(def);
  const description = `${def.name}, ${def.formula}. ${a.bondLabels.join('. ')}. ${a.totalLonePairs} lone ${a.totalLonePairs === 1 ? 'pair' : 'pairs'} in total.`;
  return (
    <section aria-labelledby="cov-h" className="lab-experiment lab-experiment-covalent">\n      <div className="lab-experiment-kicker"><span>02 / 03 · GUIDED SIMULATION</span><span className="lab-concept-tag">SHARED ELECTRONS</span></div>
      <h2 id="cov-h">Covalent bonding: sharing electrons</h2>
      <p className="muted">Non-metal atoms share pairs of electrons so that each atom ends up with a full outer shell: two electrons for hydrogen, eight for the others.</p>
      <div className="chips molecule-picker" role="group" aria-label="Choose a molecule">
        {MOLECULES.map((m) => <button key={m.id} className="chip" aria-pressed={id === m.id} onClick={() => setId(m.id)}>{displayFormula(m.formula)}</button>)}
      </div>
      <div className="lab-grid">
        <MoleculeDiagram def={def} description={description} />
        <div className="molecule-detail">
          <h3>{def.name} <span className="sci">{displayFormula(def.formula)}</span></h3>
          <ul>{a.bondLabels.map((l, i) => <li key={i}>{l}</li>)}</ul>
          <p className="small muted">A line is one shared pair of electrons. A pair of dots is a lone pair: both electrons belong to one atom and are not shared. This drawing shows which atoms are bonded, not the true 3D shape of the molecule.</p>
        </div>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens">
        <table className="data-table">
          <caption>Electron count for each atom in {def.name.toLowerCase()}</caption>
          <thead><tr><th scope="col">Atom</th><th scope="col">Outer electrons in the atom</th><th scope="col">Shared pairs</th><th scope="col">Lone pairs</th><th scope="col">Electrons in outer shell after bonding</th></tr></thead>
          <tbody>
            {a.atoms.map((at, i) => (
              <tr key={i}><th scope="row">{at.symbol}</th><td>{at.valence}</td><td>{at.sharedPairs}</td><td>{at.lonePairs}</td><td>{at.outerElectrons} (full: {at.target})</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type Topic = 'bonding' | 'trends';
const TOPICS: Record<Topic, { id: string; title: string; blurb: string; make: (seed: number) => Question[]; length: number }> = {
  bonding: { id: BONDING_QUIZ_ID, title: 'bonding', blurb: 'questions on ionic and covalent bonding', make: bondingQuestions, length: BONDING_QUIZ_LENGTH },
  trends: { id: TRENDS_QUIZ_ID, title: 'periodic trends', blurb: 'questions on atomic radius, ionisation energy and electronegativity', make: trendsQuestions, length: TRENDS_QUIZ_LENGTH },
};

function Practise({ onBack, initialTopic = 'bonding' }: { onBack: (tab: 'ionic' | 'covalent') => void; initialTopic?: Topic }) {
  const { progress, update, ready } = useProgress();
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<{ correct: number; total: number } | null>(null);
  const T = TOPICS[topic];
  const questions = useMemo(() => T.make(seed), [T, seed]);
  if (!ready) return <p className="muted" role="status"><Spinner label="Loading your scores" /> Loading…</p>;
  const best = bestScore(progress, T.id);
  const fresh = () => { setSaved(null); setSeed(Math.floor(Math.random() * 1e6)); setAttempt((a) => a + 1); };
  return (
    <section aria-labelledby="practise-h" className="lab-experiment lab-experiment-quiz">\n      <div className="lab-experiment-kicker"><span>04 / 04 · KNOWLEDGE CHECK</span><span className="lab-concept-tag">FRESH QUESTION SET</span></div>
      <h2 id="practise-h">Practise: {T.title}</h2>
      <div className="chips" role="group" aria-label="Practice topic">
        {(Object.keys(TOPICS) as Topic[]).map((k) => <button key={k} className="chip" aria-pressed={topic === k} onClick={() => { setTopic(k); fresh(); }}>{k === 'bonding' ? 'Bonding' : 'Periodic trends'}</button>)}
      </div>
      <p className="muted">{T.length} {T.blurb}. They are made fresh each time, so every attempt is different. Every answer and explanation is worked out from the element data and checked by tests.</p>
      {best !== null && !saved && <p className="small muted">Your best score so far is {best}%.</p>}
      <Quiz
        key={`${topic}-${attempt}`}
        questions={questions}
        seed={seed}
        finishLabel="See my score"
        onFinish={(r) => {
          setSaved(r);
          update((p) => recordAttempt(p, { quizId: T.id, at: new Date().toISOString(), correct: r.correct, total: r.total }));
        }}
        resultActions={
          <>
            <button className="btn primary" onClick={fresh}>Try new questions</button>
            {topic === 'bonding' ? (<>
              <button className="btn" onClick={() => onBack('ionic')}>Review ionic bonding</button>
              <button className="btn" onClick={() => onBack('covalent')}>Review covalent bonding</button>
            </>) : <a className="btn" href="#/explore">Review trends in the periodic table</a>}
          </>
        }
      />
      {saved && <p className="small muted" role="status">Result saved on this device. Mastery estimate: {mastery(progress, T.id) ?? Math.round((saved.correct / saved.total) * 100)}%.</p>}
    </section>
  );
}

type Activity = 'ionic' | 'covalent' | 'reactions' | 'practise';

const ACTIVITIES: { id: Activity; title: string; blurb: string; Icon: typeof FlaskConical; tags: string[] }[] = [
  { id: 'ionic', title: 'Ionic bonding', blurb: 'Watch electrons move from a metal to a non-metal and see the compound form.', Icon: AtomIcon, tags: ['Explore', 'Dot-and-cross'] },
  { id: 'covalent', title: 'Covalent bonding', blurb: 'Build nine molecules and see shared and lone pairs.', Icon: Link2, tags: ['Explore', '9 molecules'] },
  { id: 'reactions', title: 'Reactions', blurb: 'See what happens in seven reactions, then balance the equations yourself.', Icon: Scale, tags: ['Challenge', '7 reactions'] },
  { id: 'practise', title: 'Practise', blurb: 'Test yourself on bonding and periodic trends. Questions are new every time.', Icon: Target, tags: ['Quiz', 'Saves your score'] },
];

const isActivity = (x: string | undefined): x is Activity => ACTIVITIES.some((a) => a.id === x);

/** Deep links: #/lab, #/lab/ionic, #/lab/covalent, #/lab/reactions, #/lab/practise, #/lab/practise/trends */
export function Lab({ route }: { route: Route }) {
  const { progress } = useProgress();
  const seg = route.segments[1];
  const tab = isActivity(seg) ? seg : null;
  const open = (a: Activity) => go(`lab/${a}`);

  if (tab === null) {
    const bond = bestScore(progress, BONDING_QUIZ_ID), trend = bestScore(progress, TRENDS_QUIZ_ID);
    return (
      <>
        <PageHeader Icon={FlaskConical} eyebrow="Explore · Observe · Understand" title="Virtual lab" subtitle="Step inside the science. Explore visual models, change the conditions and see how chemistry works." />
        <section className="lab-intro" aria-labelledby="lab-intro-title">
          <div className="lab-intro-copy">
            <span className="lab-intro-kicker">ELEMENTA INTERACTIVE WORKSPACE</span>
            <h2 id="lab-intro-title">Big ideas. <span>Made visible.</span></h2>
            <p>Move beyond the page with guided models for bonding and reactions, then put your understanding to the test.</p>
          </div>
          <div className="lab-intro-facts" aria-label="Laboratory activities">
            <div><strong>03</strong><span>guided simulations</span></div>
            <div><strong>{String(MOLECULES.length).padStart(2, '0')}</strong><span>molecules to explore</span></div>
            <div><strong>{REACTIONS.length}</strong><span>reaction examples</span></div>
          </div>
          <div className="lab-intro-mark" aria-hidden="true"><FlaskConical size={58} strokeWidth={1.25} /></div>
        </section>

        <section className="lab-activity-section" aria-labelledby="lab-activity-title">
          <div className="lab-section-heading">
            <div>
              <span className="eyebrow">CHOOSE AN EXPERIENCE</span>
              <h2 id="lab-activity-title">Explore the workbench</h2>
              <p>Each activity focuses on one important chemistry idea.</p>
            </div>
            <span className="lab-activity-count">04 EXPERIENCES</span>
          </div>
          <div className="lab-hub">
            {ACTIVITIES.map(({ id, title, blurb, Icon, tags }, index) => (
              <a key={id} className={'lab-card lab-card-' + id} href={'#/lab/' + id}>
                <div className="lab-card-head">
                  <span className="lab-card-symbol"><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span>
                  <span className="lab-card-number">0{index + 1}</span>
                </div>
                <div className="lab-card-copy">
                  <span className="lab-card-category">{id === 'practise' ? 'KNOWLEDGE CHECK' : 'GUIDED SIMULATION'}</span>
                  <h3 className="lab-h">{title}</h3>
                  <p>{blurb}</p>
                </div>
                <div className="lab-card-meta">
                  {tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <span className="lab-card-foot">
                  <span>{id === 'practise' ? 'Bonding ' + (bond === null ? 'not tried' : 'best ' + bond + '%') + ' · Trends ' + (trend === null ? 'not tried' : 'best ' + trend + '%') : id === 'covalent' ? MOLECULES.length + ' molecule models' : id === 'reactions' ? 'Explore and balance' : 'Choose elements and step through'}</span>
                  <span className="lab-card-action">{id === 'practise' ? 'Test knowledge' : 'Open simulation'} <ArrowRight size={16} aria-hidden="true" /></span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <div className="lab-foot lab-disclaimer">
          <div className="lab-disclaimer-mark"><FlaskConical size={18} aria-hidden="true" /></div>
          <p className="muted small">These are educational screen-based models, not instructions for carrying out chemical reactions physically. The bonding activities use a simplified electron-shell model for main-group elements. This draft content has not yet been reviewed by a chemistry teacher or checked against the current WASSCE syllabus. <a href="#/atom/11?q=1">Continue in the atomic explorer</a>.</p>
        </div>
      </>
    );
  }

  const current = ACTIVITIES.find((a) => a.id === tab)!;
  return (
    <>
      <Breadcrumbs items={[{ label: 'Virtual lab', href: '#/lab' }, { label: current.title }]} />
      <PageHeader Icon={current.Icon} eyebrow="Virtual lab" title={current.title} subtitle={current.blurb} />
      <div className="lab-workspace">
        <div className="lab-workspace-heading">
          <div><span className="lab-workspace-label">WORKSPACE</span><strong>{current.title}</strong></div>
          <a className="lab-all-link" href="#/lab">All activities <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="seg lab-activity-nav" role="group" aria-label="Switch activity">
          {ACTIVITIES.map((a) => <button key={a.id} className="chip" aria-pressed={tab === a.id} onClick={() => open(a.id)}>{a.title}</button>)}
        </div>
        <div className={'lab-panel lab-panel-' + tab}>
        {tab === 'ionic' ? <Ionic /> : tab === 'covalent' ? <Covalent /> : tab === 'reactions' ? <Reactions /> : <Practise key={route.segments[2] ?? 'bonding'} initialTopic={route.segments[2] === 'trends' ? 'trends' : 'bonding'} onBack={(t) => open(t)} />}
        </div>
      </div>
      <div className="lab-foot lab-disclaimer">
        <p className="muted small">Educational screen-based model only. Draft content has not yet been reviewed by a chemistry teacher or checked against the current WASSCE syllabus.</p>
      </div>
    </>
  );
}
