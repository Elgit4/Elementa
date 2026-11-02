import { useMemo, useState } from 'react';
import { ArrowRight, Atom, BookOpen, Check, FlaskConical, Flame, Lock, Medal, Scale, Target, TrendingUp, Zap } from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { getElement } from '../data';
import { bestScore, dayKey, mastery, recordDaily } from '../engine/progress';
import { dailyQuestion } from '../engine/daily';
import { evaluate } from '../engine/quiz';
import { BONDING_QUIZ_ID } from '../engine/bondingQuiz';
import { TRENDS_QUIZ_ID } from '../engine/trendsQuiz';
import { badges, levelInfo, quests, streak, totalXp, activeToday } from '../engine/gamify';
import { PageSkeleton, Skeleton } from '../components/Loading';
import { useProgress } from '../state/ProgressContext';

function DailyChallenge() {
  const { progress, update } = useProgress();
  const [key] = useState(() => dayKey(new Date()));
  const q = useMemo(() => dailyQuestion(key), [key]);
  const done = progress.daily[key];
  const [picked, setPicked] = useState<string | null>(null);
  const ev = picked ? evaluate(q, picked) : null;
  const answered = done !== undefined || ev !== null;

  return (
    <section className="card" aria-labelledby="daily-title">
      <div className="section-head" style={{ margin: 0 }}>
        <h2 id="daily-title">Daily chemistry challenge</h2>
        <span className="tag">Today</span>
      </div>
      <p id="daily-q" className="daily-q">{q.stem}</p>
      <div className="chips" role="group" aria-labelledby="daily-q">
        {q.choices.map((c) => (
          <button
            key={c.id}
            className="chip"
            disabled={answered}
            data-state={answered && c.id === q.correct ? 'right' : picked === c.id && !ev?.correct ? 'wrong' : undefined}
            onClick={() => { setPicked(c.id); const r = evaluate(q, c.id); update((p) => recordDaily(p, key, r.correct)); }}
          >{c.text}{answered && c.id === q.correct ? ' (correct)' : ''}</button>
        ))}
      </div>
      <div aria-live="polite">
        {ev && <p className={`feedback ${ev.correct ? 'good' : 'bad'}`}><b>{ev.correct ? 'Correct.' : 'Not quite.'}</b> {ev.feedback.wrongNote} {ev.feedback.explanation}</p>}
        {!ev && done && <p className="muted small">You answered today’s challenge{done.correct ? ' correctly' : ''}. A new one arrives tomorrow.</p>}
      </div>
    </section>
  );
}

function LevelRing({ level, fraction }: { level: number; fraction: number }) {
  const r = 48, c = 2 * Math.PI * r;
  return (
    <div className="ring" role="img" aria-label={`Level ${level}, ${Math.round(fraction * 100)}% of the way to level ${level + 1}`}>
      <svg viewBox="0 0 112 112" aria-hidden="true">
        <circle className="track" cx="56" cy="56" r={r} fill="none" strokeWidth="10" />
        <circle className="fill" cx="56" cy="56" r={r} fill="none" strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} />
      </svg>
      <div className="ring-label" aria-hidden="true"><b>{level}</b><span>Level</span></div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hero"><Skeleton w={112} h={112} r="50%" /><div style={{ display: 'grid', gap: 12 }}><Skeleton w="60%" h={30} r={8} /><Skeleton w="80%" h={14} /><Skeleton w="40%" h={36} r={99} /></div></div>
      <PageSkeleton cards={3} />
    </div>
  );
}

