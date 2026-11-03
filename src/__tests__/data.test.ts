import { describe, expect, it } from 'vitest';
import { ELEMENTS, getElement } from '../data';
import { ELEMENT_LABELS, getElementLabel } from '../data/element-labels';
import { dailyQuestion } from '../engine/daily';
import { filingException, parseConfig, totalElectrons } from '../engine/config';

describe('element data integrity', () => {
  it('has exactly 118 elements numbered 1..118 with unique symbols and names', () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((e, i) => expect(e.number).toBe(i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
    expect(new Set(ELEMENTS.map((e) => e.name)).size).toBe(118);
  });

  it('shell electrons and configuration electrons both sum to the atomic number', () => {
    for (const e of ELEMENTS) {
      expect(e.shells.reduce((a, b) => a + b, 0), `${e.symbol} shells`).toBe(e.number);
      expect(totalElectrons(parseConfig(e.electronConfig!)), `${e.symbol} full config`).toBe(e.number);
      expect(totalElectrons(parseConfig(e.electronConfigShort)), `${e.symbol} short config`).toBe(e.number);
    }
  });

  it('every isotope has neutrons = mass - Z >= 0 and the default isotope is listed', () => {
    for (const e of ELEMENTS) {
      expect(e.isotopes.length, e.symbol).toBeGreaterThan(0);
      for (const i of e.isotopes) {
        expect(i.neutrons, `${e.symbol}-${i.mass}`).toBe(i.mass - e.number);
        expect(i.neutrons).toBeGreaterThanOrEqual(0);
      }
      expect(e.isotopes.some((i) => i.mass === e.defaultIsotope), `${e.symbol} default`).toBe(true);
    }
  });

  it('natural abundances of each element sum to about 100%', () => {
    for (const e of ELEMENTS) {
      const ab = e.isotopes.filter((i) => i.abundance !== null);
      if (!ab.length) continue;
      const total = ab.reduce((s, i) => s + (i.abundance ?? 0), 0);
      expect(total, e.symbol).toBeGreaterThan(99.5);
      expect(total, e.symbol).toBeLessThan(100.5);
    }
  });

  it('keeps relative atomic mass distinct from the default isotope mass number', () => {
    const cl = getElement(17)!;
    expect(cl.relativeAtomicMass).toBeCloseTo(35.45, 1);
    expect(cl.defaultIsotope).toBe(35);
    expect(cl.isotopes.filter((i) => i.abundance !== null).map((i) => i.mass)).toEqual([35, 37]);
  });

  it('matches known isotope facts', () => {
    const c = getElement(6)!;
    expect(c.isotopes.find((i) => i.mass === 12)!.neutrons).toBe(6);
    expect(c.isotopes.find((i) => i.mass === 14)!.neutrons).toBe(8);
    expect(c.isotopes.find((i) => i.mass === 14)!.stable).toBe(false);
    expect(c.defaultIsotope).toBe(12);
    expect(getElement(1)!.defaultIsotope).toBe(1);
    expect(getElement(92)!.defaultIsotope).toBe(238);
  });

  it('flags predicted classification/configuration for the heaviest elements, not for common ones', () => {
    expect(getElement(118)!.configPredicted).toBe(true);
    expect(getElement(118)!.familyPredicted).toBe(true);
    for (const n of [1, 6, 8, 11, 17, 26, 29, 79]) {
      expect(getElement(n)!.configPredicted, `Z=${n}`).toBe(false);
      expect(getElement(n)!.familyPredicted, `Z=${n}`).toBe(false);
    }
  });

  it('every element has period 1-7, a block and a known family', () => {
    for (const e of ELEMENTS) {
      expect(e.period, e.symbol).toBeGreaterThanOrEqual(1);
      expect(e.period, e.symbol).toBeLessThanOrEqual(7);
      expect(['s', 'p', 'd', 'f'], e.symbol).toContain(e.block);
      expect(e.family).not.toBe('unknown');
    }
  });
});

describe('lightweight element labels and daily challenge', () => {
  it('keeps every compact label identical to the canonical element dataset', () => {
    expect(ELEMENT_LABELS).toHaveLength(ELEMENTS.length);
    expect(ELEMENT_LABELS).toEqual(ELEMENTS.map(({ number, symbol, name }) => ({ number, symbol, name })));
    for (const element of ELEMENTS) expect(getElementLabel(element.number)).toEqual({
      number: element.number, symbol: element.symbol, name: element.name,
    });
    expect(getElementLabel(0)).toBeUndefined();
    expect(getElementLabel(119)).toBeUndefined();
  });

  it('generates valid daily questions using the same first 30 canonical elements', () => {
    for (const date of ['2026-01-01', '2026-06-15', '2026-11-03', '2027-12-31']) {
      const question = dailyQuestion(date);
      expect(question.id).toBe(`daily-${date}`);
      expect(question.choices).toHaveLength(4);
      expect(question.choices.some((choice) => choice.id === question.correct)).toBe(true);
      expect(question.explanation.length).toBeGreaterThan(0);
      expect(question.choices.every((choice) => choice.text.length > 0)).toBe(true);
    }
  });
});

describe('electron configuration exceptions', () => {
  const expected: Record<string, string> = {
    Cr: '[Ar] 3d⁵ 4s¹', Cu: '[Ar] 3d¹⁰ 4s¹', Nb: '[Kr] 4d⁴ 5s¹', Mo: '[Kr] 4d⁵ 5s¹',
    Ru: '[Kr] 4d⁷ 5s¹', Rh: '[Kr] 4d⁸ 5s¹', Pd: '[Kr] 4d¹⁰', Ag: '[Kr] 4d¹⁰ 5s¹',
    La: '[Xe] 5d¹ 6s²', Ce: '[Xe] 4f¹ 5d¹ 6s²', Gd: '[Xe] 4f⁷ 5d¹ 6s²',
    Pt: '[Xe] 4f¹⁴ 5d⁹ 6s¹', Au: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', Ac: '[Rn] 6d¹ 7s²', Th: '[Rn] 6d² 7s²',
  };
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const sym = (s: string) => ELEMENTS.find((e) => e.symbol === s)!;

  it('data holds the textbook configuration for the classic d- and f-block exceptions', () => {
    for (const [s, cfg] of Object.entries(expected)) {
      // Compare occupancy, so the order in which subshells are written does not matter.
      expect(parseConfig(sym(s).electronConfigShort), s).toEqual(parseConfig(cfg));
    }
  });

  it('detects the classic exceptions and not regular elements', () => {
    for (const s of ['Cr', 'Cu', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'La', 'Ce', 'Gd', 'Pt', 'Au']) {
      expect(filingException(sym(s).number, sym(s).electronConfig!).isException, s).toBe(true);
    }
    for (const s of ['H', 'C', 'O', 'Na', 'Cl', 'K', 'Ca', 'Fe', 'Zn', 'Br']) {
      expect(filingException(sym(s).number, sym(s).electronConfig!).isException, s).toBe(false);
    }
  });

  it('explains chromium: 4s and 3d differ from the simple order', () => {
    const cr = sym('Cr');
    const info = filingException(cr.number, cr.electronConfig!);
    expect(info.differences).toEqual(
      expect.arrayContaining([
        { subshell: '4s', expected: 2, actual: 1 },
        { subshell: '3d', expected: 4, actual: 5 },
      ]),
    );
    expect(norm(cr.electronConfigShort)).toContain('3d⁵');
  });
});
