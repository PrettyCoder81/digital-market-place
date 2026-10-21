import React from 'react';
import { Box, Button, Grid, Skeleton, Typography } from '@mui/material';
import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import type { Product } from '../../utils/contractInteractions';
import type { ShowStatusFn } from '../../types/marketplace';

interface ProductGridProps {
  products: Product[];
  totalCount: number;
  loading: boolean;
  onRefresh: () => void;
  onShowStatus: ShowStatusFn;
  onClearFilters: () => void;
}

const SKELETON_KEYS = [1, 2, 3, 4, 5, 6];

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  totalCount,
  loading,
  onRefresh,
  onShowStatus,
  onClearFilters,
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {SKELETON_KEYS.map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: '16px' }} animation="wave" />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        emoji="🏪"
        title="No products listed yet"
        description="Be the first to list a product on the marketplace!"
      />
    );
  }

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
          🔍
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No products match your filters
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Try adjusting your search or clearing the active filters.
        </Typography>
        <Button variant="outlined" onClick={onClearFilters}>
          Clear filters
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
          <ProductCard product={product} onSuccess={onRefresh} onShowStatus={onShowStatus} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;
