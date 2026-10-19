import React, { useState, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
} from '@mui/material';

import { lightTheme, darkTheme } from './theme/theme';
import { Web3Provider } from './context/Web3Context';
import AppContent from './pages/main';

const App: React.FC = () => {
  const theme = useMemo(
    () => (JSON.parse(localStorage.getItem('darkMode') ?? 'true') ? darkTheme : lightTheme),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <AppContent />
      </Web3Provider>
    </ThemeProvider>
  );
};

export default App;
