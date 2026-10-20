import { useCallback, useState } from 'react';
import type { NoticeSeverity } from '../types/marketplace';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: NoticeSeverity;
}

const initialState: SnackbarState = {
  open: false,
  message: '',
  severity: 'info',
};

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialState);

  /** Stable reference suitable for passing down as `onShowStatus`. */
  const showStatus = useCallback((message: string, severity: NoticeSeverity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showStatus, closeSnackbar };
}
