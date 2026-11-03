import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptyProgress, type Progress } from '../engine/progress';
import { IdbProgressStore, MemoryProgressStore, type ProgressStore } from '../storage/store';

interface Ctx {
  progress: Progress;
  ready: boolean;
  /** Set when progress cannot be saved on this device; shown to the student. */
  storageWarning: string | null;
  update: (fn: (p: Progress) => Progress) => void;
}

const ProgressCtx = createContext<Ctx | null>(null);

export const STORAGE_WARNING =
  'Your progress cannot be saved on this device right now because browser storage is unavailable. It will be lost when you close this page.';

export function ProgressProvider({ children, store: injected }: { children: ReactNode; store?: ProgressStore }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const storeRef = useRef<ProgressStore | null>(null);
  const latest = useRef(progress);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pendingUpdates = useRef<Array<(p: Progress) => Progress>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let store: ProgressStore = injected ?? new IdbProgressStore();
      let loaded: Progress;
      try {
        loaded = await store.load();
      } catch {
        store = new MemoryProgressStore();
        loaded = await store.load();
        setWarning(STORAGE_WARNING);
      }
      if (cancelled) return;
      storeRef.current = store;
      // Rebase interactions made while IndexedDB was opening onto the stored state.
      // This prevents early route effects (for example, viewing an element) being lost
      // when the initial load resolves.
      const pending = pendingUpdates.current.splice(0);
      const hydrated = pending.reduce((current, apply) => apply(current), loaded);
      latest.current = hydrated;
      setProgress(hydrated);
      setReady(true);
      if (hydrated !== loaded) {
        queue.current = queue.current.then(() => store.save(hydrated)).catch(() => setWarning(STORAGE_WARNING));
      }
    })();
    return () => { cancelled = true; };
  }, [injected]);

  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme;
    try { localStorage.setItem('elementa-theme', progress.theme); } catch { /* storage may be blocked */ }
  }, [progress.theme]);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    const store = storeRef.current;
    if (!store) {
      pendingUpdates.current.push(fn);
      const optimistic = fn(latest.current);
      if (optimistic !== latest.current) {
        latest.current = optimistic;
        setProgress(optimistic);
      }
      return;
    }
    const next = fn(latest.current);
    if (next === latest.current) return;
    latest.current = next;
    setProgress(next);
    queue.current = queue.current.then(() => store.save(next)).catch(() => setWarning(STORAGE_WARNING));
  }, []);

  const value = useMemo(() => ({ progress, ready, storageWarning: warning, update }), [progress, ready, warning, update]);
  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error('useProgress must be used inside ProgressProvider');
  return c;
}