export function Home() {
  const { progress, ready } = useProgress();
  const [today] = useState(() => new Date());
  const lesson = LESSONS[0];
  const pos = progress.lessonPosition[lesson.id];
  const done = progress.completedLessons.includes(lesson.id);
  const recent = progress.recentElements.map(getElement).filter(Boolean);
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
  const scoreText = (n: number | null) => (n === null ? 'Not tried yet' : `Best ${n}%`);

  if (!ready) return <HomeSkeleton />;

  const nextAction = done
    ? { label: 'Review lesson', href: `#/learn/${lesson.id}`, title: 'Review last lesson' }
    : pos !== undefined
      ? { label: 'Continue lesson', href: `#/learn/${lesson.id}`, title: 'Continue learning' }
      : { label: 'Start lesson', href: `#/learn/${lesson.id}`, title: 'Start learning' };

  return (
    <>
      <section className="hero dashboard-hero" aria-labelledby="hero-title">
        <div className="hero-main">
          <div className="hero-copy">
            <p className="eyebrow">Learning dashboard</p>
            <h1 id="hero-title">{first ? 'Welcome to Elementa' : `Welcome back, ${lv.title.toLowerCase()}`}</h1>
            <p className="hero-subtitle">
              {first
                ? 'Explore atoms, patterns and reactions. Build confidence one concept at a time.'
                : `${lv.toNext} XP to level ${lv.level + 1}. Keep going.`}
            </p>
          </div>
          <div className="hero-actions">
            <a className="btn primary" href={nextAction.href}>{nextAction.label} <ArrowRight size={16} aria-hidden="true" /></a>
            <a className="btn" href="#/lab">Open lab</a>
          </div>
        </div>

        <div className="hero-side">
          <LevelRing level={lv.level} fraction={lv.fraction} />
          <div className="mini-stats">
            <div className="mini-stat">
              <span className="mini-label"><Zap size={14} aria-hidden="true" /> XP</span>
              <strong>{xp}</strong>
            </div>
            <div className="mini-stat">
              <span className="mini-label"><Flame size={14} aria-hidden="true" /> Streak</span>
              <strong>{days > 0 ? `${days} days` : 'Start today'}</strong>
            </div>
            <div className="mini-stat">
              <span className="mini-label"><Medal size={14} aria-hidden="true" /> Badges</span>
              <strong>{earned}/{allBadges.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="home-cols">
        <div className="stack">
          <section className="card continue o2" aria-labelledby="cont-title">
            <div className="section-head" style={{ margin: 0 }}>
              <h2 id="cont-title">{nextAction.title}</h2>
              <span className="tag">Next up</span>
            </div>
            <p className="big-line">{lesson.title}</p>
            <p className="muted">{lesson.summary}</p>
            {pos !== undefined && !done && <progress className="bar" value={pos + 1} max={lesson.sections.length} aria-label={`Lesson progress: section ${pos + 1} of ${lesson.sections.length}`} />}
            {lessonBest !== null && <p className="small muted">Quiz best {lessonBest}%{lessonMastery !== null ? `. Mastery estimate ${lessonMastery}%` : ''}.</p>}
            <p><a className="btn primary" href={nextAction.href}>{nextAction.label} <ArrowRight size={16} aria-hidden="true" /></a></p>
          </section>

          <section className="o4" aria-labelledby="prac-title">
            <div className="section-head"><h2 id="prac-title">Practise in the lab</h2><p><a href="#/lab">All activities</a></p></div>
            <div className="practice-grid">
              <a className="tile-card" href="#/lab/practise">
                <span className="ico"><FlaskConical size={22} aria-hidden="true" /></span>
                <h3>Bonding challenge</h3><p>10 questions on ionic and covalent bonding.</p>
                <span className="tile-foot"><span>{scoreText(bondBest)}</span><ArrowRight size={16} aria-hidden="true" /></span>
              </a>
              <a className="tile-card" href="#/lab/practise/trends">
                <span className="ico"><TrendingUp size={22} aria-hidden="true" /></span>
                <h3>Periodic trends challenge</h3><p>Radius, ionisation energy and electronegativity.</p>
                <span className="tile-foot"><span>{scoreText(trendBest)}</span><ArrowRight size={16} aria-hidden="true" /></span>
              </a>
              <a className="tile-card" href="#/lab/reactions">
                <span className="ico"><Scale size={22} aria-hidden="true" /></span>
                <h3>Balance equations</h3><p>Seven reactions to balance atom by atom.</p>
                <span className="tile-foot"><span>Activity</span><ArrowRight size={16} aria-hidden="true" /></span>
              </a>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>Mastery is the average of your last three attempts at a quiz. It is a rough guide, not an exam prediction.</p>
          </section>

          <section className="o5" aria-labelledby="badge-title">
            <div className="section-head"><h2 id="badge-title">Badges</h2><p>{earned} of {allBadges.length} earned</p></div>
            <ul className="badge-grid">
              {allBadges.map((b) => (
                <li key={b.id} className="badge" data-earned={b.earned}>
                  <span className="medal">{b.earned ? <Check size={22} aria-hidden="true" /> : <Lock size={20} aria-hidden="true" />}</span>
                  <b>{b.title}</b>
                  <small>{b.earned ? 'Earned' : b.how}</small>
                  <span className="sr-only">{b.earned ? 'Earned.' : 'Locked.'}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="stack">
          <section className="card o1" aria-labelledby="quest-title">
            <div className="section-head" style={{ margin: 0 }}><h2 id="quest-title"><Target size={18} aria-hidden="true" style={{ verticalAlign: -3 }} /> Today’s quests</h2><span className="tag">{questsDone}/{todayQuests.length}</span></div>
            <progress className="bar" value={questsDone} max={todayQuests.length} aria-label={`${questsDone} of ${todayQuests.length} quests done today`} />
            <ul className="quest-list">
              {todayQuests.map((q) => (
                <li key={q.id}>
                  <a className="quest" data-done={q.done} href={q.id === 'daily' ? '#/' : q.href} onClick={q.id === 'daily' ? (e) => { e.preventDefault(); document.getElementById('daily-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } : undefined}>
                    <span className="tick" aria-hidden="true"><Check size={16} /></span>
                    <span><b>{q.title}</b><small>{q.done ? 'Done today' : q.detail}</small></span>
                    <span className="sr-only">{q.done ? 'Completed' : 'Not done yet'}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <div className="o3"><DailyChallenge /></div>

          <section className="card o6" aria-labelledby="rec-title">
            <h2 id="rec-title">Recently explored</h2>
            {recent.length === 0 ? (
              <p className="muted">Elements you open will appear here. <a href="#/explore">Open the periodic table</a>.</p>
            ) : (
              <div className="chips">
                {recent.map((e) => <a key={e!.number} className="chip" href={`#/explore/${e!.number}`}><span className="sci">{e!.symbol}</span> {e!.name}</a>)}
              </div>
            )}
            <p className="small"><a href="#/atom/6?iso=14"><Atom size={14} aria-hidden="true" style={{ verticalAlign: -2 }} /> Compare carbon-12 and carbon-14</a></p>
            <p className="small"><a href="#/explore"><BookOpen size={14} aria-hidden="true" style={{ verticalAlign: -2 }} /> See periodic trends on the table</a></p>
          </section>
        </div>
      </div>
    </>
  );
}
