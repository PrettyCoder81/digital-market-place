import React from 'react';

import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import AppContent from './pages/main';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Web3Provider>
        <AppContent />
      </Web3Provider>
    </ThemeProvider>
  );
};

export default App;
