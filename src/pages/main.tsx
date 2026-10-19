/**
 * AppContent (pages/main)
 * Root screen: owns navigation + theme state, composes the layout shell
 * (Navbar / page area / Footer / Snackbar) and renders the active page.
 */
import React, { useState } from 'react';
import { Box, Container } from '@mui/material';

import Navbar from '../components/layout/Navbar';
import { Footer } from '../components/layout/PageShell';
import NotificationSnackbar from '../components/common/NotificationSnackbar';
import ProductList from '../components/marketplace/ProductList';
import CreateProductForm from '../components/marketplace/CreateProductForm';
import AdminDashboard from '../components/admin/AdminDashboard';
import TransactionHistory from '../components/transactions/TransactionHistory';
import { useWeb3 } from '../context/Web3Context';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSnackbar } from '../hooks/useSnackbar';
import type { PageId } from '../types/marketplace';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('marketplace');
  const { isOwner } = useWeb3();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { snackbar, showStatus, closeSnackbar } = useSnackbar();

  const renderPage = () => {
    switch (currentPage) {
      case 'create':
        return <CreateProductForm onShowStatus={showStatus} />;
      case 'admin':
        // Only the contract owner (admin) can access the Admin page
        return isOwner ? (
          <AdminDashboard onShowStatus={showStatus} />
        ) : (
          <ProductList onShowStatus={showStatus} />
        );
      case 'transactions':
        return <TransactionHistory />;
      case 'marketplace':
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

      <Footer />

      <NotificationSnackbar state={snackbar} onClose={closeSnackbar} />
    </Box>
  );
};

export default AppContent;
