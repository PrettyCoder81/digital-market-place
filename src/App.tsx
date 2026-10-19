import React, { useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
} from '@mui/material';

import { lightTheme, darkTheme } from './theme/theme';
import { Web3Provider } from './context/Web3Context';
import { useDarkMode } from './hooks/useDarkMode';
import AppContent from './pages/main';

const App: React.FC = () => {
  // Single source of truth for the persisted preference; AppContent's Navbar
  // toggle writes through the same localStorage key, and this memo re-reads
  // it whenever the tree re-renders after a toggle.
  const { darkMode } = useDarkMode();
  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

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
