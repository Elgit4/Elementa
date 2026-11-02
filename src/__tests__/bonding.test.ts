import { describe, expect, it } from 'vitest';
import { getElement } from '../data';
import { IONIC_METALS, IONIC_NONMETALS, MOLECULES, analyseMolecule, displayFormula, formulaCounts, ionicCompound, ionicSteps } from '../engine/bonding';

const KNOWN: Record<string, string> = {
  'Na+Cl': 'NaCl', 'Mg+O': 'MgO', 'Ca+Cl': 'CaCl2', 'Al+O': 'Al2O3', 'K+S': 'K2S', 'Li+N': 'Li3N', 'Al+Cl': 'AlCl3',
  'Mg+Br': 'MgBr2', 'Na+O': 'Na2O', 'Ca+O': 'CaO', 'Al+N': 'AlN', 'Mg+N': 'Mg3N2', 'Ca+N': 'Ca3N2', 'Al+S': 'Al2S3',
  'Li+F': 'LiF', 'K+Br': 'KBr', 'Mg+F': 'MgF2', 'Ca+S': 'CaS', 'Na+S': 'Na2S', 'K+N': 'K3N',
};

describe('ionic bonding', () => {
  it('gives the textbook formula for known compounds', () => {
    for (const [key, formula] of Object.entries(KNOWN)) {
      const [m, n] = key.split('+');
      const mz = IONIC_METALS.find((z) => getElement(z)!.symbol === m)!, nz = IONIC_NONMETALS.find((z) => getElement(z)!.symbol === n)!;
      expect(ionicCompound(mz, nz).formula, key).toBe(formula);
    }
  });

  it('names compounds correctly', () => {
    const nm = (m: number, n: number) => ionicCompound(m, n).name;
    expect(nm(11, 17)).toBe('Sodium chloride');
    expect(nm(12, 8)).toBe('Magnesium oxide');
    expect(nm(13, 8)).toBe('Aluminium oxide');
    expect(nm(20, 16)).toBe('Calcium sulfide');
    expect(nm(3, 7)).toBe('Lithium nitride');
  });

  it('is self-consistent for all 36 metal and non-metal pairs', () => {
    let n = 0;
    for (const m of IONIC_METALS) for (const x of IONIC_NONMETALS) {
      const r = ionicCompound(m, x); n++;
      const id = r.formula;
      expect(r.metalCount * r.metal.charge + r.nonmetalCount * r.nonmetal.charge, `${id} neutral`).toBe(0);
      expect(r.metalCount * r.metal.moved, `${id} electrons lost = gained`).toBe(r.nonmetalCount * r.nonmetal.moved);
      expect(r.transferred).toBe(r.metalCount * r.metal.moved);
      // lowest terms: the two counts share no common factor
      const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
      expect(g(r.metalCount, r.nonmetalCount), `${id} lowest terms`).toBe(1);
      // electron counts of the ions
      const mEl = getElement(m)!, xEl = getElement(x)!;
      expect(r.metal.shellsAfter.reduce((a, b) => a + b, 0)).toBe(m - r.metal.charge);
      expect(r.nonmetal.shellsAfter.reduce((a, b) => a + b, 0)).toBe(x - r.nonmetal.charge);
      expect(mEl.symbol.length).toBeGreaterThan(0); expect(xEl.symbol.length).toBeGreaterThan(0);
      // every ion has a noble-gas arrangement, and it is the right one
      expect(r.metal.nobleGas, `${r.metal.symbol} ion`).not.toBeNull();
      expect(r.nonmetal.nobleGas, `${r.nonmetal.symbol} ion`).not.toBeNull();
      expect(r.nonmetal.shellsAfter[r.nonmetal.shellsAfter.length - 1]).toBe(8);
    }
    expect(n).toBe(36);
  });

  it('gives the textbook ion charges and arrangements', () => {
    const na = ionicCompound(11, 17), mg = ionicCompound(12, 8), al = ionicCompound(13, 7);
    expect([na.metal.charge, na.nonmetal.charge]).toEqual([1, -1]);
    expect(na.metal.shellsAfter).toEqual([2, 8]); expect(na.metal.nobleGas).toBe('Ne');
    expect(na.nonmetal.shellsAfter).toEqual([2, 8, 8]); expect(na.nonmetal.nobleGas).toBe('Ar');
    expect([mg.metal.charge, mg.nonmetal.charge]).toEqual([2, -2]);
    expect([al.metal.charge, al.nonmetal.charge]).toEqual([3, -3]);
    expect(ionicCompound(3, 9).metal.shellsAfter).toEqual([2]); expect(ionicCompound(3, 9).metal.nobleGas).toBe('He');
    expect(ionicCompound(19, 35).nonmetal.shellsAfter).toEqual([2, 8, 18, 8]); expect(ionicCompound(19, 35).nonmetal.nobleGas).toBe('Kr');
  });

  it('rejects elements outside the simplified model', () => {
    expect(() => ionicCompound(26, 17)).toThrow(RangeError); // iron
    expect(() => ionicCompound(11, 18)).toThrow(RangeError); // argon
  });

  it('writes steps whose numbers match the result', () => {
    const steps = ionicSteps(ionicCompound(12, 17)); // MgCl2
    expect(steps).toHaveLength(4);
    expect(steps[1].text).toContain('loses 2 electrons');
    expect(steps[1].text).toContain('gains 1 electron ');
    expect(steps[1].text).toContain('1 × 2 = 2'); expect(steps[1].text).toContain('2 × 1 = 2');
    expect(steps[3].text).toContain('MgCl₂'); expect(steps[3].text).toContain('magnesium chloride');
    expect(steps[3].text).toContain('1 × (+2) + 2 × (−1) = 0');
    expect(steps[2].text).toContain('Mg²⁺'); expect(steps[2].text).toContain('Cl⁻');
    expect(ionicSteps(ionicCompound(11, 17))[1].text).toContain('loses 1 electron.');
  });
});

