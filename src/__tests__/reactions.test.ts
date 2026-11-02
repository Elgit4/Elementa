import { describe, expect, it } from 'vitest';
import { REACTIONS, atomCounts, balanceMessage, balanceReport, equationText, parseFormula, solveLowest } from '../engine/reactions';

// Independent oracle: total atoms on each side of the balanced equation, worked out by hand.
const ATOMS: Record<string, Record<string, number>> = {
  'mg-o2': { Mg: 2, O: 2 },
  'zn-hcl': { Zn: 1, H: 2, Cl: 2 },
  'fe-cuso4': { Fe: 1, Cu: 1, S: 1, O: 4 },
  'hcl-naoh': { H: 2, Cl: 1, Na: 1, O: 1 },
  'caco3-hcl': { Ca: 1, C: 1, O: 3, H: 2, Cl: 2 },
  'ch4-o2': { C: 1, H: 4, O: 4 },
  'na-h2o': { Na: 2, H: 4, O: 2 },
};

describe('formula parsing', () => {
  it('counts atoms', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 });
    expect(parseFormula('CaCO3')).toEqual({ Ca: 1, C: 1, O: 3 });
    expect(parseFormula('CuSO4')).toEqual({ Cu: 1, S: 1, O: 4 });
    expect(parseFormula('Cl2')).toEqual({ Cl: 2 });
  });
  it('rejects formulas it cannot read rather than guessing', () => {
    for (const f of ['Ca(OH)2', 'CuSO4.5H2O', 'h2o', '2H2O', '']) expect(() => parseFormula(f), f).toThrow(RangeError);
  });
});

describe('every reaction is correct', () => {
  it('has the hand-worked atom totals on both sides', () => {
    for (const r of REACTIONS) {
      const n = r.reactants.length;
      expect(atomCounts(r.reactants, r.coefficients.slice(0, n)), `${r.id} left`).toEqual(ATOMS[r.id]);
      expect(atomCounts(r.products, r.coefficients.slice(n)), `${r.id} right`).toEqual(ATOMS[r.id]);
    }
    expect(Object.keys(ATOMS).sort()).toEqual(REACTIONS.map((r) => r.id).sort());
  });
  it('the stored coefficients are balanced, in lowest terms and the only such solution (found independently by search)', () => {
    for (const r of REACTIONS) {
      const rep = balanceReport(r, r.coefficients);
      expect(rep.balanced, r.id).toBe(true); expect(rep.lowestTerms, r.id).toBe(true);
      expect(solveLowest(r), r.id).toEqual([r.coefficients]);
    }
  });
  it('has observations, an explanation and unique ids', () => {
    expect(new Set(REACTIONS.map((r) => r.id)).size).toBe(REACTIONS.length);
    for (const r of REACTIONS) { expect(r.observations.length, r.id).toBeGreaterThan(0); expect(r.explanation.length, r.id).toBeGreaterThan(0); }
    expect(REACTIONS.filter((r) => r.safety).map((r) => r.id)).toContain('na-h2o');
  });
  it('writes equations with state symbols and subscripts', () => {
    expect(equationText(REACTIONS[0])).toBe('2Mg(s) + O₂(g) → 2MgO(s)');
    expect(equationText(REACTIONS.find((r) => r.id === 'caco3-hcl')!)).toBe('CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)');
  });
});

describe('balancing checks', () => {
  const mg = REACTIONS[0];
  it('flags an unbalanced attempt and says which element is wrong', () => {
    const rep = balanceReport(mg, [1, 1, 1]);
    expect(rep.balanced).toBe(false);
    expect(rep.rows.find((x) => x.element === 'O')).toMatchObject({ left: 2, right: 1, ok: false });
    expect(rep.rows.find((x) => x.element === 'Mg')).toMatchObject({ left: 1, right: 1, ok: true });
  });
  it('accepts a balanced answer that is not in lowest terms but says so', () => {
    const rep = balanceReport(mg, [4, 2, 4]);
    expect(rep.balanced).toBe(true); expect(rep.lowestTerms).toBe(false); expect(rep.commonFactor).toBe(2);
  });
  it('rejects impossible coefficients', () => {
    expect(() => balanceReport(mg, [0, 1, 1])).toThrow(RangeError);
    expect(() => balanceReport(mg, [1, 1])).toThrow(RangeError);
    expect(() => balanceReport(mg, [1.5, 1, 1])).toThrow(RangeError);
  });
});

describe('student feedback', () => {
  const mg = REACTIONS[0];
  it('names the first element that does not match, with the real counts', () => {
    const m = balanceMessage(mg, [1, 1, 1]);
    expect(m.kind).toBe('unbalanced');
    expect(m.text).toContain('Oxygen (O): 2 atoms on the left and 1 atom on the right.');
  });
  it('mentions other elements that also fail', () => {
    const zn = REACTIONS.find((r) => r.id === 'zn-hcl')!;
    expect(balanceMessage(zn, [1, 1, 1, 1]).text).toContain('Not balanced yet.');
    expect(balanceMessage(REACTIONS.find((r) => r.id === 'caco3-hcl')!, [1, 1, 1, 1, 1]).text).toMatch(/also (does|do) not match/);
  });
  it('recognises balanced, and balanced-but-not-simplest', () => {
    expect(balanceMessage(mg, [2, 1, 2]).kind).toBe('balanced');
    const m = balanceMessage(mg, [4, 2, 4]);
    expect(m.kind).toBe('not-lowest'); expect(m.text).toContain('Divide every coefficient by 2');
  });
});
