import { useEffect, useState, type CSSProperties } from 'react';

/** True once `ms` have passed. Loading UI that appears only after a short delay avoids a flash on fast loads. */
function useDelayed(ms = 200): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setOn(true), ms); return () => window.clearTimeout(t); }, [ms]);
  return on;
}

/** Small spinner for inline waits. Announces itself to screen readers. */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

/** A grey placeholder shape. Purely decorative: hidden from assistive technology. */
export function Skeleton({ w, h = 14, r, className = '' }: { w?: number | string; h?: number | string; r?: number | string; className?: string }) {
  const style: CSSProperties = { width: w, height: h, borderRadius: r };
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Placeholder shaped like the standard page: a header and a few cards. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="page-skeleton" aria-hidden="true">
      <Skeleton w="min(320px, 70%)" h={34} r={10} />
      <Skeleton w="min(520px, 90%)" h={16} />
      <div className="skeleton-grid">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="card skeleton-card">
            <Skeleton w="45%" h={18} />
            <Skeleton h={12} />
            <Skeleton w="80%" h={12} />
            <Skeleton w={110} h={40} r={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Suspense fallback for screens: thin progress bar on top, then a page-shaped skeleton. Shown after a short delay. */
export function PageLoader({ label = 'Loading page' }: { label?: string }) {
  const show = useDelayed(200);
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {show && (<><div className="topbar" aria-hidden="true" /><PageSkeleton /></>)}
    </div>
  );
}
