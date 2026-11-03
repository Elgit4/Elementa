import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, GraduationCap } from 'lucide-react';
import { Breadcrumbs, PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Loading';
import { KnowledgeCheck } from '../components/KnowledgeCheck';
import { LESSONS, QUESTIONS } from '../data/lessons';
import { CURRICULUM } from '../data/curriculum';
import { bestScore, completeLesson, mastery, recordAttempt, setLessonPosition } from '../engine/progress';
import { Quiz } from '../components/Quiz';
import { useProgress } from '../state/ProgressContext';
import { go, type Route } from '../router';

export function Learn({ route }: { route: Route }) {
  const lessonId = route.segments[1];
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lessonId) return <LessonList />;
  if (!lesson) {
    return (<><Breadcrumbs items={[{ label: 'Learn', href: '#/learn' }, { label: 'Not found' }]} /><h1>Lesson not found</h1><p className="muted">That lesson does not exist.</p><p><a className="btn" href="#/learn">Back to lessons</a></p></>);
  }
  if (route.segments[2] === 'quiz') return <LessonQuiz lessonId={lesson.id} />;
  return <LessonReader lessonId={lesson.id} />;
}

function LessonList() {
  const { progress, ready } = useProgress();
  const completed = progress.completedLessons.length;
  const total = LESSONS.length;

  return (
    <>
      <PageHeader Icon={BookOpen} eyebrow="Learn" title="Your chemistry courses" subtitle="Build understanding step by step. Start with a topic, work through its lesson, then check what you know." />
      <div className="summary-strip">
        <span className="pill"><GraduationCap size={16} aria-hidden="true" /> {ready ? `${completed} of ${total} lessons completed` : 'Loading your progress…'}</span>
        <a className="pill" href="#/practice">Go to practice</a>
      </div>
      <div className="course-list">
        {CURRICULUM.map((course) => {
          const courseLessons = course.topics.flatMap((topic) => topic.lessonIds);
          const courseDone = courseLessons.filter((id) => progress.completedLessons.includes(id)).length;
          return (
            <section className="course-card card" key={course.id} aria-labelledby={`course-${course.id}`}>
              <div className="course-card-heading">
                <div>
                  <span className="eyebrow">COURSE · {course.level}</span>
                  <h2 id={`course-${course.id}`}>{course.title}</h2>
                  <p className="muted">{course.description}</p>
                </div>
                <span className="course-count">{courseDone}/{courseLessons.length} done</span>
              </div>
              <div className="course-progress" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={courseLessons.length} aria-valuenow={courseDone}>
                <span style={{ width: `${courseLessons.length ? (courseDone / courseLessons.length) * 100 : 0}%` }} />
              </div>
              {course.topics.map((topic, index) => {
                const topicLessons = topic.lessonIds.map((id) => LESSONS.find((lesson) => lesson.id === id)).filter((lesson): lesson is (typeof LESSONS)[number] => Boolean(lesson));
                const topicDone = topicLessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
                return (
                  <section className="topic-group" key={topic.id} aria-labelledby={`topic-${topic.id}`}>
                    <div className="topic-heading">
                      <span className="topic-index">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 id={`topic-${topic.id}`}>{topic.title}</h3>
                        <p className="muted small">{topic.description}</p>
                      </div>
                      <span className="topic-meta">{topicDone}/{topicLessons.length}</span>
                    </div>
                    <ul className="lesson-list">
                      {topicLessons.map((lesson) => {
                        const done = progress.completedLessons.includes(lesson.id);
                        const pos = progress.lessonPosition[lesson.id];
                        const best = bestScore(progress, lesson.quizId);
                        return (
                          <li key={lesson.id} className={`card lesson-card${done ? ' done' : ''}`}>
                            <div className="lesson-row">
                              <span className="ico" aria-hidden="true">{done ? <Check size={24} /> : <BookOpen size={24} />}</span>
                              <div>
                                <h4>{lesson.title}</h4>
                                <p className="muted">{lesson.summary}</p>
                                <p className="small muted">{lesson.minutes} min · {lesson.sections.length} sections · {QUESTIONS.length} questions</p>
                                {!lesson.reviewed && <p className="small"><span className="tag predicted">Draft content</span> Awaiting chemistry teacher review.</p>}
                                {pos !== undefined && !done && <progress className="bar" value={pos + 1} max={lesson.sections.length} aria-label={`Progress: section ${pos + 1} of ${lesson.sections.length}`} />}
                                {done && <p className="small good-text"><Check size={14} aria-hidden="true" /> Completed{best !== null ? `. Best score ${best}%.` : '.'}</p>}
                              </div>
                            </div>
                            <a className="btn primary" href={`#/learn/${lesson.id}`}>{done ? 'Review lesson' : pos !== undefined ? 'Continue' : 'Start lesson'} <ArrowRight size={16} aria-hidden="true" /></a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}

function LessonReader({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const { progress, update, ready } = useProgress();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (ready && step === null) setStep(Math.min(progress.lessonPosition[lesson.id] ?? 0, lesson.sections.length - 1));
  }, [ready, step, progress.lessonPosition, lesson]);
  useEffect(() => { if (step !== null) update((p) => setLessonPosition(p, lesson.id, step)); }, [step, lesson.id, update]);
  useEffect(() => { document.getElementById('section-title')?.focus(); }, [step]);

  if (step === null) return <p className="muted" role="status"><Spinner label="Loading lesson" /> Loading lesson…</p>;
  const s = lesson.sections[step];
  const last = step === lesson.sections.length - 1;

  return (
    <div className="reader paper">
      <Breadcrumbs items={[{ label: 'Learn', href: '#/learn' }, { label: lesson.title }]} />
      <h1>{lesson.title}</h1>
      {step === 0 && (
        <div className="objectives">
          <h2>By the end of this lesson you can</h2>
          <ul>{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          {!lesson.reviewed && <p className="small muted">{lesson.syllabusNote}</p>}
        </div>
      )}
      <progress className="bar" value={step + 1} max={lesson.sections.length} aria-label={`Section ${step + 1} of ${lesson.sections.length}`} />
      <p className="small muted">Section {step + 1} of {lesson.sections.length}</p>
      <article aria-labelledby="section-title">
        <h2 id="section-title" tabIndex={-1}>{s.title}</h2>
        {s.body.map((para, i) => <p key={i} className="lesson-p">{para}</p>)}
        {s.example && (
          <div className="example">
            <h3>{s.example.title}</h3>
            <ul>{s.example.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        )}
        {s.tryIt && (
          <p>
            <a className="btn" href={`#/atom/${s.tryIt.element}${s.tryIt.isotope || s.tryIt.charge ? `?${[s.tryIt.isotope ? `iso=${s.tryIt.isotope}` : '', s.tryIt.charge ? `q=${s.tryIt.charge}` : ''].filter(Boolean).join('&')}` : ''}`}>{s.tryIt.label}</a>
          </p>
        )}
      </article>
      <KnowledgeCheck key={s.id} question={s.check} />
      <div className="row between">
        <button className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
        {last
          ? <a className="btn primary" href={`#/learn/${lesson.id}/quiz`}>Take the quiz <ArrowRight size={16} aria-hidden="true" /></a>
          : <button className="btn primary" onClick={() => setStep(step + 1)}>Next section <ArrowRight size={16} aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

function LessonQuiz({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const { progress, update, ready } = useProgress();
  const [attempt, setAttempt] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [saved, setSaved] = useState<{ correct: number; total: number } | null>(null);
  if (!ready) return <p className="muted" role="status"><Spinner label="Loading quiz" /> Loading…</p>;
  const prevBest = bestScore(progress, lesson.quizId);
  return (
    <div className="reader paper">
      <Breadcrumbs items={[{ label: 'Learn', href: '#/learn' }, { label: lesson.title, href: `#/learn/${lesson.id}` }, { label: 'Quiz' }]} />
      <h1>{lesson.title}: quiz</h1>
      {prevBest !== null && !saved && <p className="muted small">Your best score so far is {prevBest}%.</p>}
      <Quiz
        key={attempt}
        questions={QUESTIONS}
        seed={seed}
        finishLabel="See my score"
        onFinish={(r) => {
          setSaved(r);
          update((p) => completeLesson(recordAttempt(p, { quizId: lesson.quizId, at: new Date().toISOString(), correct: r.correct, total: r.total }), lesson.id));
        }}
        resultActions={
          <>
            <button className="btn primary" onClick={() => { go(`learn/${lesson.id}`); }}>Review the lesson</button>
            <button className="btn" onClick={() => { setSaved(null); setSeed(Math.floor(Math.random() * 1e6)); setAttempt((a) => a + 1); }}>Try again</button>
            <a className="btn" href="#/">Back to home</a>
          </>
        }
      />
      {saved && <p className="small muted" role="status">Result saved on this device. Mastery estimate: {mastery(progress, lesson.quizId) ?? saved.correct}%.</p>}
    </div>
  );
}
