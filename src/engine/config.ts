// Electron-configuration helpers. The configurations themselves come from the verified data set;
// the Madelung (filling-order) rule is used ONLY to detect and explain exceptions, never to generate data.

const SUP_MAP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const unsup = (s: string) => [...s].map((c) => SUP_MAP[c] ?? c).join('');

export type Occupancy = Record<string, number>;

const SUBSHELL_ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };

/** Expected occupancy if electrons filled strictly in Madelung order. */
export function madelungOccupancy(z: number): Occupancy {
  let left = z;
  const occ: Occupancy = {};
  for (const sub of SUBSHELL_ORDER) {
    if (left <= 0) break;
    const put = Math.min(CAP[sub[1]], left);
    occ[sub] = put;
    left -= put;
  }
  return occ;
}

const NOBLE_CORE: Record<string, number> = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

/** Parse a data-set configuration such as "[Ar] 3d⁵ 4s¹" or "1s² 2s² 2p⁶ …" into subshell occupancy. */
export function parseConfig(config: string): Occupancy {
  const occ: Occupancy = {};
  for (const token of config.trim().split(/\s+/)) {
    const core = token.match(/^\[(He|Ne|Ar|Kr|Xe|Rn)\]$/);
    if (core) {
      const coreOcc = madelungOccupancy(NOBLE_CORE[core[1]]);
      for (const [k, v] of Object.entries(coreOcc)) occ[k] = (occ[k] ?? 0) + v;
      continue;
    }
    const m = unsup(token).match(/^(\d)([spdf])(\d+)$/);
    if (!m) throw new Error(`Cannot parse electron configuration token "${token}"`);
    occ[m[1] + m[2]] = (occ[m[1] + m[2]] ?? 0) + Number(m[3]);
  }
  return occ;
}

export const totalElectrons = (occ: Occupancy) => Object.values(occ).reduce((a, b) => a + b, 0);

export interface ExceptionInfo {
  isException: boolean;
  /** Subshells whose occupancy differs from the simple filling order. */
  differences: { subshell: string; expected: number; actual: number }[];
}

export function filingException(z: number, config: string): ExceptionInfo {
  const expected = madelungOccupancy(z);
  const actual = parseConfig(config);
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  const differences = [...keys]
    .filter((k) => (expected[k] ?? 0) !== (actual[k] ?? 0))
    .map((subshell) => ({ subshell, expected: expected[subshell] ?? 0, actual: actual[subshell] ?? 0 }));
  return { isException: differences.length > 0, differences };
}

export const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
