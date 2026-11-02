import type { Question } from '../engine/quiz';

export interface LessonSection {
  id: string;
  title: string;
  /** Plain paragraphs. Use \n\n-free strings; each array item is one paragraph. */
  body: string[];
  /** Worked example shown in a highlighted block. */
  example?: { title: string; lines: string[] };
  /** Link into the atomic explorer, e.g. { symbolNumber: 6, label: 'Try carbon-14' }. */
  tryIt?: { element: number; isotope?: number; charge?: number; label: string };
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  sections: LessonSection[];
  quizId: string;
  /** Content review status. Set to true only after a chemistry teacher or reliable reference check. */
  reviewed: boolean;
  syllabusNote: string;
}

export const ATOMS_QUIZ_ID = 'atoms-quiz';

export const LESSONS: Lesson[] = [
  {
    id: 'atoms',
    title: 'Inside the atom',
    summary: 'Protons, neutrons, electrons, isotopes and ions, and how to work out how many of each an atom has.',
    minutes: 12,
    objectives: [
      'Name the three particles in an atom and give their charges.',
      'Work out protons, neutrons and electrons from atomic number and mass number.',
      'Explain what isotopes are and why relative atomic mass is not a whole number.',
      'Write the electron arrangement of atoms and simple ions.',
    ],
    quizId: ATOMS_QUIZ_ID,
    reviewed: false,
    syllabusNote: 'Draft content. Confirm topic coverage against the current WAEC chemistry syllabus and have a chemistry teacher review it.',
    sections: [
      {
        id: 'particles',
        title: 'What an atom is made of',
        body: [
          'Every atom has a small, dense centre called the nucleus, made of protons and neutrons. Electrons move in the space around it.',
          'A proton carries a charge of +1. A neutron has no charge. An electron carries a charge of −1.',
          'Protons and neutrons each have a mass of about 1 atomic mass unit. An electron is about 1840 times lighter, so almost all of an atom’s mass is in its nucleus.',
        ],
      },
      {
        id: 'atomic-number',
        title: 'Atomic number: what makes an element',
        body: [
          'The atomic number (Z) is the number of protons in the nucleus. It is what makes an atom the element it is: every carbon atom has 6 protons, every sodium atom has 11.',
          'A neutral atom has no overall charge, so its number of electrons equals its number of protons.',
        ],
        example: { title: 'Worked example: sodium', lines: ['Atomic number = 11', 'Protons = 11', 'Electrons in a neutral atom = 11'] },
        tryIt: { element: 11, label: 'See sodium in the atomic explorer' },
      },
      {
        id: 'isotopes',
        title: 'Mass number and isotopes',
        body: [
          'The mass number (A) is the number of protons plus neutrons in one atom. So the number of neutrons is A − Z.',
          'Atoms of the same element always have the same number of protons, but they can have different numbers of neutrons. Atoms of one element with different mass numbers are called isotopes.',
          'We write an isotope as carbon-14 or ¹⁴C. The small number is the mass number.',
        ],
        example: {
          title: 'Worked example: two isotopes of carbon (Z = 6)',
          lines: ['Carbon-12: neutrons = 12 − 6 = 6', 'Carbon-14: neutrons = 14 − 6 = 8', 'Both have 6 protons and 6 electrons when neutral.'],
        },
        tryIt: { element: 6, isotope: 14, label: 'Switch between carbon-12 and carbon-14' },
      },
      {
        id: 'ram',
        title: 'Why relative atomic mass is not a whole number',
        body: [
          'A real sample of an element is usually a mixture of isotopes. The relative atomic mass is the average mass of its atoms, weighted by how common each isotope is.',
          'No single chlorine atom has a mass number of 35.5. A chlorine atom is either chlorine-35 or chlorine-37, and the average of the mixture works out to about 35.5.',
        ],
        example: {
          title: 'Worked example: chlorine',
          lines: ['About 76% of chlorine atoms are chlorine-35', 'About 24% are chlorine-37', 'Weighted average ≈ 0.76 × 35 + 0.24 × 37 ≈ 35.5'],
        },
      },
      {
        id: 'shells',
        title: 'Electrons in shells',
        body: [
          'In the simple shell model, electrons sit in shells around the nucleus. The first shell holds up to 2 electrons, the second up to 8, and the third up to 18 (though for the first 20 elements the third shell is treated as holding 8 before the fourth starts).',
          'Shells fill from the inside out. The electrons in the outermost shell decide how the atom reacts.',
          'This is a simplified model. Real electrons occupy regions called orbitals, and some elements (such as chromium and copper) do not follow the simple filling order. Elementa marks these in the element pages.',
        ],
        example: { title: 'Worked example: chlorine (17 electrons)', lines: ['First shell: 2', 'Second shell: 8', 'Third shell: 7', 'Electron arrangement: 2, 8, 7'] },
        tryIt: { element: 17, label: 'Build the chlorine atom' },
      },
      {
        id: 'ions',
        title: 'Ions: atoms that gain or lose electrons',
        body: [
          'An atom becomes an ion when it gains or loses electrons. The number of protons never changes.',
          'Losing electrons leaves a positive ion (cation). Gaining electrons gives a negative ion (anion).',
          'Metals such as sodium lose their outer electron to form Na⁺ with arrangement 2, 8. Non-metals such as chlorine gain one to form Cl⁻ with arrangement 2, 8, 8. Both now have a full outer shell.',
        ],
        example: { title: 'Worked example: Mg²⁺', lines: ['Magnesium atom: 12 protons, 12 electrons (2, 8, 2)', 'Loses 2 electrons', 'Mg²⁺ ion: 12 protons, 10 electrons (2, 8)'] },
        tryIt: { element: 12, charge: 2, label: 'Make Mg²⁺' },
      },
    ],
  },
];

