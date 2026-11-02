/** Colour ramp for trend overlays. Pure functions so contrast can be unit-tested. */
export type Theme = 'dark' | 'light';

const RAMP: Record<Theme, { lo: string; hi: string }> = {
  // Higher value = more saturated cyan in both themes; luminance is monotonic along each ramp.
  dark: { lo: '#1b2a45', hi: '#22d3ee' },
  light: { lo: '#e8f1f5', hi: '#0e7490' },
};

const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** WCAG relative luminance of an sRGB hex colour. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const INK_LIGHT = '#ffffff';
export const INK_DARK = '#000000';

/** Background and the readable ink for a value fraction in [0, 1]. */
export function trendColor(fraction: number, theme: Theme): { bg: string; ink: string } {
  const f = Math.min(1, Math.max(0, fraction));
  const { lo, hi } = RAMP[theme];
  const a = toRgb(lo), b = toRgb(hi);
  const bg = toHex(a.map((v, i) => v + (b[i] - v) * f));
  const ink = contrast(bg, INK_LIGHT) >= contrast(bg, INK_DARK) ? INK_LIGHT : INK_DARK;
  return { bg, ink };
}

export const rampEnds = (theme: Theme) => RAMP[theme];
