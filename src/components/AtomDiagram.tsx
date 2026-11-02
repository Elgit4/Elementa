import { useMemo } from 'react';
import { SHELL_LETTERS } from '../engine/config';
import { isotopeName } from '../engine/atom';

interface Props {
  name: string;
  protons: number;
  neutrons: number;
  /** Electrons per shell. */
  shells: number[];
  charge: number;
  massNumber: number;
  size?: number;
}

const MAX_DRAWN = 36;

/** Deterministic phyllotaxis packing so the nucleus looks the same on every render. */
function nucleonPositions(count: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const r = radius * Math.sqrt((i + 0.5) / count);
    const a = i * golden;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
}

/** Simplified shell (Bohr) model. Not to scale. */
export function AtomDiagram({ name, protons, neutrons, shells, charge, massNumber, size = 360 }: Props) {
  const total = protons + neutrons;
  const drawn = Math.min(total, MAX_DRAWN);
  const scaled = total > MAX_DRAWN;
  const drawnProtons = scaled ? Math.max(1, Math.round((protons / total) * drawn)) : protons;
  const nuclearR = 14 + Math.min(drawn, MAX_DRAWN) * 0.55;
  const nucleons = useMemo(() => {
    const pos = nucleonPositions(drawn, nuclearR);
    // Interleave protons and neutrons so neither clusters on one side.
    const kinds: ('p' | 'n')[] = [];
    let p = 0, n = 0;
    const dn = drawn - drawnProtons;
    for (let i = 0; i < drawn; i++) {
      if (p < drawnProtons && (n >= dn || p / drawnProtons <= n / Math.max(dn, 1))) { kinds.push('p'); p++; } else { kinds.push('n'); n++; }
    }
    return pos.map((q, i) => ({ ...q, kind: kinds[i] }));
  }, [drawn, drawnProtons, nuclearR]);

  const cx = 200;
  const first = nuclearR + 26;
  const last = 188;
  const step = shells.length > 1 ? (last - first) / (shells.length - 1) : 0;
  const radii = shells.map((_, i) => (shells.length === 1 ? Math.max(first, 70) : first + step * i));
  const label = `Shell model of ${isotopeName(name, massNumber)}${charge ? ` with charge ${charge > 0 ? '+' : '−'}${Math.abs(charge)}` : ''}: ${protons} protons, ${neutrons} neutrons, ${shells.reduce((a, b) => a + b, 0)} electrons in shells ${shells.join(', ') || 'none'}.`;
  const pr = nuclearR > 40 ? 3.6 : 4.6;

  return (
    <figure className="atom">
      <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={label} className="atom-svg">
        <title>{label}</title>
        {radii.map((r, i) => (
          <g key={i}>
            <circle cx={cx} cy={cx} r={r} className={i === radii.length - 1 ? 'shell-ring outer' : 'shell-ring'} />
            <g className="orbit" style={{ ['--dur' as string]: `${28 + i * 14}s`, transformOrigin: '200px 200px', animationDirection: i % 2 ? 'reverse' : 'normal' }}>
              {Array.from({ length: shells[i] }, (_, k) => {
                const a = (k / shells[i]) * Math.PI * 2 - Math.PI / 2 + i * 0.35;
                return (
                  <g key={k}>
                    <circle cx={cx + r * Math.cos(a)} cy={cx + r * Math.sin(a)} r="7.5" className="electron" />
                    <text x={cx + r * Math.cos(a)} y={cx + r * Math.sin(a) + 3.6} className="electron-sign" textAnchor="middle">−</text>
                  </g>
                );
              })}
            </g>
          </g>
        ))}
        <g transform={`translate(${cx} ${cx})`}>
          {nucleons.map((q, i) => (
            <g key={i}>
              <circle cx={q.x} cy={q.y} r={pr + 1.4} className={q.kind === 'p' ? 'proton' : 'neutron'} />
              {q.kind === 'p' && pr >= 4 && <text x={q.x} y={q.y + 3.2} className="proton-sign" textAnchor="middle">+</text>}
            </g>
          ))}
        </g>
        {radii.map((r, i) => (
          <text key={`l${i}`} x={cx} y={cx - r - 8} className="shell-label" textAnchor="middle" aria-hidden="true">{SHELL_LETTERS[i]}</text>
        ))}
      </svg>
      <figcaption className="atom-legend">
        <span><i className="dot proton" aria-hidden="true">+</i> Proton</span>
        <span><i className="dot neutron" aria-hidden="true" /> Neutron</span>
        <span><i className="dot electron" aria-hidden="true">−</i> Electron</span>
        {scaled && <span className="muted">Nucleus not to scale: {protons} protons and {neutrons} neutrons, {MAX_DRAWN} drawn in proportion.</span>}
      </figcaption>
    </figure>
  );
}
