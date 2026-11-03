import { LESSONS } from './lessons';

export interface CurriculumTopic {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
}

export interface CurriculumCourse {
  id: string;
  title: string;
  level: string;
  description: string;
  topics: CurriculumTopic[];
}

/**
 * The curriculum is deliberately a separate catalogue from lesson content.
 * Only published lesson IDs belong here; future syllabus topics are not shown
 * as available until their learning material and assessment exist.
 */
export const CURRICULUM: CurriculumCourse[] = [
  {
    id: 'chemistry-foundations',
    title: 'Chemistry foundations',
    level: 'Foundational',
    description: 'Understand the particles that make up matter and how atomic structure explains the behaviour of elements.',
    topics: [
      {
        id: 'atomic-structure',
        title: 'Atomic structure',
        description: 'Explore subatomic particles, atomic number, isotopes, electron arrangement and ions.',
        lessonIds: ['atoms'],
      },
    ],
  },
];

export function validateCurriculum(): string[] {
  const errors: string[] = [];
  const lessonIds = new Set(LESSONS.map((lesson) => lesson.id));
  const assigned = new Set<string>();

  for (const course of CURRICULUM) {
    if (!course.topics.length) errors.push(`Course "${course.id}" has no topics.`);
    for (const topic of course.topics) {
      if (!topic.lessonIds.length) errors.push(`Topic "${topic.id}" has no published lessons.`);
      for (const lessonId of topic.lessonIds) {
        if (!lessonIds.has(lessonId)) errors.push(`Topic "${topic.id}" references unknown lesson "${lessonId}".`);
        if (assigned.has(lessonId)) errors.push(`Lesson "${lessonId}" is assigned more than once.`);
        assigned.add(lessonId);
      }
    }
  }

  for (const lessonId of lessonIds) {
    if (!assigned.has(lessonId)) errors.push(`Lesson "${lessonId}" is not assigned to a curriculum topic.`);
  }
  return errors;
}
