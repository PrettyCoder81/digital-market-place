import React from 'react';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProductList from '../components/marketplace/ProductList';
import { useWeb3 } from '../context/Web3Context';
import { useSnackbarContext } from '../context/SnackbarContext';

const AdminPage: React.FC = () => {
  const { isOwner } = useWeb3();
  const { showStatus } = useSnackbarContext();

  return isOwner ? (
    <AdminDashboard onShowStatus={showStatus} />
  ) : (
    <ProductList onShowStatus={showStatus} />
  );
};

export default AdminPage;
