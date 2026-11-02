import type { ElementData } from '../data/types';

/**
 * Search by atomic number (exact), symbol or name.
 * Ranking: exact symbol/name/number, then name prefix, symbol prefix, name contains.
 */
export function searchElements(elements: ElementData[], query: string): ElementData[] {
  const q = query.trim().toLowerCase();
  if (!q) return elements;
  if (/^\d+$/.test(q)) {
    const n = Number(q);
    return elements.filter((e) => e.number === n);
  }
  const scored: [number, ElementData][] = [];
  for (const e of elements) {
    const name = e.name.toLowerCase();
    const sym = e.symbol.toLowerCase();
    let score = -1;
    if (sym === q) score = 0;
    else if (name === q) score = 1;
    else if (name.startsWith(q)) score = 2;
    else if (sym.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 4;
    if (score >= 0) scored.push([score, e]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].number - b[1].number).map(([, e]) => e);
}
