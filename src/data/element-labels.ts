import raw from './element-labels.json';

export interface ElementLabel {
  number: number;
  symbol: string;
  name: string;
}

/** Compact element names for screens that do not need the complete chemistry dataset. */
export const ELEMENT_LABELS = raw as ElementLabel[];

const byNumber = new Map(ELEMENT_LABELS.map((element) => [element.number, element]));

export function getElementLabel(number: number): ElementLabel | undefined {
  return byNumber.get(number);
}
