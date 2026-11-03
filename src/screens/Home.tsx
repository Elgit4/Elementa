import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Atom, BookOpen, Check, Clock3, FlaskConical, Flame, Medal, Scale, TrendingUp, X, Zap } from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { getElementLabel } from '../data/element-labels';
import { bestScore, dayKey, mastery, recordDaily } from '../engine/progress';
import { dailyQuestion } from '../engine/daily';
import { evaluate } from '../engine/quiz';
import { BONDING_QUIZ_ID, TRENDS_QUIZ_ID } from '../engine/quizIds';
import { badges, DAILY_XP, levelInfo, quests, streak, totalXp } from '../engine/gamify';
import { PageSkeleton, Skeleton } from '../components/Loading';
import { useProgress } from '../state/useProgress';
import { ChemistryMascot } from '../components/ChemistryMascot';
import { AchievementArt } from '../components/AchievementArt';

function DailyChallenge({ onClose }: { onClose: () => void }) {
  const { progress, update } = useProgress();
  const [key] = useState(() => dayKey(new Date()));
  const q = useMemo(() => dailyQuestion(key), [key]);
  const completed = progress.daily[key]?.correct === true;
  const [picked, setPicked] = useState<string | null>(null);
  const ev = picked ? evaluate(q, picked) : null;
  const solved = completed || ev?.correct === true;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (!ev?.correct) return;
    const timeout = window.setTimeout(onClose, 1100);
    return () => window.clearTimeout(timeout);
  }, [ev?.correct, onClose]);

  const chooseAnswer = (choiceId: string) => {
    if (solved) return;
    const result = evaluate(q, choiceId);
    setPicked(choiceId);
    if (result.correct) update((p) => recordDaily(p, key, true));
  };

  return (
    <dialog
      ref={dialogRef}
      className="daily-challenge-dialog"
      aria-labelledby="daily-modal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section className="daily-challenge card daily-challenge-panel">
        <div className="challenge-heading">
          <div>
            <span className="eyebrow">DAILY TASK · +{DAILY_XP} XP</span>
            <h2 id="daily-modal-title">Daily chemistry challenge</h2>
            <p className="daily-challenge-intro">Answer correctly to complete today’s task.</p>
          </div>
          <button className="daily-challenge-close" type="button" onClick={onClose} aria-label="Close daily challenge">
            <X size={19} aria-hidden="true" />
          </button>
          <ChemistryMascot mood="think" size={76} className="challenge-mascot" />
        </div>
        <p id="daily-q" className="daily-q">{q.stem}</p>
        <div className="chips challenge-choices" role="group" aria-labelledby="daily-q">
          {q.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              disabled={solved}
              data-state={ev?.correct && c.id === q.correct ? 'right' : picked === c.id && ev && !ev.correct ? 'wrong' : undefined}
              onClick={() => chooseAnswer(c.id)}
            >{c.text}{ev?.correct && c.id === q.correct ? ' (correct)' : ''}</button>
          ))}
        </div>
        <div className="challenge-feedback" aria-live="polite">
          {ev && <p className={`feedback ${ev.correct ? 'good' : 'bad'}`}>
            <b>{ev.correct ? 'Correct.' : 'Not quite.'}</b> {ev.feedback.wrongNote} {ev.feedback.explanation}
            {ev.correct && <strong> +{DAILY_XP} XP added. This task is complete.</strong>}
          </p>}
          {!ev && completed && <p className="muted small">You have already completed today’s challenge.</p>}
        </div>
        {!ev?.correct && <p className="daily-challenge-hint">You can try another answer. The task is only completed when your answer is correct.</p>}
        {ev?.correct && <p className="daily-challenge-hint daily-challenge-success">Closing your completed task…</p>}
      </section>
    </dialog>
  );
}

