import { Atom, CalendarCheck, Compass, FlaskConical, Flame, Link2, Medal, Sparkles, TrendingUp } from 'lucide-react';

const artwork = {
  'first-lesson': { Icon: FlaskConical, tone: 'mint', mark: '01' },
  perfect: { Icon: Sparkles, tone: 'gold', mark: '100' },
  bonding: { Icon: Link2, tone: 'blue', mark: 'NaCl' },
  trends: { Icon: TrendingUp, tone: 'violet', mark: '↗' },
  'all-rounder': { Icon: Atom, tone: 'teal', mark: '360' },
  'daily-3': { Icon: CalendarCheck, tone: 'coral', mark: '3×' },
  'streak-3': { Icon: Flame, tone: 'orange', mark: '3' },
  explorer: { Icon: Compass, tone: 'indigo', mark: '118' },
} as const;

export function AchievementArt({ id, earned }: { id: string; earned: boolean }) {
  const item = artwork[id as keyof typeof artwork] ?? { Icon: Medal, tone: 'mint', mark: '★' };
  const { Icon } = item;
  return (
    <span className={`achievement-art tone-${item.tone}`} data-earned={earned} aria-hidden="true">
      <span className="achievement-art-orbit" />
      <Icon className="achievement-art-icon" size={23} strokeWidth={1.8} />
      <span className="achievement-art-mark">{item.mark}</span>
    </span>
  );
}
