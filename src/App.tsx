/**
 * App Component
 * Main application entry point with routing and theme management
 */
import React, { useState, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import CreateProductForm from './components/CreateProductForm';
import AdminDashboard from './components/AdminDashboard';
import TransactionHistory from './components/TransactionHistory';

const AppContent: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentPage, setCurrentPage] = useState('marketplace');
  const { isOwner } = useWeb3();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  const showStatus = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'marketplace':
        return <ProductList onShowStatus={showStatus} />;
      case 'create':
        return <CreateProductForm onShowStatus={showStatus} />;
      case 'admin':
        // Only the contract owner (admin) can access the Admin page
        return isOwner ? <AdminDashboard onShowStatus={showStatus} /> : <ProductList onShowStatus={showStatus} />;
      case 'transactions':
        return <TransactionHistory />;
      default:
        return <ProductList onShowStatus={showStatus} />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: 4,
          px: { xs: 2, sm: 3 },
        }}
      >
        {renderPage()}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          TonysCoin Digital Marketplace • Ethereum Sepolia Testnet
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Powered by Web3 • IPFS Storage • Decentralized
        </Typography>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', maxWidth: 400 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

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
