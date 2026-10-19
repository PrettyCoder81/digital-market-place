/**
 * ProductList Component
 * Displays a grid of products from the marketplace
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import {
  Refresh,
  Storefront,
  Warning,
} from '@mui/icons-material';
import ProductCard from './ProductCard';
import { useWeb3 } from '../context/Web3Context';
import { getAllProducts, Product } from '../utils/contractInteractions';

interface ProductListProps {
  onShowStatus: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const ProductList: React.FC<ProductListProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo products for when not connected or no products found
  const demoProducts: Product[] = [
    {
      id: 1,
      name: 'Digital Art Collection #1',
      description: 'A unique piece of digital art from the TC Marketplace collection. Own a piece of blockchain history.',
      price: '25.00',
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      isListed: true,
    },
    {
      id: 2,
      name: 'Premium NFT Pass',
      description: 'Exclusive access pass for premium marketplace features and early product listings.',
      price: '50.00',
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
      isListed: true,
    },
    {
      id: 3,
      name: 'Crypto Music Album',
      description: 'Limited edition music album stored on IPFS. Includes 10 tracks with exclusive artwork.',
      price: '15.00',
      owner: '0x9876543210fedcba9876543210fedcba98765432',
      isListed: true,
    },
    {
      id: 4,
      name: 'Virtual Land Plot',
      description: 'A 100x100 plot in the metaverse. Build, create, and monetize your virtual property.',
      price: '100.00',
      owner: '0xfedcba9876543210fedcba9876543210fedcba98',
      isListed: true,
    },
    {
      id: 5,
      name: 'Smart Contract Template',
      description: 'Production-ready Solidity smart contract templates for DeFi protocols.',
      price: '30.00',
      owner: '0x1111222233334444555566667777888899990000',
      isListed: false,
    },
    {
      id: 6,
      name: 'AI Generated Artwork',
      description: 'Stunning AI-generated digital artwork. Each piece is unique and verified on-chain.',
      price: '20.00',
      owner: '0xaaaabbbbccccddddeeeeffffaaaabbbbccccdddd',
      isListed: true,
    },
  ];

  const fetchProducts = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork) {
      setProducts(demoProducts);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedProducts = await getAllProducts();
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      } else {
        setProducts(demoProducts);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts(demoProducts);
      setError('Using demo data - connect wallet to see live products');
    } finally {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const listedProducts = products.filter((p) => p.isListed);
  const soldProducts = products.filter((p) => !p.isListed);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton
                variant="rounded"
                height={380}
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
            label={`${soldProducts.length} Sold`}
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
          { icon: '🔒', title: 'Secure', desc: 'Smart contract escrow with 5% platform fee' },
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

      {/* Product Grid */}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
            <ProductCard
              product={product}
              onSuccess={fetchProducts}
              onShowStatus={onShowStatus}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {products.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Storefront sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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
