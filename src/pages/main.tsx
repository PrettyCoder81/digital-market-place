import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Navbar from '../components/layout/Navbar';
import { Footer } from '../components/layout/PageShell';
import NotificationSnackbar from '../components/common/NotificationSnackbar';
import { useWeb3 } from '../context/Web3Context';
import { useThemeMode } from '../context/ThemeContext';
import { useSnackbarContext } from '../context/SnackbarContext';
import type { PageId } from '../types/marketplace';

const pathToPage = (pathname: string): PageId => {
  if (pathname.startsWith('/create')) return 'create';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/transactions')) return 'transactions';
  return 'marketplace';
};

export const pageToPath = (page: PageId): string =>
  page === 'marketplace' ? '/' : `/${page}`;

const RootLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOwner } = useWeb3();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const { snackbar, closeSnackbar } = useSnackbarContext();

  const currentPage: PageId = isOwner ? pathToPage(location.pathname) : 'marketplace';

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
        onNavigate={(page) => navigate(pageToPath(page))}
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
        <Outlet />
      </Container>

      <Footer />

      <NotificationSnackbar state={snackbar} onClose={closeSnackbar} />
    </Box>
  );
};

export default RootLayout;