describe('covalent bonding', () => {
  it('every molecule is an electron-conserving structure with full outer shells', () => {
    for (const def of MOLECULES) {
      const a = analyseMolecule(def);
      expect(a.balanced, `${def.id} electrons accounted for`).toBe(true);
      expect(a.allFull, `${def.id} full outer shells (2 for H, 8 otherwise)`).toBe(true);
      expect(a.totalValence).toBe(2 * a.totalSharedPairs + 2 * a.totalLonePairs);
    }
  });

  it('the atoms drawn match the formula', () => {
    for (const def of MOLECULES) {
      const drawn: Record<string, number> = {};
      for (const at of def.atoms) drawn[at.symbol] = (drawn[at.symbol] ?? 0) + 1;
      expect(drawn, def.id).toEqual(formulaCounts(def.formula));
    }
  });

  it('has the textbook bonds', () => {
    const by = (id: string) => analyseMolecule(MOLECULES.find((m) => m.id === id)!);
    expect(by('o2').bondLabels[0]).toContain('double');
    expect(by('n2').bondLabels[0]).toContain('triple');
    expect(by('h2').bondLabels[0]).toContain('single');
    expect(by('co2').bondLabels.every((l) => l.includes('double'))).toBe(true);
    expect(by('h2o').atoms[0]).toMatchObject({ symbol: 'O', sharedPairs: 2, lonePairs: 2 });
    expect(by('nh3').atoms[0]).toMatchObject({ symbol: 'N', sharedPairs: 3, lonePairs: 1 });
    expect(by('ch4').atoms[0]).toMatchObject({ symbol: 'C', sharedPairs: 4, lonePairs: 0 });
    expect(by('n2').atoms[0]).toMatchObject({ sharedPairs: 3, lonePairs: 1 });
    expect(by('cl2').atoms[0]).toMatchObject({ sharedPairs: 1, lonePairs: 3 });
  });

  it('detects an invalid structure (water drawn with a missing lone pair)', () => {
    const bad = structuredClone(MOLECULES.find((m) => m.id === 'h2o')!);
    bad.atoms[0].lp = [240];
    const a = analyseMolecule(bad);
    expect(a.balanced).toBe(false); expect(a.allFull).toBe(false);
  });

  it('drawing data is sane: lone-pair directions are valid angles and all atoms fit the canvas', () => {
    for (const def of MOLECULES) for (const at of def.atoms) {
      for (const ang of at.lp) { expect(ang).toBeGreaterThanOrEqual(0); expect(ang).toBeLessThan(360); }
      expect(at.x).toBeGreaterThan(30); expect(at.x).toBeLessThan(330); expect(at.y).toBeGreaterThan(20); expect(at.y).toBeLessThan(180);
    }
  });

  it('formats formulas with subscripts', () => { expect(displayFormula('H2O')).toBe('H₂O'); expect(displayFormula('CO2')).toBe('CO₂'); expect(displayFormula('HCl')).toBe('HCl'); });
});
