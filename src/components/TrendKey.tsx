import type { ElementData } from '../data/types';
import { rampEnds, type Theme } from '../engine/trendColor';
import { numberRanges, withUnit, type Trend, type TrendSummary } from '../engine/trends';

const names = (els: ElementData[]) => els.map((e) => e.symbol).join(', ');

/** Gradient key for a trend overlay: low and high ends with their elements, plus the "no value" swatch. */
export function TrendKey({ trend, summary, theme }: { trend: Trend; summary: TrendSummary; theme: Theme }) {
  const { lo, hi } = rampEnds(theme);
  return (
    <div className="trend-key" role="group" aria-label={`Key for ${trend.label}`}>
      <div className="trend-key-bar-wrap">
        <div className="trend-key-labels">
          <span><b>{withUnit(trend, summary.min)}</b> lowest ({names(summary.lowest)})</span>
          <span><b>{withUnit(trend, summary.max)}</b> highest ({names(summary.highest)})</span>
        </div>
        <div className="trend-key-bar" style={{ background: `linear-gradient(90deg, ${lo}, ${hi})` }} aria-hidden="true" />
        <p className="trend-key-note">Colour shows rank from lowest to highest, so patterns are easy to see. The number on each tile is the real value.</p>
      </div>
      <div className="trend-key-missing">
        <span className="trend-key-hatch" aria-hidden="true" />
        <span>
          Hatched tiles have no value in this dataset ({summary.missing.length} elements: {numberRanges(summary.missing.map((e) => e.number))}).
        </span>
      </div>
    </div>
  );
}
