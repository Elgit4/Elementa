import type { ElementData } from '../data/types';

export const toCelsius = (k: number) => Math.round((k - 273.15) * 10) / 10;

export function formatTemp(k: number | null): string {
  return k === null ? 'Not available' : `${k} K (${toCelsius(k)} °C)`;
}

export function formatDensity(d: ElementData['density']): string {
  if (!d) return 'Not available';
  const g = d.value / 1000;
  const gText = g >= 0.01 ? `${Number(g.toPrecision(3))} g/cm³` : null;
  return `${d.value} ${d.unit} at ${d.ref}${gText ? ` (${gText})` : ''}`;
}

/** Heuristic: the heaviest synthetic elements have few or no measured bulk properties. */
export const PHYSICAL_PROPERTIES_UNCERTAIN_FROM = 104;
export const physicalPropertiesUncertain = (el: Pick<ElementData, 'number'>) => el.number >= PHYSICAL_PROPERTIES_UNCERTAIN_FROM;

export function formatNumber(n: number | null, unit = ''): string {
  return n === null ? 'Not available' : `${n}${unit ? ' ' + unit : ''}`;
}

/** Valence-electron count in the simplified model (electrons in the outermost shell). */
export const outerShellElectrons = (el: Pick<ElementData, 'shells'>) => el.shells[el.shells.length - 1];

export function relatedElements(all: ElementData[], el: ElementData): ElementData[] {
  if (el.family === 'lanthanide' || el.family === 'actinide') {
    return all.filter((e) => e.family === el.family && Math.abs(e.number - el.number) === 1);
  }
  return all
    .filter((e) => e.number !== el.number && e.group === el.group && e.family !== 'lanthanide' && e.family !== 'actinide')
    .sort((a, b) => Math.abs(a.number - el.number) - Math.abs(b.number - el.number))
    .slice(0, 4)
    .sort((a, b) => a.number - b.number);
}

/** Name of the noble gas whose neutral electron arrangement equals the given shells, if any. */
export function isoelectronicNobleGas(all: ElementData[], shells: number[]): ElementData | undefined {
  return all.find((e) => e.family === 'noble-gas' && e.shells.length === shells.length && e.shells.every((v, i) => v === shells[i]));
}
