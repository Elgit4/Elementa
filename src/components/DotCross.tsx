import type { IonicResult } from '../engine/bonding';
import { chargeLabel } from '../engine/atom';
import { ionSymbol } from '../engine/bonding';

/** Positions for up to eight outer electrons: pairs fill the top, right, bottom then left. */
const D = 31, S = 7;
const SLOTS = (cx: number, cy: number): [number, number][] => [
  [cx - S, cy - D], [cx + S, cy - D], [cx + D, cy - S], [cx + D, cy + S],
  [cx + S, cy + D], [cx - S, cy + D], [cx - D, cy + S], [cx - D, cy - S],
];

const superCharge = (c: number) => ionSymbol('', c);

export type Stage = 0 | 1 | 2 | 3;

interface AtomProps { cx: number; cy: number; symbol: string; label: string; own: number; ownKind: 'dot' | 'cross'; gained: number; leaving: number; ion: boolean; charge: number }

function Cross({ x, y }: { x: number; y: number }) {
  return <path className="dc-cross" d={`M${x - 3},${y - 3} L${x + 3},${y + 3} M${x + 3},${y - 3} L${x - 3},${y + 3}`} />;
}

function AtomCell({ cx, cy, symbol, label, own, ownKind, gained, leaving, ion, charge }: AtomProps) {
  const slots = SLOTS(cx, cy);
  const items: { x: number; y: number; kind: 'dot' | 'cross' | 'gained' | 'leaving' }[] = [];
  const keep = own - leaving;
  for (let i = 0; i < own; i++) items.push({ x: slots[i][0], y: slots[i][1], kind: i >= keep && leaving > 0 ? 'leaving' : ownKind });
  for (let g = 0; g < gained; g++) items.push({ x: slots[own + g][0], y: slots[own + g][1], kind: 'gained' });
  return (
    <g>
      <rect className="dc-box" x={cx - 19} y={cy - 19} width={38} height={38} rx={9} />
      <text className="dc-sym" x={cx} y={cy + 7} textAnchor="middle">{symbol}</text>
      {items.map((it, i) =>
        it.kind === 'cross' ? <Cross key={i} x={it.x} y={it.y} />
          : <circle key={i} className={it.kind === 'gained' ? 'dc-gained' : it.kind === 'leaving' ? 'dc-leaving' : 'dc-dot'} cx={it.x} cy={it.y} r={it.kind === 'gained' ? 4 : 3.2} />)}
      {ion && (
        <>
          <path className="dc-bracket" d={`M${cx - 40},${cy - 42} h-6 v84 h6 M${cx + 40},${cy - 42} h6 v84 h-6`} />
          <text className="dc-charge" x={cx + 50} y={cy - 36}>{superCharge(charge)}</text>
        </>
      )}
      <text className="dc-label" x={cx} y={cy + 62} textAnchor="middle">{label}</text>
    </g>
  );
}

/** Dot-and-cross diagram for one formula unit. Metal electrons are dots, non-metal electrons are crosses. */
export function DotCross({ r, stage }: { r: IonicResult; stage: Stage }) {
  const cols = Math.max(r.metalCount, r.nonmetalCount);
  const cell = 118;
  const width = cols * cell + 20;
  const x0 = (n: number) => (width - n * cell) / 2 + cell / 2;
  const ion = stage >= 2;
  const m = r.metal, n = r.nonmetal;
  const description = `Dot-and-cross diagram. ${r.metalCount} ${m.name.toLowerCase()} ${r.metalCount === 1 ? 'atom' : 'atoms'} and ${r.nonmetalCount} ${n.name.toLowerCase()} ${r.nonmetalCount === 1 ? 'atom' : 'atoms'}. ${stage === 0 ? 'Before electrons move.' : stage === 1 ? `${r.transferred} electrons move from the metal to the non-metal.` : `After transfer: ${r.metalCount} ${m.symbol}${chargeLabel(m.charge)} ${r.metalCount === 1 ? 'ion' : 'ions'} and ${r.nonmetalCount} ${n.symbol}${chargeLabel(n.charge)} ${r.nonmetalCount === 1 ? 'ion' : 'ions'}, each with a full outer shell.`}`;
  return (
    <figure className="dotcross">
      <svg viewBox={`0 0 ${width} 350`} role="img" aria-label={description} style={{ width: '100%', maxWidth: Math.max(width, 260) * 1.4 }}>
        <defs>
          <marker id="dc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="dc-arrowhead" /></marker>
        </defs>
        <text className="dc-rowname" x={10} y={18}>{m.name} (metal)</text>
        {Array.from({ length: r.metalCount }, (_, i) => (
          <AtomCell key={`m${i}`} cx={x0(r.metalCount) + i * cell} cy={78} symbol={m.symbol}
            label={ion ? `${m.symbol}${superCharge(m.charge)}` : m.name}
            own={ion ? 0 : m.outer} ownKind="dot" gained={0} leaving={stage === 1 ? m.moved : 0} ion={ion} charge={m.charge} />
        ))}
        {stage === 1 && (
          <g>
            <line className="dc-arrow" x1={width / 2} y1={154} x2={width / 2} y2={190} markerEnd="url(#dc-arrow)" />
            <text className="dc-note" x={width / 2 + 12} y={177}>{r.transferred} {r.transferred === 1 ? 'electron moves' : 'electrons move'}</text>
          </g>
        )}
        <text className="dc-rowname" x={10} y={212}>{n.name} (non-metal)</text>
        {Array.from({ length: r.nonmetalCount }, (_, i) => (
          <AtomCell key={`n${i}`} cx={x0(r.nonmetalCount) + i * cell} cy={286} symbol={n.symbol}
            label={ion ? `${n.symbol}${superCharge(n.charge)}` : n.name}
            own={n.outer} ownKind="cross" gained={stage >= 1 ? n.moved : 0} leaving={0} ion={ion} charge={n.charge} />
        ))}
      </svg>
      <figcaption className="small muted">
        <span className="dc-key"><svg width="14" height="14" aria-hidden="true"><circle className="dc-dot" cx="7" cy="7" r="3.2" /></svg> electron from the metal</span>
        <span className="dc-key"><svg width="14" height="14" aria-hidden="true"><path className="dc-cross" d="M4,4 L10,10 M10,4 L4,10" /></svg> electron from the non-metal</span>
        <span className="dc-key"><svg width="14" height="14" aria-hidden="true"><circle className="dc-gained" cx="7" cy="7" r="4" /></svg> electron received</span>
      </figcaption>
    </figure>
  );
}
