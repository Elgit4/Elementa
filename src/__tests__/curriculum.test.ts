import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/lessons';
import { CURRICULUM, validateCurriculum } from '../data/curriculum';

describe('curriculum structure', () => {
  it('connects every published lesson to exactly one course topic', () => {
    expect(validateCurriculum()).toEqual([]);
    const assigned = CURRICULUM.flatMap((course) => course.topics.flatMap((topic) => topic.lessonIds));
    expect(assigned).toHaveLength(LESSONS.length);
    expect(new Set(assigned).size).toBe(LESSONS.length);
  });

  it('does not expose empty topics or courses as available learning content', () => {
    for (const course of CURRICULUM) {
      expect(course.topics.length).toBeGreaterThan(0);
      for (const topic of course.topics) expect(topic.lessonIds.length).toBeGreaterThan(0);
    }
  });

  it('keeps lesson assessment identifiers unique', () => {
    const quizIds = LESSONS.map((lesson) => lesson.quizId);
    expect(new Set(quizIds).size).toBe(quizIds.length);
  });
});
