import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import RootLayout from './pages/main';
import MarketplacePage from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage';
import AdminPage from './pages/AdminPage';
import TransactionsPage from './pages/TransactionsPage';

/**
 * Page-per-route configuration using the data router API.
 * Every route renders inside <RootLayout /> (navbar/footer/snackbar) via <Outlet />.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <MarketplacePage /> },
      { path: 'marketplace', element: <Navigate to="/" replace /> },
      { path: 'create', element: <CreateProductPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      // Unknown routes fall back to the marketplace
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
