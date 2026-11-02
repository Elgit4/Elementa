import type { Family } from './types';

export interface FamilyInfo {
  id: Family;
  label: string;
  /** Short student-friendly description. */
  blurb: string;
}

/** Display order matches the legend. */
export const FAMILIES: FamilyInfo[] = [
  { id: 'alkali-metal', label: 'Alkali metals', blurb: 'Group 1 (not hydrogen). Soft, very reactive metals with one outer electron.' },
  { id: 'alkaline-earth', label: 'Alkaline earth metals', blurb: 'Group 2. Reactive metals with two outer electrons.' },
  { id: 'transition-metal', label: 'Transition metals', blurb: 'The central block. Hard, dense metals that form coloured compounds and ions of several charges.' },
  { id: 'post-transition', label: 'Post-transition metals', blurb: 'Softer, lower-melting metals to the right of the transition block.' },
  { id: 'metalloid', label: 'Metalloids', blurb: 'Along the staircase. Properties between metals and non-metals; silicon is a semiconductor.' },
  { id: 'nonmetal', label: 'Other non-metals', blurb: 'Hydrogen, carbon, nitrogen, oxygen, phosphorus, sulfur, selenium and the halogens (group 17).' },
  { id: 'noble-gas', label: 'Noble gases', blurb: 'Group 18. Full outer shells, so they rarely react.' },
  { id: 'lanthanide', label: 'Lanthanides', blurb: 'The first row of the f-block (La to Lu). Silvery metals with very similar chemistry.' },
  { id: 'actinide', label: 'Actinides', blurb: 'The second row of the f-block (Ac to Lr). All radioactive.' },
  { id: 'unknown', label: 'Unclassified', blurb: 'Family not established.' },
];

export const FAMILY_BY_ID: Record<Family, FamilyInfo> = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f]),
) as Record<Family, FamilyInfo>;
