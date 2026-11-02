import { memo } from 'react';
import { ELEMENTS, FAMILY_BY_ID } from '../data';
import type { ElementData, Family } from '../data/types';
import { cellFor } from '../engine/layout';
import { FamilyMark } from './FamilyMark';
import { trendColor, type Theme } from '../engine/trendColor';
import { formatTrendValue, trendFraction, trendValue, withUnit, type Trend, type TrendSummary } from '../engine/trends';

interface TileProps { el: ElementData; selected: boolean; dimmed: boolean; showName: boolean; trend: Trend | null; summary: TrendSummary | null; theme: Theme }

const Tile = memo(function Tile({ el, selected, dimmed, showName, trend, summary, theme }: TileProps) {
  const { col, row } = cellFor(el);
  const fam = FAMILY_BY_ID[el.family].label;
  const v = trend ? trendValue(trend, el) : null;
  const fraction = trend && summary ? trendFraction(v, summary) : null;
  const colours = fraction !== null ? trendColor(fraction, theme) : null;
  const trendText = trend ? `, ${trend.label.toLowerCase()}: ${v === null ? 'no value available' : withUnit(trend, v)}` : '';
  const label = `${el.name}, symbol ${el.symbol}, atomic number ${el.number}, ${fam}${el.familyPredicted ? ' (predicted classification)' : ''}${trendText}`;
  return (
    <a
      href={`#/explore/${el.number}`}
      className="tile"
      data-family={el.family}
      data-dim={dimmed || undefined}
      aria-current={selected ? 'true' : undefined}
      aria-label={label}
      data-novalue={trend && v === null ? true : undefined}
      title={trend ? `${el.name}: ${v === null ? 'no value' : withUnit(trend, v)}` : undefined}
      style={{ gridColumn: col, gridRow: row, ...(colours ? { ['--tb' as string]: colours.bg, ['--ti' as string]: colours.ink } : {}) }}
    >
      <span className="tile-num">{el.number}</span>
      <span className="tile-mark"><FamilyMark family={el.family} size={9} /></span>
      <span className="tile-sym sci">{el.symbol}</span>
      {showName && <span className="tile-name">{el.name}</span>}
      {trend && v !== null && <span className="tile-val">{formatTrendValue(trend, v)}</span>}
    </a>
  );
});

interface Props {
  selected: number | null;
  matches: Set<number>;
  familyFilter: Family | null;
  tileSize: number;
  trend?: Trend | null;
  summary?: TrendSummary | null;
  theme?: Theme;
}

export function PeriodicTable({ selected, matches, familyFilter, tileSize, trend = null, summary = null, theme = 'dark' }: Props) {
  const showName = tileSize >= 58;
  return (
    <div className="table-scroll" tabIndex={-1}>
      <div className="ptable" data-mode={trend ? 'trend' : undefined} style={{ ['--tile' as string]: `${tileSize}px` }} role="group" aria-label="Periodic table of the elements">
        {ELEMENTS.map((el) => (
          <Tile
            key={el.number}
            el={el}
            selected={selected === el.number}
            dimmed={!matches.has(el.number) || (familyFilter !== null && el.family !== familyFilter)}
            showName={showName}
            trend={trend}
            summary={summary}
            theme={theme}
          />
        ))}
        <div className="tile-gap" style={{ gridColumn: 3, gridRow: 6 }} aria-hidden="true"><span>57–71</span></div>
        <div className="tile-gap" style={{ gridColumn: 3, gridRow: 7 }} aria-hidden="true"><span>89–103</span></div>
      </div>
    </div>
  );
}
