import type { ElementData } from '../data/types';

export interface Particles {
  protons: number;
  neutrons: number;
  electrons: number;
  /** Net charge = protons - electrons. */
  charge: number;
  massNumber: number;
}

/** Protons = Z; neutrons = A - Z; electrons = Z - charge. */
export function particles(atomicNumber: number, massNumber: number, charge = 0): Particles {
  if (!Number.isInteger(atomicNumber) || atomicNumber < 1) throw new RangeError('atomic number must be a positive integer');
  if (!Number.isInteger(massNumber) || massNumber < atomicNumber) throw new RangeError('mass number must be an integer >= atomic number');
  const electrons = atomicNumber - charge;
  if (!Number.isInteger(charge) || electrons < 0) throw new RangeError('invalid charge');
  return { protons: atomicNumber, neutrons: massNumber - atomicNumber, electrons, charge, massNumber };
}

/** Maximum electrons in shell n (1-indexed) in the simplified Bohr model: 2n^2. */
export const shellCapacity = (n: number) => 2 * n * n;

/**
 * Electrons per shell for an ion, in the simplified shell model.
 * Cations lose electrons from the outermost shell first; anions gain electrons in the
 * outermost shell, which may hold at most 8 (2 if it is the only shell).
 * Returns null when the ion is outside this simplified model.
 */
export function ionShells(neutralShells: number[], charge: number): number[] | null {
  const shells = [...neutralShells];
  if (charge > 0) {
    let toRemove = charge;
    for (let i = shells.length - 1; i >= 0 && toRemove > 0; i--) {
      const take = Math.min(shells[i], toRemove);
      shells[i] -= take;
      toRemove -= take;
    }
    if (toRemove > 0) return null;
  } else if (charge < 0) {
    const last = shells.length - 1;
    const cap = last === 0 ? 2 : 8;
    if (shells[last] - charge > cap) return null;
    shells[last] -= charge;
  }
  return shells.filter((s) => s > 0);
}

/** Common textbook ions of d-block metals (charges only). Everything else in the d/f blocks is not offered. */
const D_BLOCK_IONS: Record<string, number[]> = {
  Sc: [3], Ti: [2, 3], V: [2, 3], Cr: [2, 3], Mn: [2], Fe: [2, 3], Co: [2, 3], Ni: [2],
  Cu: [1, 2], Zn: [2], Y: [3], Ag: [1], Cd: [2], Au: [1, 3], Hg: [2],
};

/**
 * Ion charges the atomic explorer offers (always includes 0), limited to ions that are
 * chemically common and that the simplified shell model represents correctly.
 */
export function ionCharges(el: Pick<ElementData, 'shells' | 'block' | 'family' | 'symbol'>): number[] {
  const out = new Set<number>([0]);
  if (el.family === 'noble-gas') return [0];
  const outer = el.shells[el.shells.length - 1];
  if (el.block === 's') {
    out.add(outer); // H+ (1), Li+ … Be2+ …
    if (el.symbol === 'H') out.add(-1); // hydride
  } else if (el.block === 'p') {
    if (outer <= 3 && el.family !== 'nonmetal' && el.family !== 'metalloid') out.add(outer); // Al3+, Ga3+ …
    if (outer >= 5 && el.family === 'nonmetal') out.add(outer - 8); // N3-, O2-, F-, Cl- …
  } else {
    for (const c of D_BLOCK_IONS[el.symbol] ?? []) out.add(c);
  }
  return [...out].filter((c) => ionShells(el.shells, c) !== null).sort((a, b) => a - b);
}

export function chargeLabel(charge: number): string {
  if (charge === 0) return '0';
  const sign = charge > 0 ? '+' : '−';
  const mag = Math.abs(charge);
  return mag === 1 ? sign : `${mag}${sign}`;
}

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const toSuperscript = (n: number) => [...String(n)].map((d) => SUP[+d]).join('');
export const toSubscript = (n: number) => [...String(n)].map((d) => SUB[+d]).join('');

/** e.g. "Carbon-14" for display, "¹⁴C" for notation. */
export const isotopeName = (name: string, mass: number) => `${name}-${mass}`;
export const isotopeNotation = (symbol: string, mass: number) => `${toSuperscript(mass)}${symbol}`;
