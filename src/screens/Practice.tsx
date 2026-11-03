import { ArrowRight, Atom, BookOpenCheck, FlaskConical, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Loading';
import { bestScore } from '../engine/progress';
import { BONDING_QUIZ_ID, TRENDS_QUIZ_ID } from '../engine/quizIds';
import { useProgress } from '../state/useProgress';

const ACTIVITIES = [
  {
    id: 'lesson',
    title: 'Atomic structure assessment',
    description: 'Check your understanding of particles, isotopes, electron arrangements and ions.',
    href: '#/learn/atoms/quiz',
    Icon: BookOpenCheck,
    scoreId: 'atoms-quiz',
  },
  {
    id: 'bonding',
    title: 'Chemical bonding',
    description: 'Practise ionic and covalent bonding with fresh questions and worked explanations.',
    href: '#/lab/practise',
    Icon: Atom,
    scoreId: BONDING_QUIZ_ID,
  },
  {
    id: 'trends',
    title: 'Periodic trends',
    description: 'Test your understanding of atomic radius, ionisation energy and electronegativity.',
    href: '#/lab/practise/trends',
    Icon: TrendingUp,
    scoreId: TRENDS_QUIZ_ID,
  },
] as const;

export function Practice() {
  const { progress, ready } = useProgress();

  if (!ready) return <p className="muted" role="status"><Spinner label="Loading your practice history" /> Loading your practice history…</p>;

  return (
    <>
      <PageHeader
        Icon={BookOpenCheck}
        eyebrow="Check your understanding"
        title="Practice"
        subtitle="Use short assessments to check what you understand, review explanations and decide what to study next."
      />
      <div className="practice-hub">
        {ACTIVITIES.map(({ id, title, description, href, Icon, scoreId }) => {
          const score = bestScore(progress, scoreId);
          return (
            <a className="tile-card practice-hub-card" href={href} key={id}>
              <span className="ico"><Icon size={22} aria-hidden="true" /></span>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className="tile-foot">
                <span>{score === null ? 'Not attempted yet' : `Best score ${score}%`}</span>
                <span className="practice-hub-action">Start practice <ArrowRight size={16} aria-hidden="true" /></span>
              </span>
            </a>
          );
        })}
      </div>
      <section className="practice-guidance card" aria-labelledby="practice-guidance-title">
        <div className="practice-guidance-icon"><FlaskConical size={21} aria-hidden="true" /></div>
        <div>
          <h2 id="practice-guidance-title">Need to explore before you answer?</h2>
          <p className="muted">Review an element or try an interactive experiment, then return here to check your understanding.</p>
          <div className="row">
            <a className="btn" href="#/explore">Explore the periodic table</a>
            <a className="btn" href="#/lab">Open the virtual lab</a>
          </div>
        </div>
      </section>
    </>
  );
}
