/**
 * Navbar Component
 * Wallet connection, navigation, and theme toggle
 */
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountBalanceWallet,
  Store,
  Dashboard,
  Add,
  Menu as MenuIcon,
  Logout,
  CurrencyExchange,
  History,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, darkMode, onToggleDarkMode }) => {
  const { account, isConnected, tcBalance, connectWallet, disconnectWallet, isCorrectNetwork } = useWeb3();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { label: 'Marketplace', icon: <Store />, page: 'marketplace' },
    { label: 'Create Product', icon: <Add />, page: 'create' },
    { label: 'Admin', icon: <Dashboard />, page: 'admin' },
    { label: 'Transactions', icon: <History />, page: 'transactions' },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: darkMode
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <Toolbar sx={{ maxWidth: 1400, width: '100%', mx: 'auto' }}>
          {/* Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 2 }}
            onClick={() => onNavigate('marketplace')}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <CurrencyExchange sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            {!isMobile && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TC Marketplace
              </Typography>
            )}
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, ml: 2, flex: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  startIcon={item.icon}
                  sx={{
                    color: currentPage === item.page ? 'primary.main' : 'text.secondary',
                    bgcolor: currentPage === item.page ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)') : 'transparent',
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flex: isMobile ? 1 : 0 }} />

          {/* Theme Toggle */}
          <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={onToggleDarkMode} sx={{ mr: 1 }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Wallet Connection */}
          {isConnected ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCorrectNetwork ? (
                <Chip
                  label={`${tcBalance} TC`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
                />
              ) : (
                <Chip
                  label="Wrong Network"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Tooltip title={account || ''}>
                <Chip
                  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{shortenAddress(account || '').charAt(0)}</Avatar>}
                  label={shortenAddress(account || '')}
                  variant="outlined"
                  onClick={disconnectWallet}
                  onDelete={disconnectWallet}
                  deleteIcon={<Logout sx={{ fontSize: 16 }} />}
                  sx={{ cursor: 'pointer', fontWeight: 500 }}
                />
              </Tooltip>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<AccountBalanceWallet />}
              onClick={connectWallet}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {isMobile ? 'Connect' : 'Connect Wallet'}
            </Button>
          )}

          {/* Mobile Menu */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: darkMode ? '#1e293b' : '#ffffff',
            },
          },
        }}
      >
        <Box sx={{ pt: 2 }}>
          <Typography variant="h6" sx={{ px: 3, mb: 2, fontWeight: 700 }}>
            Navigation
          </Typography>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.page} disablePadding>
                <ListItemButton
                  selected={currentPage === item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
