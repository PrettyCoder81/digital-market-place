import React from 'react';

import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import { SnackbarProvider } from './context/SnackbarContext';
import router from './router';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Web3Provider>
        <SnackbarProvider>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </Web3Provider>
    </ThemeProvider>
  );
};

export default App;
