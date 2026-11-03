import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/lessons';
import { evaluate } from '../engine/quiz';

describe('lesson knowledge checks', () => {
  const checks = LESSONS.flatMap((lesson) => lesson.sections.map((section) => ({
    lessonId: lesson.id,
    sectionId: section.id,
    question: section.check,
  })));

  it('provides one formative check for every published lesson section', () => {
    expect(checks).toHaveLength(LESSONS.reduce((total, lesson) => total + lesson.sections.length, 0));
    for (const item of checks) expect(item.question).toBeDefined();
  });

  it('uses unique identifiers across formative and end-of-lesson questions', () => {
    const ids = checks.map(({ question }) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a valid answer and targeted feedback for every incorrect choice', () => {
    for (const { question } of checks) {
      expect(question.choices.length).toBeGreaterThanOrEqual(2);
      expect(question.choices.some((choice) => choice.id === question.correct)).toBe(true);
      for (const choice of question.choices) {
        const result = evaluate(question, choice.id);
        expect(result.correct).toBe(choice.id === question.correct);
        if (choice.id !== question.correct) {
          expect(question.distractorNotes[choice.id]?.length).toBeGreaterThan(0);
        }
      }
      expect(question.explanation.length).toBeGreaterThan(0);
    }
  });
});
