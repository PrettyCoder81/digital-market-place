import React, { createContext, useContext, useMemo } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
} from '@mui/material';

import { lightTheme, darkTheme } from '../theme/theme';
import { useDarkMode } from '../hooks/useDarkMode';

interface ThemeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const value = useMemo(() => ({ darkMode, toggleDarkMode }), [darkMode, toggleDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return ctx;
}
