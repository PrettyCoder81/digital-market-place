import React from 'react';
import CreateProductForm from '../components/marketplace/CreateProductForm';
import { useSnackbarContext } from '../context/SnackbarContext';

const CreateProductPage: React.FC = () => {
  const { showStatus } = useSnackbarContext();
  return <CreateProductForm onShowStatus={showStatus} />;
};

export default CreateProductPage;
