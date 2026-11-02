import { describe, expect, it } from 'vitest';
import { ELEMENTS, getElement } from '../data';
import { TRENDS, TREND_BY_ID, formatTrendValue, numberRanges, summarise, trendFraction, trendValue, withUnit } from '../engine/trends';
import { INK_DARK, INK_LIGHT, contrast, trendColor, type Theme } from '../engine/trendColor';

const val = (id: keyof typeof TREND_BY_ID, n: number) => trendValue(TREND_BY_ID[id], getElement(n)!);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const strictly = (xs: (number | null)[], dir: 'down' | 'up') => xs.every((x, i) => x !== null && (i === 0 || (dir === 'down' ? x < xs[i - 1]! : x > xs[i - 1]!)));

const neverRises = (xs: (number | null)[]) => xs.every((x, i) => x !== null && (i === 0 || x <= xs[i - 1]!)) && xs[0]! > xs[xs.length - 1]!;

describe('trend data matches the textbook patterns', () => {
  it('atomic radius falls across periods 2 and 3 and rises down groups 1, 2, 17, 18 (to period 6)', () => {
    expect(strictly(range(3, 10).map((n) => val('radius', n)), 'down')).toBe(true);
    expect(strictly(range(11, 18).map((n) => val('radius', n)), 'down')).toBe(true);
    for (const col of [[3, 11, 19, 37, 55], [4, 12, 20, 38, 56], [9, 17, 35, 53, 85], [2, 10, 18, 36, 54, 86]]) {
      expect(strictly(col.map((n) => val('radius', n)), 'up')).toBe(true);
    }
  });

  it('first ionisation energy rises across periods 2 and 3 apart from the documented dips', () => {
    const dips = new Set(TREND_BY_ID.ionisation.exceptions.map((x) => x.to));
    for (const n of [...range(4, 10), ...range(12, 18)]) {
      const prev = val('ionisation', n - 1)!, cur = val('ionisation', n)!;
      expect(dips.has(n) ? cur < prev : cur > prev, `Z=${n}`).toBe(true);
    }
  });

  it('first ionisation energy falls down groups 1, 2, 17, 18 through period 6', () => {
    for (const col of [[3, 11, 19, 37, 55], [4, 12, 20, 38, 56], [9, 17, 35, 53, 85], [2, 10, 18, 36, 54, 86]]) {
      expect(strictly(col.map((n) => val('ionisation', n)), 'down')).toBe(true);
    }
  });

  it('electronegativity rises across periods 2 and 3 (to the halogens) and never rises down groups 1, 2, 17 (K and Rb tie at 0.82)', () => {
    expect(strictly(range(3, 9).map((n) => val('electronegativity', n)), 'up')).toBe(true);
    expect(strictly(range(11, 17).map((n) => val('electronegativity', n)), 'up')).toBe(true);
    for (const col of [[3, 11, 19, 37, 55], [4, 12, 20, 38, 56], [9, 17, 35, 53, 85]]) {
      expect(neverRises(col.map((n) => val('electronegativity', n)))).toBe(true);
    }
  });

  it('every documented exception is a real departure in the data, in the stated direction', () => {
    for (const t of TRENDS) for (const x of t.exceptions) {
      const a = trendValue(t, getElement(x.from)!), b = trendValue(t, getElement(x.to)!);
      expect(a, `${t.id} ${x.from}`).not.toBeNull(); expect(b, `${t.id} ${x.to}`).not.toBeNull();
      // Dips (with a reason) fall from `from` to `to`; the Cs->Fr / Ba->Ra reversals (no reason) rise against a falling trend.
      expect(b! < a!, `${t.id} ${x.from}->${x.to}`).toBe(x.reason !== null);
    }
  });

  it('known extremes: fluorine is the most electronegative, caesium has the lowest ionisation energy, helium the highest', () => {
    expect(summarise(TREND_BY_ID.electronegativity, ELEMENTS).highest.map((e) => e.symbol)).toEqual(['F']);
    expect(summarise(TREND_BY_ID.ionisation, ELEMENTS).lowest.map((e) => e.symbol)).toEqual(['Cs']);
    expect(summarise(TREND_BY_ID.ionisation, ELEMENTS).highest.map((e) => e.symbol)).toEqual(['He']);
  });
});

describe('missing data is never invented', () => {
  it('reports noble gases He, Ne, Ar and elements 104+ as having no electronegativity', () => {
    const missing = summarise(TREND_BY_ID.electronegativity, ELEMENTS).missing.map((e) => e.number);
    for (const n of [2, 10, 18, 104, 118]) expect(missing).toContain(n);
    for (const n of [9, 36, 54]) expect(missing).not.toContain(n);
  });
  it('gives a null fraction and "no value" text for missing values', () => {
    const t = TREND_BY_ID.radius, s = summarise(t, ELEMENTS);
    expect(trendFraction(null, s)).toBeNull();
    expect(formatTrendValue(t, null)).toBe('no value');
    expect(withUnit(t, null)).toBe('no value');
  });
  it('formats values with units and sensible precision', () => {
    expect(withUnit(TREND_BY_ID.electronegativity, 3.98)).toBe('3.98');
    expect(withUnit(TREND_BY_ID.ionisation, 1681)).toBe('1681 kJ/mol');
    expect(withUnit(TREND_BY_ID.radius, 190)).toBe('190 pm');
  });
  it('fractions stay within 0..1 and order matches values', () => {
    for (const t of TRENDS) {
      const s = summarise(t, ELEMENTS);
      const fr = ELEMENTS.map((e) => trendFraction(trendValue(t, e), s)).filter((f): f is number => f !== null);
      expect(Math.min(...fr)).toBe(0); expect(Math.max(...fr)).toBeGreaterThan(0.97); expect(Math.max(...fr)).toBeLessThanOrEqual(1);
    }
  });
  it('colours by rank: order is preserved, ties share a colour, and gaps in value do not stretch the scale', () => {
    const s = { sorted: [1, 2, 2, 3, 100] };
    expect(trendFraction(1, s)).toBe(0);
    expect(trendFraction(2, s)).toBe(trendFraction(2, s));
    expect(trendFraction(2, s)).toBe(0.25);
    expect(trendFraction(3, s)).toBe(0.75);
    expect(trendFraction(100, s)).toBe(1);
  });
  it('higher values never get a lower colour position (monotonic)', () => {
    for (const t of TRENDS) {
      const s = summarise(t, ELEMENTS);
      const pairs = ELEMENTS.map((e) => trendValue(t, e)).filter((v): v is number => v !== null).sort((a, b) => a - b);
      const fr = pairs.map((v) => trendFraction(v, s)!);
      expect(fr.every((f, i) => i === 0 || f >= fr[i - 1])).toBe(true);
    }
  });
  it('formats atomic-number ranges', () => { expect(numberRanges([58, 57, 87, 88, 89, 100])).toBe('57–58, 87–89, 100'); });
});

describe('overlay colours stay readable', () => {
  it('ink reaches WCAG AA (4.5:1) at every point of the ramp in both themes', () => {
    for (const theme of ['dark', 'light'] as Theme[]) for (let i = 0; i <= 100; i++) {
      const { bg, ink } = trendColor(i / 100, theme);
      expect([INK_LIGHT, INK_DARK]).toContain(ink);
      expect(contrast(bg, ink), `${theme} ${i}%`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
