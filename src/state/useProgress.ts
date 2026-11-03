import { useContext } from 'react';
import { ProgressCtx } from './ProgressContext';

export function useProgress() {
  const context = useContext(ProgressCtx);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}
