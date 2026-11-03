import { createContext } from 'react';
import type { Progress } from '../engine/progress';

export interface ProgressContextValue {
  progress: Progress;
  ready: boolean;
  /** Set when progress cannot be saved on this device; shown to the student. */
  storageWarning: string | null;
  update: (fn: (p: Progress) => Progress) => void;
}

export const ProgressCtx = createContext<ProgressContextValue | null>(null);
