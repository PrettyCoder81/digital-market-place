import React from 'react';
import ProductList from '../components/marketplace/ProductList';
import { useSnackbarContext } from '../context/SnackbarContext';

const MarketplacePage: React.FC = () => {
  const { showStatus } = useSnackbarContext();
  return <ProductList onShowStatus={showStatus} />;
};

export default MarketplacePage;
