import { Suspense, lazy, useEffect, useRef } from 'react';
import { BookOpen, BookOpenCheck, FlaskConical, Grid3x3, House, Moon, Sun } from 'lucide-react';
import { useRoute } from './router';
import { ProgressProvider, useProgress } from './state/ProgressContext';
import { Home } from './screens/Home';
const Explore = lazy(() => import('./screens/Explore').then((m) => ({ default: m.Explore })));
const AtomExplorer = lazy(() => import('./screens/AtomExplorer').then((m) => ({ default: m.AtomExplorer })));
const Learn = lazy(() => import('./screens/Learn').then((m) => ({ default: m.Learn })));
const Lab = lazy(() => import('./screens/Lab').then((m) => ({ default: m.Lab })));
const Practice = lazy(() => import('./screens/Practice').then((m) => ({ default: m.Practice })));
import { OfflineStatus } from './components/OfflineStatus';
import { PageLoader } from './components/Loading';

const NAV = [
  { id: '', label: 'Home', Icon: House },
  { id: 'learn', label: 'Learn', Icon: BookOpen },
  { id: 'explore', label: 'Explore', Icon: Grid3x3 },
  { id: 'practice', label: 'Practice', Icon: BookOpenCheck },
  { id: 'lab', label: 'Lab', Icon: FlaskConical },
] as const;

const TITLES: Record<string, string> = { '': 'Home', explore: 'Explore', atom: 'Atomic explorer', learn: 'Learn', practice: 'Practice', lab: 'Virtual lab' };

function Shell() {
  const route = useRoute();
  const { progress, update, storageWarning } = useProgress();
  const mainRef = useRef<HTMLElement>(null);
  const section = route.segments[0] ?? '';
  const activeSection = section === 'lab' && route.segments[1] === 'practise' ? 'practice' : section;
  const first = useRef(true);

  useEffect(() => {
    document.title = `${TITLES[section] ?? 'Not found'} · Elementa`;
    if (first.current) { first.current = false; return; }
    mainRef.current?.focus({ preventScroll: true });
  }, [section]);

  let screen;
  switch (section) {
    case '': screen = <Home />; break;
    case 'explore': screen = <Explore route={route} />; break;
    case 'atom': screen = <AtomExplorer route={route} />; break;
    case 'learn': screen = <Learn route={route} />; break;
    case 'lab': screen = <Lab route={route} />; break;
    case 'practice': screen = <Practice />; break;
    default: screen = (<><h1>Page not found</h1><p className="muted">That page does not exist.</p><p><a className="btn" href="#/">Go home</a></p></>);
  }
  const dark = progress.theme === 'dark';

  return (
    <div className="shell">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <aside className="rail">
        <a className="brand" href="#/" aria-label="Elementa home"><img src="/brand-mark.png" alt="" /></a>
        <nav className="nav" aria-label="Main">
          {NAV.map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} aria-current={activeSection === id ? 'page' : undefined}>
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="rail-foot">
          <button className="icon-btn" onClick={() => update((p) => ({ ...p, theme: dark ? 'light' : 'dark' }))} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            <span>{dark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <header className="mobile-appbar">
          <a className="app-brand" href="#/" aria-label="Elementa home">
            <img src="/brand-mark.png" alt="" />
          </a>
        </header>
        <OfflineStatus />
        {storageWarning && <div className="banner warn" role="alert">{storageWarning}</div>}
        <Suspense fallback={<PageLoader />}>{screen}</Suspense>
        <footer className="app-credit" aria-label="Application credit">
          Powered by <strong>ElTech</strong>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
