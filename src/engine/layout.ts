import type { ElementData } from '../data/types';

export interface Cell { col: number; row: number }

/** Grid position (1-indexed) in the standard 18-column table with f-block rows below. */
export function cellFor(el: Pick<ElementData, 'number' | 'group' | 'period' | 'family'>): Cell {
  if (el.family === 'lanthanide') return { col: el.number - 57 + 3, row: 9 };
  if (el.family === 'actinide') return { col: el.number - 89 + 3, row: 10 };
  return { col: el.group!, row: el.period! };
}
