import type { Family } from '../data/types';

/** Distinct shape per family, so family is never conveyed by colour alone. */
const SHAPES: Record<Family, string> = {
  'alkali-metal': 'circle',
  'alkaline-earth': 'square',
  'transition-metal': 'M5 0.6 L9.6 9 L0.4 9 Z',
  'post-transition': 'M5 0.2 L9.8 5 L5 9.8 L0.2 5 Z',
  metalloid: 'M5 0.3 L9.2 2.7 L9.2 7.3 L5 9.7 L0.8 7.3 L0.8 2.7 Z',
  nonmetal: 'plus',
  'noble-gas': 'ring',
  lanthanide: 'bar',
  actinide: 'M5 0.4 L6.3 3.7 L9.8 3.9 L7.1 6.1 L8 9.5 L5 7.6 L2 9.5 L2.9 6.1 L0.2 3.9 L3.7 3.7 Z',
  unknown: 'ring',
};

export function FamilyMark({ family, size = 10 }: { family: Family; size?: number }) {
  const s = SHAPES[family];
  const fill = `var(--f-${family})`;
  let node;
  if (s === 'circle') node = <circle cx="5" cy="5" r="4.4" fill={fill} />;
  else if (s === 'square') node = <rect x="0.8" y="0.8" width="8.4" height="8.4" fill={fill} />;
  else if (s === 'plus') node = <path d="M3.7 0.4h2.6v3.3h3.3v2.6H6.3v3.3H3.7V6.3H0.4V3.7h3.3z" fill={fill} />;
  else if (s === 'ring') node = <circle cx="5" cy="5" r="3.7" fill="none" stroke={fill} strokeWidth="2" />;
  else if (s === 'bar') node = <rect x="0.4" y="3.2" width="9.2" height="3.6" rx="0.8" fill={fill} />;
  else node = <path d={s} fill={fill} />;
  return (
    <svg className="family-mark" width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      {node}
    </svg>
  );
}
