import { ArrowRight, Atom, BookOpenCheck, CheckCircle2, FlaskConical, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Loading';
import { bestScore } from '../engine/progress';
import { BONDING_QUIZ_ID, TRENDS_QUIZ_ID } from '../engine/quizIds';
import { BONDING_QUIZ_LENGTH } from '../engine/bondingQuiz';
import { TRENDS_QUIZ_LENGTH } from '../engine/trendsQuiz';
import { ATOMS_QUIZ_ID } from '../data/lessons';
import { useProgress } from '../state/useProgress';

const ACTIVITIES = [
  {
    id: 'lesson',
    index: '01',
    category: 'FOUNDATION CHECK',
    title: 'Atomic structure assessment',
    description: 'Check your understanding of particles, isotopes, electron arrangements and ions.',
    detail: 'Lesson checkpoint',
    href: '#/learn/atoms/quiz',
    Icon: BookOpenCheck,
    scoreId: ATOMS_QUIZ_ID,
    action: 'Start assessment',
  },
  {
    id: 'bonding',
    index: '02',
    category: 'CHEMICAL BONDING',
    title: 'Chemical bonding',
    description: 'Practise ionic and covalent bonding with fresh questions and worked explanations.',
    detail: BONDING_QUIZ_LENGTH + ' fresh questions',
    href: '#/lab/practise',
    Icon: Atom,
    scoreId: BONDING_QUIZ_ID,
    action: 'Start practice',
  },
  {
    id: 'trends',
    index: '03',
    category: 'PERIODIC TABLE',
    title: 'Periodic trends',
    description: 'Test your understanding of atomic radius, ionisation energy and electronegativity.',
    detail: TRENDS_QUIZ_LENGTH + ' fresh questions',
    href: '#/lab/practise/trends',
    Icon: TrendingUp,
    scoreId: TRENDS_QUIZ_ID,
    action: 'Start practice',
  },
] as const;

export function Practice() {
  const { progress, ready } = useProgress();

  if (!ready) return <p className="muted" role="status"><Spinner label="Loading your practice history" /> Loading your practice history…</p>;

  const scores = ACTIVITIES.map((activity) => bestScore(progress, activity.scoreId));
  const attempts = progress.attempts.filter((attempt) => ACTIVITIES.some((activity) => activity.scoreId === attempt.quizId)).length;
  const topScore = scores.reduce<number | null>((best, score) => score === null ? best : best === null ? score : Math.max(best, score), null);

  return (
    <>
      <PageHeader
        Icon={Target}
        eyebrow="Build confidence through practice"
        title="Practice"
        subtitle="Turn what you have learned into knowledge you can use. Choose a topic, work through the questions and learn from every answer."
      />

      <section className="practice-intro" aria-labelledby="practice-intro-title">
        <div className="practice-intro-copy">
          <span className="practice-kicker"><Sparkles size={14} aria-hidden="true" /> YOUR NEXT BREAKTHROUGH STARTS HERE</span>
          <h2 id="practice-intro-title">Learn it. Test it. <span>Own it.</span></h2>
          <p>Short, focused assessments help you spot what you understand and what deserves another look.</p>
          <div className="practice-intro-stats">
            <span><BookOpenCheck size={16} aria-hidden="true" /><b>3</b> learning paths</span>
            <span><CheckCircle2 size={16} aria-hidden="true" /><b>{attempts}</b> completed attempts</span>
            <span><Trophy size={16} aria-hidden="true" /><b>{topScore === null ? '—' : topScore + '%'}</b> top score</span>
          </div>
        </div>
        <div className="practice-intro-art" aria-hidden="true">
          <div className="practice-orbit practice-orbit-one" />
          <div className="practice-orbit practice-orbit-two" />
          <div className="practice-art-core"><Atom size={62} strokeWidth={1.35} /></div>
          <span className="practice-art-chip practice-art-chip-one">01</span>
          <span className="practice-art-chip practice-art-chip-two">✓</span>
          <span className="practice-art-chip practice-art-chip-three">?</span>
        </div>
      </section>

      <section className="practice-activities" aria-labelledby="practice-activities-title">
        <div className="practice-section-heading">
          <div>
            <span className="eyebrow">CHOOSE YOUR FOCUS</span>
            <h2 id="practice-activities-title">Your practice paths</h2>
            <p>Pick up where you left off or take on a new topic.</p>
          </div>
          <span className="practice-count">03 ACTIVITIES</span>
        </div>
        <div className="practice-hub">
          {ACTIVITIES.map(({ id, index, category, title, description, detail, href, Icon, scoreId, action }) => {
            const score = bestScore(progress, scoreId);
            return (
              <article className={'practice-activity practice-activity-' + id} key={id} data-attempted={score !== null}>
                <div className="practice-activity-top">
                  <span className="practice-activity-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="practice-activity-index">{index} <span>/ 03</span></span>
                </div>
                <div className="practice-activity-copy">
                  <span className="practice-activity-category">{category}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <div className="practice-activity-meta">
                  <span className="practice-activity-detail">{detail}</span>
                  <span className={'practice-score' + (score !== null ? ' has-score' : '')}>
                    {score === null ? 'Not attempted' : 'Best score ' + score + '%'}
                  </span>
                </div>
                <a className="practice-activity-action" href={href}>
                  {score === null ? action : 'Practise again'} <ArrowRight size={17} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="practice-support" aria-labelledby="practice-support-title">
        <div className="practice-support-icon"><FlaskConical size={22} aria-hidden="true" /></div>
        <div className="practice-support-copy">
          <span className="eyebrow">NEED A REFRESHER?</span>
          <h2 id="practice-support-title">Explore before you answer.</h2>
          <p>Revisit the periodic table or work through a visual experiment before you take your next assessment.</p>
        </div>
        <div className="practice-support-actions">
          <a className="btn" href="#/explore">Explore elements</a>
          <a className="btn primary" href="#/lab">Open virtual lab <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </section>
      <p className="practice-footnote">Your results are saved on this device. Use your best score as a progress marker, then review the explanations to strengthen your understanding.</p>
    </>
  );
}
