import React, { createContext, useContext } from 'react';
import { useSnackbar } from '../hooks/useSnackbar';

type SnackbarContextValue = ReturnType<typeof useSnackbar>;

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/**
 * Provides a single snackbar state for the whole app so every route/page can
 * call `showStatus(...)` without prop drilling.
 */
export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useSnackbar();
  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
};

export function useSnackbarContext(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbarContext must be used within a SnackbarProvider');
  }
  return ctx;
}
