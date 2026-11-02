export type Family =
  | 'nonmetal' | 'noble-gas' | 'alkali-metal' | 'alkaline-earth' | 'metalloid'
  | 'post-transition' | 'transition-metal' | 'lanthanide' | 'actinide' | 'unknown';

export interface Isotope {
  mass: number;
  neutrons: number;
  stable: boolean;
  /** Natural abundance in %, or null when not reported. */
  abundance: number | null;
}

export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  /** Weighted-average relative atomic mass (NOT a single isotope's mass number). */
  relativeAtomicMass: number | null;
  group: number | null;
  period: number | null;
  block: 's' | 'p' | 'd' | 'f' | null;
  family: Family;
  /** True when the source labels the family as a prediction ("unknown, probably …"). */
  familyPredicted: boolean;
  seriesRaw: string;
  phase: 'Gas' | 'Liquid' | 'Solid' | null;
  phaseRef: string;
  appearance: string | null;
  density: { value: number; unit: string; ref: string } | null;
  meltingPointK: number | null;
  boilingPointK: number | null;
  electronegativity: number | null;
  firstIonisationKJ: number | null;
  oxidationStates: string | null;
  radiusPm: { calculated: number | null; empirical: number | null; covalent: number | null };
  electronConfig: string | null;
  electronConfigShort: string;
  /** True for elements whose electron configuration is predicted, not measured. */
  configPredicted: boolean;
  /** Electrons per shell for the neutral atom (K, L, M, …). */
  shells: number[];
  discovered: { year: number | null; by: string | null } | null;
  crustAbundancePercent: number | null;
  isotopes: Isotope[];
  defaultIsotope: number;
  /** 'most-abundant' for natural abundance data; 'representative' otherwise. */
  defaultIsotopeBasis: 'most-abundant' | 'representative';
  cpk: string | null;
}
