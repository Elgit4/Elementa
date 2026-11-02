import { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, CircleCheck } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/** Connectivity, offline-ready, update prompt and install button. Never interrupts a lesson or quiz. */
export function OfflineStatus() {
  const online = useOnline();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [readyDismissed, setReadyDismissed] = useState(false);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const done = () => setInstall(null);
    window.addEventListener('beforeinstallprompt', on); window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);

  // Ask the browser not to evict saved progress when storage is tight (best effort; may be refused).
  useEffect(() => { navigator.storage?.persist?.().catch(() => undefined); }, []);

  return (
    <div className="status-stack">
      {!online && (
        <div className="banner" role="status">
          <WifiOff size={18} aria-hidden="true" />
          <span>You are offline. Lessons, quizzes, elements and your progress still work. Features that need internet will say so.</span>
        </div>
      )}
      {needRefresh && (
        <div className="banner" role="status">
          <RefreshCw size={18} aria-hidden="true" />
          <span>A new version of Elementa is ready. Reload when you are not in the middle of a quiz.</span>
          <span className="row">
            <button className="btn primary" onClick={() => updateServiceWorker(true)}>Reload now</button>
            <button className="btn" onClick={() => setNeedRefresh(false)}>Later</button>
          </span>
        </div>
      )}
      {offlineReady && !readyDismissed && (
        <div className="banner" role="status">
          <CircleCheck size={18} aria-hidden="true" />
          <span>Elementa is saved on this device and works without internet.</span>
          <button className="btn" onClick={() => setReadyDismissed(true)}>OK</button>
        </div>
      )}
      {install && (
        <div className="banner">
          <Download size={18} aria-hidden="true" />
          <span>Install Elementa on this device to open it like an app.</span>
          <button className="btn primary" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}>Install</button>
        </div>
      )}
    </div>
  );
}
