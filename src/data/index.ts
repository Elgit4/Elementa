import raw from './elements.json';
import type { ElementData } from './types';

export type { ElementData, Isotope, Family } from './types';
export { FAMILIES, FAMILY_BY_ID } from './families';

export const ELEMENTS = raw as unknown as ElementData[];

const byNumber = new Map(ELEMENTS.map((e) => [e.number, e]));

export function getElement(n: number): ElementData | undefined {
  return byNumber.get(n);
}

export function getIsotope(el: ElementData, mass: number) {
  return el.isotopes.find((i) => i.mass === mass);
}