function LevelRing({ level, fraction }: { level: number; fraction: number }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="ring home-level-ring" role="img" aria-label={`Level ${level}, ${Math.round(fraction * 100)}% of the way to level ${level + 1}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="track" cx="50" cy="50" r={r} fill="none" strokeWidth="8" />
        <circle className="fill" cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} />
      </svg>
      <div className="ring-label" aria-hidden="true"><b>{level}</b><span>Level</span></div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="home-screen" aria-hidden="true">
      <div className="home-hero">
        <div className="home-hero-copy">
          <Skeleton w={150} h={12} />
          <Skeleton w="70%" h={32} r={8} />
          <Skeleton w="85%" h={15} />
        </div>
        <Skeleton w={88} h={88} r="50%" />
        <div className="home-stats">
          <Skeleton w="100%" h={54} r={12} />
          <Skeleton w="100%" h={54} r={12} />
          <Skeleton w="100%" h={54} r={12} />
        </div>
      </div>
      <Skeleton w="100%" h={170} r={18} />
      <PageSkeleton cards={4} />
    </div>
  );
}

export function Home() {
  const [dailyOpen, setDailyOpen] = useState(false);\n  const closeDailyChallenge = useCallback(() => setDailyOpen(false), []);\n  const { progress, ready } = useProgress();
  const [today] = useState(() => new Date());
  const lesson = LESSONS[0];
  const pos = progress.lessonPosition[lesson.id];
  const done = progress.completedLessons.includes(lesson.id);
  const recent = progress.recentElements.map(getElementLabel).filter(Boolean);
  const xp = totalXp(progress);
  const lv = levelInfo(xp);
  const days = streak(progress, today);
  const todayQuests = quests(progress, today);
  const questsDone = todayQuests.filter((q) => q.done).length;
  const allBadges = badges(progress, today);
  const earned = allBadges.filter((b) => b.earned).length;
  const bondBest = bestScore(progress, BONDING_QUIZ_ID);
  const trendBest = bestScore(progress, TRENDS_QUIZ_ID);
  const lessonBest = bestScore(progress, lesson.quizId);
  const lessonMastery = mastery(progress, lesson.quizId);
  const first = progress.attempts.length === 0 && progress.completedLessons.length === 0 && Object.keys(progress.daily).length === 0;
  const scoreText = (n: number | null) => (n === null ? 'Not tried yet' : `Best score ${n}%`);
  const lessonLabel = done ? 'Review lesson' : pos !== undefined ? 'Continue lesson' : 'Start lesson';

  if (!ready) return <HomeSkeleton />;

  return (
    <div className="home-screen">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero-copy">
          <span className="eyebrow">YOUR CHEMISTRY SPACE</span>
          <h1 id="hero-title">{first ? 'Make chemistry click.' : `Welcome back, ${lv.title.toLowerCase()}`}</h1>
          <p>{first
            ? 'Explore the elements, understand what happens inside atoms, and build confidence through practice.'
            : `${lv.toNext} XP to reach level ${lv.level + 1}. Keep your momentum with one focused study session.`}</p>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <ChemistryMascot mood={first ? 'curious' : 'cheer'} size={174} />
          <span className="mascot-orbit orbit-one" />
          <span className="mascot-orbit orbit-two" />
        </div>
        <div className="home-level">
          <LevelRing level={lv.level} fraction={lv.fraction} />
          <div className="home-level-copy">
            <span className="home-level-label">CURRENT LEVEL</span>
            <strong>{lv.title}</strong>
            <span>{lv.toNext} XP to next level</span>
            <progress className="bar home-level-bar" value={lv.into} max={lv.span} aria-label={`Level progress: ${lv.into} of ${lv.span} XP`} />
          </div>
        </div>
        <div className="home-stats" aria-label="Your learning summary">
          <div className="home-stat">
            <span className="home-stat-icon"><Zap size={18} aria-hidden="true" /></span>
            <span><small>Total XP</small><strong>{xp.toLocaleString()}</strong></span>
          </div>
          <div className="home-stat">
            <span className="home-stat-icon streak-icon"><Flame size={18} aria-hidden="true" /></span>
            <span><small>Study streak</small><strong>{days} {days === 1 ? 'day' : 'days'}</strong></span>
          </div>
          <div className="home-stat">
            <span className="home-stat-icon badge-icon"><Medal size={18} aria-hidden="true" /></span>
            <span><small>Badges earned</small><strong>{earned} <span className="stat-total">/ {allBadges.length}</span></strong></span>
          </div>
        </div>
      </section>

      <section className="next-lesson card" aria-labelledby="next-lesson-title">
        <div className="next-lesson-main">
          <span className="eyebrow">YOUR NEXT STEP</span>
          <div className="next-lesson-title-row">
            <div>
              <h2 id="next-lesson-title">{done ? 'Lesson completed' : pos !== undefined ? 'Pick up where you left off' : 'Start with the fundamentals'}</h2>
              <p className="next-lesson-name">{lesson.title}</p>
            </div>
            <span className={`lesson-status${done ? ' is-done' : pos !== undefined ? ' is-progress' : ''}`}>{done ? 'Completed' : pos !== undefined ? 'In progress' : 'Ready to start'}</span>
          </div>
          <p className="next-lesson-summary">{lesson.summary}</p>
          <div className="lesson-facts">
            <span><BookOpen size={15} aria-hidden="true" /> {lesson.sections.length} short sections</span>
            <span><Clock3 size={15} aria-hidden="true" /> {lesson.minutes} min</span>
            {pos !== undefined && !done && <span>Section {Math.min(pos + 1, lesson.sections.length)} of {lesson.sections.length}</span>}
            {lessonBest !== null && <span>Quiz best {lessonBest}%{lessonMastery !== null ? ` · Mastery ${lessonMastery}%` : ''}</span>}
          </div>
          {pos !== undefined && !done && <progress className="bar lesson-progress" value={Math.min(pos + 1, lesson.sections.length)} max={lesson.sections.length} aria-label={`Lesson progress: section ${Math.min(pos + 1, lesson.sections.length)} of ${lesson.sections.length}`} />}
        </div>
        <a className="btn primary next-lesson-action" href={`#/learn/${lesson.id}`}>{lessonLabel} <ArrowRight size={16} aria-hidden="true" /></a>
      </section>

      <div className="home-columns">
        <section className="home-practice" aria-labelledby="prac-title">
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">LEARN BY DOING</span>
              <h2 id="prac-title">Build your chemistry skills</h2>
              <p>Choose a short activity and put what you know into practice.</p>
            </div>
            <a href="#/practice" className="section-link">Open practice <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <div className="practice-grid">
            <a className="tile-card" href="#/practice">
              <span className="ico"><FlaskConical size={21} aria-hidden="true" /></span>
              <span className="practice-card-label">BONDING</span>
              <h3>Bonding challenge</h3>
              <p>Test your understanding of ionic and covalent bonds.</p>
              <span className="tile-foot"><span>{scoreText(bondBest)}</span><ArrowRight size={16} aria-hidden="true" /></span>
            </a>
            <a className="tile-card" href="#/practice">
              <span className="ico trends-ico"><TrendingUp size={21} aria-hidden="true" /></span>
              <span className="practice-card-label">PERIODIC TABLE</span>
              <h3>Periodic trends</h3>
              <p>Explore atomic radius, ionisation energy and electronegativity.</p>
              <span className="tile-foot"><span>{scoreText(trendBest)}</span><ArrowRight size={16} aria-hidden="true" /></span>
            </a>
            <a className="tile-card" href="#/lab/reactions">
              <span className="ico reactions-ico"><Scale size={21} aria-hidden="true" /></span>
              <span className="practice-card-label">REACTIONS</span>
              <h3>Balance equations</h3>
              <p>Balance seven reactions one atom at a time.</p>
              <span className="tile-foot"><span>Interactive activity</span><ArrowRight size={16} aria-hidden="true" /></span>
            </a>
          </div>
          <p className="mastery-note">Mastery is the average of your last three quiz attempts. It is a learning guide, not an exam prediction.</p>
        </section>

        <section className="home-quests card" aria-labelledby="quest-title">
          <div className="section-head home-card-heading">
            <div>
              <span className="eyebrow">A LITTLE EACH DAY</span>
              <h2 id="quest-title">Today’s goals</h2>
              <p>Small steps make strong study habits.</p>
            </div>
            <span className="quest-meta">{questsDone}/{todayQuests.length}</span>
          </div>
          <progress className="bar quest-progress" value={questsDone} max={todayQuests.length} aria-label={`${questsDone} of ${todayQuests.length} goals completed today`} />
          <ul className="quest-list">
            {todayQuests.map((q) => (
              <li key={q.id}>
                {q.id === 'daily' ? (
                  <button
                    className="quest"
                    type="button"
                    data-done={q.done}
                    disabled={q.done}
                    aria-haspopup="dialog"
                    onClick={() => setDailyOpen(true)}
                  >
                    <span className="tick" aria-hidden="true"><Check size={15} /></span>
                    <span className="quest-copy"><b>{q.title}</b><small>{q.done ? 'Completed today' : q.detail}</small></span>
                    {!q.done && <ArrowRight className="quest-arrow" size={15} aria-hidden="true" />}
                  </button>
                ) : (
                  <a className="quest" data-done={q.done} href={q.href}>
                    <span className="tick" aria-hidden="true"><Check size={15} /></span>
                    <span className="quest-copy"><b>{q.title}</b><small>{q.done ? 'Completed today' : q.detail}</small></span>
                    <ArrowRight className="quest-arrow" size={15} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <details className="home-achievements card">
          <summary>
            <span className="achievement-title"><Medal size={18} aria-hidden="true" /> Achievements</span>
            <span className="achievement-meta">{earned} of {allBadges.length} earned <span className="achievement-toggle">View</span></span>
          </summary>
          <ul className="badge-grid">
            {allBadges.map((b) => (
              <li key={b.id} className="badge" data-earned={b.earned}>
                <AchievementArt id={b.id} earned={b.earned} />
                <b>{b.title}</b>
                <small>{b.earned ? 'Earned' : b.how}</small>
              </li>
            ))}
          </ul>
        </details>

        <section className="home-recent card" aria-labelledby="recent-title">
          <div className="section-head home-card-heading">
            <div>
              <span className="eyebrow">PICK UP YOUR CURIOSITY</span>
              <h2 id="recent-title">Recently explored</h2>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="mascot-empty-state"><ChemistryMascot mood="curious" size={88} /><p className="muted recent-empty"><strong>Your discoveries start here.</strong><br />Open an element and it will appear in this space. <a href="#/explore">Explore the periodic table</a>.</p></div>
          ) : (
            <div className="chips recent-chips">
              {recent.map((e) => <a key={e!.number} className="chip" href={`#/explore/${e!.number}`}><span className="sci">{e!.symbol}</span> {e!.name}</a>)}
            </div>
          )}
          <a className="recent-atom-link" href="#/atom/6?iso=14"><Atom size={16} aria-hidden="true" /> Compare carbon-12 and carbon-14 <ArrowRight size={14} aria-hidden="true" /></a>
        </section>
      </div>
      {dailyOpen && <DailyChallenge onClose={closeDailyChallenge} />}
    </div>
  );
}
