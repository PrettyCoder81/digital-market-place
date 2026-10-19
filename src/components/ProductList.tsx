import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  Button,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  Refresh,
  Warning,
  Search,
  FilterList,
} from '@mui/icons-material';
import ProductCard from './ProductCard';
import { useWeb3 } from '../context/Web3Context';
import { getAllProducts, Product } from '../utils/contractInteractions';

interface ProductListProps {
  onShowStatus: (message: string, severity: 'success' | 'error' | 'info') => void;
}

type StatusFilter = 'all' | 'listed' | 'unlisted';
type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name (A–Z)' },
];

const ProductList: React.FC<ProductListProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering / sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchProducts = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedProducts = await getAllProducts();
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Using demo data - connect wallet to see live products');
    } finally {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const listedProducts = products.filter((p) => p.listed);
  const unlistedProducts = products.filter((p) => !p.listed);

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

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton
                variant="rounded"
                height={400}
                sx={{ borderRadius: '16px' }}
                animation="wave"
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Banner */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 5 },
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          }}
        />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '2.5rem' },
          }}
        >
          Digital Marketplace
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2, maxWidth: 600 }}>
          Discover, buy, and sell unique digital products powered by TonysCoin on Ethereum Sepolia.
          Fully decentralized, transparent, and secure.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={`${listedProducts.length} Listed`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`${unlistedProducts.length} Unlisted`}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label="Sepolia Testnet"
            variant="outlined"
            color="secondary"
            size="small"
          />
          <Button
            startIcon={<Refresh />}
            onClick={fetchProducts}
            variant="outlined"
            size="small"
            sx={{ ml: 'auto' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: '🔒', title: 'Secure', desc: 'Smart contract escrow with platform fee' },
          { icon: '🌐', title: 'Decentralized', desc: 'IPFS storage, blockchain verified' },
          { icon: '💎', title: 'TonysCoin', desc: 'Exclusive TC payments, no ETH needed' },
        ].map((feature, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>{feature.icon}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                {feature.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {feature.desc}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

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
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 3,
          p: 2,
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
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
      </Box>

      {/* Product Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
            <ProductCard
              product={product}
              onSuccess={fetchProducts}
              onShowStatus={onShowStatus}
            />
          </Grid>
        ))}
      </Grid>

      {/* No Results State */}
      {products.length > 0 && filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>🔍</Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No products match your filters
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Try adjusting your search or clearing the active filters.
          </Typography>
          <Button variant="outlined" onClick={clearFilters}>
            Clear filters
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>🏪</Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No products listed yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Be the first to list a product on the marketplace!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProductList;