const q = (
  id: string, stem: string, choices: [string, string, string, string], correctIndex: number,
  explanation: string, notes: [string, string, string],
): Question => {
  const ids = ['a', 'b', 'c', 'd'];
  const wrongIds = ids.filter((_, i) => i !== correctIndex);
  return {
    id,
    stem,
    choices: choices.map((text, i) => ({ id: ids[i], text })),
    correct: ids[correctIndex],
    explanation,
    distractorNotes: Object.fromEntries(wrongIds.map((w, i) => [w, notes[i]])),
  };
};

export const QUESTIONS: Question[] = [
  q('protons-na', 'A sodium atom has atomic number 11. How many protons does it have?', ['10', '11', '12', '23'], 1,
    'The atomic number is the number of protons, so sodium always has 11 protons.',
    ['10 is the number of electrons in an Na⁺ ion, not the number of protons.', '12 is the number of neutrons in sodium-23 (23 − 11).', '23 is the mass number of sodium-23: protons plus neutrons.']),
  q('electrons-cl', 'A neutral atom of chlorine-35 has atomic number 17. How many electrons does it have?', ['16', '17', '18', '35'], 1,
    'In a neutral atom the number of electrons equals the number of protons, which is the atomic number. So 17.',
    ['With 17 protons and 16 electrons the particle would have a 1+ charge, so it would not be a neutral atom.', '18 is the number of neutrons in chlorine-35 (35 − 17), and also the electrons in Cl⁻.', '35 is the mass number (protons + neutrons), not the electron count.']),
  q('neutrons-c14', 'How many neutrons are in an atom of carbon-14 (atomic number 6)?', ['6', '8', '12', '14'], 1,
    'Neutrons = mass number − atomic number = 14 − 6 = 8.',
    ['6 is the number of protons. Carbon-12 has 6 neutrons, but carbon-14 has 2 more.', '12 is the mass number of carbon-12, a different isotope.', '14 is the mass number: protons plus neutrons together.']),
  q('isotopes-same', 'Isotopes of the same element have the same number of ___ but different numbers of ___.', ['protons; neutrons', 'neutrons; protons', 'protons; electrons', 'neutrons; electrons'], 0,
    'The number of protons defines the element, so isotopes always share it. They differ in neutrons, which changes the mass number.',
    ['If the number of protons changed, the atom would be a different element.', 'Electrons can change when an atom becomes an ion, but that does not make it a different isotope.', 'Isotopes are defined by neutron differences, and the shared quantity is protons, not neutrons.']),
  q('mass-number-k', 'An atom has 19 protons and 20 neutrons. What is its mass number?', ['19', '20', '39', '59'], 2,
    'Mass number = protons + neutrons = 19 + 20 = 39. This is potassium-39.',
    ['19 is the atomic number (protons only).', '20 is only the neutrons.', '59 comes from adding the numbers wrongly or adding electrons as well. Electrons are not counted in the mass number.']),
  q('cl-mass', 'The relative atomic mass of chlorine is about 35.5, yet no chlorine atom has a mass number of 35.5. Why?', [
    'It is the average mass of a mixture of chlorine-35 and chlorine-37 atoms, weighted by how common each is',
    'Chlorine atoms contain half a neutron',
    'It is the mass of the Cl⁻ ion, which has an extra electron',
    'Chlorine cannot be measured accurately enough to give a whole number'], 0,
    'Natural chlorine is a mixture of about 76% chlorine-35 and 24% chlorine-37. The relative atomic mass is their weighted average.',
    ['Neutrons are whole particles. No atom contains half a neutron.', 'An electron has about 1/1840 of the mass of a proton, so one extra electron cannot add 0.5.', 'Atomic masses are measured very precisely. The non-whole number comes from the isotope mixture, not from poor measurement.']),
  q('shells-cl', 'Chlorine has 17 electrons. What is its electron arrangement?', ['2, 7, 8', '2, 8, 7', '2, 8, 8', '2, 15'], 1,
    'The first shell takes 2, the second takes 8, and the 7 left over go in the third shell: 2, 8, 7.',
    ['Inner shells fill first, so the second shell holds 8 before any electrons go into the third.', '2, 8, 8 adds up to 18 electrons. That is the arrangement of the chloride ion Cl⁻, or an argon atom.', 'The second shell holds up to 8 electrons, so all 15 cannot go there.']),
  q('electrons-mg2', 'A magnesium atom (atomic number 12) forms an Mg²⁺ ion. How many electrons does the ion have?', ['2', '10', '12', '14'], 1,
    'The 2+ charge means two electrons were lost. 12 − 2 = 10 electrons. The ion still has 12 protons.',
    ['2 is the size of the charge, not the number of electrons.', '12 is the number of protons. The neutral atom has 12 electrons, but the 2+ ion has lost two.', '14 would mean electrons were gained. A positive ion has lost electrons.']),
  q('ne-like', 'Which particle has the same electron arrangement as a neon atom (2, 8)?', ['Na⁺', 'Na', 'Cl⁻', 'Mg'], 0,
    'Na⁺ has lost its outer electron: 11 − 1 = 10 electrons, arranged 2, 8, the same as neon.',
    ['A sodium atom has 11 electrons, arranged 2, 8, 1.', 'Cl⁻ has 18 electrons, arranged 2, 8, 8, like argon.', 'A magnesium atom has 12 electrons, arranged 2, 8, 2.']),
];
