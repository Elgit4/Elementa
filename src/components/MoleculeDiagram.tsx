import type { MoleculeDef } from '../engine/bonding';

const R = 20;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Structure drawing: a line is one shared pair; a pair of dots is a lone pair. Shows bonding, not 3D shape. */
export function MoleculeDiagram({ def, description }: { def: MoleculeDef; description: string }) {
  return (
    <figure className="molecule">
      <svg viewBox="0 0 360 200" role="img" aria-label={description} style={{ width: '100%', maxWidth: 520 }}>
        {def.bonds.map((b, i) => {
          const A = def.atoms[b.a], B = def.atoms[b.b];
          const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
          const offsets = b.order === 1 ? [0] : b.order === 2 ? [-4, 4] : [-6, 0, 6];
          return offsets.map((o) => (
            <line key={`${i}-${o}`} className="mol-bond" x1={A.x + ux * R - uy * o} y1={A.y + uy * R + ux * o} x2={B.x - ux * R - uy * o} y2={B.y - uy * R + ux * o} />
          ));
        })}
        {def.atoms.map((a, i) => (
          <g key={i}>
            {a.lp.map((ang, k) => {
              const c = Math.cos(rad(ang)), s = Math.sin(rad(ang));
              const px = a.x + (R + 13) * c, py = a.y + (R + 13) * s;
              return (
                <g key={k}>
                  <circle className="mol-lp" cx={px - s * 5} cy={py + c * 5} r={2.8} />
                  <circle className="mol-lp" cx={px + s * 5} cy={py - c * 5} r={2.8} />
                </g>
              );
            })}
            <circle className="mol-atom" cx={a.x} cy={a.y} r={R} />
            <text className="mol-sym" x={a.x} y={a.y + 6} textAnchor="middle">{a.symbol}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
