import { getElement } from '../data';
import { withUnit, type Trend, type TrendSummary } from '../engine/trends';
import { trendValue } from '../engine/trends';

/** Explanation for the active trend. Every number is read from the dataset, never typed in. */
export function TrendInfo({ trend, summary }: { trend: Trend; summary: TrendSummary }) {
  const hi = summary.highest.map((e) => e.symbol).join(', ');
  const lo = summary.lowest.map((e) => e.symbol).join(', ');
  return (
    <section className="trend-info card" aria-labelledby="trend-title">
      <h2 id="trend-title">{trend.label}</h2>
      <p className="muted">{trend.definition}</p>
      <p><b>Highest:</b> {hi} ({withUnit(trend, summary.max)}). <b>Lowest:</b> {lo} ({withUnit(trend, summary.min)}).</p>
      <ul className="trend-rules">
        <li>{trend.across}</li>
        <li>{trend.down}</li>
      </ul>
      <h3>Why it happens</h3>
      {trend.why.map((w) => <p key={w}>{w}</p>)}
      {trend.exceptions.length > 0 && (
        <>
          <h3>Look out for these exceptions</h3>
          <ul>
            {trend.exceptions.map((x) => {
              const a = getElement(x.from)!, b = getElement(x.to)!;
              return (
                <li key={`${x.from}-${x.to}`}>
                  <b>{a.symbol} to {b.symbol}:</b> {withUnit(trend, trendValue(trend, a))} then {withUnit(trend, trendValue(trend, b))}.{' '}
                  {x.reason ?? 'A small reversal of the general pattern.'}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {trend.notes.map((n) => <p key={n} className="muted small">{n}</p>)}
      <p className="small muted">Draft explanation. It has not yet been reviewed by a chemistry teacher or checked against the current WASSCE syllabus.</p>
    </section>
  );
}
