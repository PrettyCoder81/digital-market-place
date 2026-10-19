/**
 * ProductList
 * Marketplace browse screen: hero, feature strip, network alerts,
 * search/filter/sort toolbar, and the product grid.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem, TextField, Typography, InputAdornment } from '@mui/material';
import { FilterList, Refresh, Search, Warning } from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import { useProducts } from '../../hooks/useProducts';
import ProductGrid from './ProductGrid';
import FilterToolbar, { SORT_OPTIONS, StatusFilter, SortOption } from '../common/FilterToolbar';
import { MarketplaceHero, FeatureStrip } from '../layout/PageShell';
import type { ShowStatusFn } from '../../types/marketplace';

interface ProductListProps {
  onShowStatus: ShowStatusFn;
}

const ProductList: React.FC<ProductListProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const { products, loading, error, refetch, listedCount, unlistedCount } = useProducts();

  // Filtering / sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Apply search, status filter, and sorting
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = products.filter((p) => {
      if (statusFilter === 'listed' && !p.listed) return false;
      if (statusFilter === 'unlisted' && p.listed) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q)
      );
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'price-asc':
          return parseFloat(a.price || '0') - parseFloat(b.price || '0');
        case 'price-desc':
          return parseFloat(b.price || '0') - parseFloat(a.price || '0');
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <Box>
      <MarketplaceHero
        listedCount={listedCount}
        unlistedCount={unlistedCount}
        actions={
          <Button
            startIcon={<Refresh />}
            onClick={refetch}
            variant="outlined"
            size="small"
            sx={{ ml: 'auto' }}
          >
            Refresh
          </Button>
        }
      />

      <FeatureStrip />

      {/* Network Warning */}
      {isConnected && !isCorrectNetwork && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
          Please switch to the Sepolia Testnet to interact with the marketplace.
        </Alert>
      )}

      {/* Error/Info Alert */}
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Not Connected Message */}
      {!isConnected && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Connect your wallet to purchase products or list your own. Showing demo products below.
        </Alert>
      )}

      {/* Filter Toolbar */}
      <FilterToolbar>
        <TextField
          size="small"
          placeholder="Search products by name, description, or owner…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flexGrow: 1, minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All products</MenuItem>
          <MenuItem value="listed">Listed only</MenuItem>
          <MenuItem value="unlisted">Unlisted only</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FilterList fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 190 }}
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        {hasActiveFilters && (
          <Button size="small" color="error" variant="text" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Showing {filteredProducts.length} of {products.length}
        </Typography>
      </FilterToolbar>

      <ProductGrid
        products={filteredProducts}
        totalCount={products.length}
        loading={loading}
        onRefresh={refetch}
        onShowStatus={onShowStatus}
        onClearFilters={clearFilters}
      />
    </Box>
  );
};

export default ProductList;
