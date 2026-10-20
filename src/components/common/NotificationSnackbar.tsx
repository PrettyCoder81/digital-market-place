import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { SnackbarState } from '../../hooks/useSnackbar';

interface NotificationSnackbarProps {
  state: SnackbarState;
  onClose: () => void;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({ state, onClose }) => (
  <Snackbar
    open={state.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert onClose={onClose} severity={state.severity} variant="filled" sx={{ width: '100%', maxWidth: 400 }}>
      {state.message}
    </Alert>
  </Snackbar>
);

export default NotificationSnackbar;
