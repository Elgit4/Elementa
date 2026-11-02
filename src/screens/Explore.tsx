import { PageHeader, Breadcrumbs } from '../components/PageHeader';
import { useEffect, useMemo, useState } from 'react';
import { Grid3x3, List, Minus, Plus, Search } from 'lucide-react';
import { ELEMENTS, FAMILIES, getElement } from '../data';
import type { Family } from '../data/types';
import { searchElements } from '../engine/search';
import { viewElement } from '../engine/progress';
import { FamilyMark } from '../components/FamilyMark';
import { PeriodicTable } from '../components/PeriodicTable';
import { TrendKey } from '../components/TrendKey';
import { TrendInfo } from '../components/TrendInfo';
import { TRENDS, TREND_BY_ID, summarise, type TrendId } from '../engine/trends';
import { ElementList } from '../components/ElementList';
import { ElementDetail } from '../components/ElementDetail';
import { go, useMedia, type Route } from '../router';
import { useProgress } from '../state/ProgressContext';

export function Explore({ route }: { route: Route }) {
  const wide = useMedia('(min-width: 1260px)');
  const { progress, update } = useProgress();
  const sel = route.segments[1] ? Number(route.segments[1]) : null;
  const element = sel && Number.isInteger(sel) ? getElement(sel) : undefined;
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<Family | null>(null);
  const [view, setView] = useState<'table' | 'list'>('table');
  const [mode, setMode] = useState<'family' | TrendId>('family');
  const trend = mode === 'family' ? null : TREND_BY_ID[mode];
  const summary = useMemo(() => (trend ? summarise(trend, ELEMENTS) : null), [trend]);
  const chooseMode = (m: 'family' | TrendId) => setMode(m);
  const [tile, setTile] = useState(() => (window.matchMedia('(max-width: 760px)').matches ? 46 : 34));

  useEffect(() => { if (element) update((p) => viewElement(p, element.number)); }, [element, update]);
  useEffect(() => { if (element && !wide) window.scrollTo({ top: 0 }); }, [element, wide]);

  const results = useMemo(() => searchElements(ELEMENTS, query), [query]);
  const matches = useMemo(() => new Set(results.map((e) => e.number)), [results]);
  const visibleList = useMemo(() => (family ? results.filter((e) => e.family === family) : results), [results, family]);

  if (sel !== null && !element) {
    return (
      <>
        <h1>Element not found</h1>
        <p className="muted">There is no element with atomic number “{route.segments[1]}”. Elements run from 1 to 118.</p>
        <p><a className="btn" href="#/explore">Back to the periodic table</a></p>
      </>
    );
  }

  // Narrow screens: the detail is its own page.
  if (element && !wide) {
    const prev = element.number > 1 ? element.number - 1 : null;
    const next = element.number < 118 ? element.number + 1 : null;
    return (
      <>
        <Breadcrumbs items={[{ label: 'Periodic table', href: '#/explore' }, { label: element.name }]} />
        <nav className="detail-nav" aria-label="Element navigation">
          <a className="btn" href="#/explore">Periodic table</a>
          <span className="spacer" />
          {prev && <a className="btn" href={`#/explore/${prev}`} aria-label={`Previous element: ${getElement(prev)!.name}`}>‹ {getElement(prev)!.symbol}</a>}
          {next && <a className="btn" href={`#/explore/${next}`} aria-label={`Next element: ${getElement(next)!.name}`}>{getElement(next)!.symbol} ›</a>}
        </nav>
        <ElementDetail el={element} compact />
      </>
    );
  }

  return (
    <>
      <PageHeader Icon={Grid3x3} eyebrow="Explore" title="Periodic table" subtitle="All 118 elements. Select one to see its properties, atomic structure and electron configuration, or colour the table to see a periodic trend." />

      <div className="toolbar">
        <div className="field search">
          <label htmlFor="el-search">Search elements</label>
          <div className="input-wrap">
            <Search size={18} aria-hidden="true" />
            <input
              id="el-search"
              className="input"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Name, symbol or atomic number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results.length > 0 && query.trim()) go(`explore/${results[0].number}`); }}
            />
          </div>
        </div>
        <div className="view-controls">
          <div className="seg" role="group" aria-label="View">
            <button className="chip" aria-pressed={view === 'table'} onClick={() => setView('table')}><Grid3x3 size={16} aria-hidden="true" /> Table</button>
            <button className="chip" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} aria-hidden="true" /> List</button>
          </div>
          {view === 'table' && (
            <div className="seg" role="group" aria-label="Tile size">
              <button className="chip" onClick={() => setTile((t) => Math.max(34, t - 6))} aria-label="Make tiles smaller" disabled={tile <= 34}><Minus size={16} aria-hidden="true" /></button>
              <button className="chip" onClick={() => setTile((t) => Math.min(76, t + 6))} aria-label="Make tiles larger" disabled={tile >= 76}><Plus size={16} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </div>

      {view === 'table' && (
        <div className="field colour-by">
          <span className="label" id="colour-by-label">Colour tiles by</span>
          <div className="chips" role="group" aria-labelledby="colour-by-label">
            <button className="chip" aria-pressed={mode === 'family'} onClick={() => chooseMode('family')}>Element family</button>
            {TRENDS.map((t) => (
              <button key={t.id} className="chip" aria-pressed={mode === t.id} onClick={() => chooseMode(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {query.trim() ? `${results.length} element${results.length === 1 ? '' : 's'} match “${query}”. ` : ''}
        {view === 'table' && trend ? `Tiles are coloured by ${trend.label.toLowerCase()}.` : ''}
      </p>

      {view === 'table' && trend && summary ? (
        <TrendKey trend={trend} summary={summary} theme={progress.theme} />
      ) : (
      <div className="legend" role="group" aria-label="Filter by element family">
        {FAMILIES.filter((f) => f.id !== 'unknown').map((f) => (
          <button key={f.id} className="chip legend-chip" aria-pressed={family === f.id} onClick={() => setFamily(family === f.id ? null : f.id)}>
            <FamilyMark family={f.id} size={12} /> {f.label}
          </button>
        ))}
      </div>
      )}

      <div className={wide && element ? 'explore-grid' : undefined}>
        <div className="explore-main">
          {view === 'table' ? (
            <>
              {query.trim() && results.length === 0 && <p className="empty">No element matches “{query}”. Try a name (iron), a symbol (Fe) or an atomic number (26).</p>}
              <PeriodicTable selected={element?.number ?? null} matches={matches} familyFilter={trend ? null : family} tileSize={tile} trend={trend} summary={summary} theme={progress.theme} />
              {trend && summary && <TrendInfo trend={trend} summary={summary} />}
            </>
          ) : (
            <ElementList elements={visibleList} selected={element?.number ?? null} />
          )}
          {view === 'table' && wide && !element && <p className="muted small hint">Select any element to see its details beside the table.</p>}
          {view === 'table' && !wide && <p className="muted small hint">Tip: use the plus button to enlarge tiles, then scroll sideways. The list view is easier to read on small screens.</p>}
        </div>
        {wide && element && (
          <aside className="explore-panel" aria-label="Element details">
            <nav className="detail-nav" aria-label="Element navigation">
              {element.number > 1 && <a className="btn" href={`#/explore/${element.number - 1}`} aria-label={`Previous element: ${getElement(element.number - 1)!.name}`}>‹</a>}
              {element.number < 118 && <a className="btn" href={`#/explore/${element.number + 1}`} aria-label={`Next element: ${getElement(element.number + 1)!.name}`}>›</a>}
              <span className="spacer" />
              <a className="btn" href="#/explore" aria-label="Close details">Close</a>
            </nav>
            <ElementDetail el={element} compact />
          </aside>
        )}
      </div>
    </>
  );
}
