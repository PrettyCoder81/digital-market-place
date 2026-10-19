/**
 * ProductCard Component
 * Displays a product with buy/transfer actions
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart,
  SwapHoriz,
  Person,
  Token,
  CheckCircle,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';
import {
  approveToken,
  buyProduct,
  transferOwnership,
  checkAllowance,
} from '../utils/contractInteractions';
import { Product } from '../utils/contractInteractions';

interface ProductCardProps {
  product: Product;
  onSuccess: () => void;
  onShowStatus: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

const ProductCard: React.FC<ProductCardProps> = ({ product, onSuccess, onShowStatus }) => {
  const { account, isConnected } = useWeb3();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isOwner = account?.toLowerCase() === product.owner.toLowerCase();
  const isListed = product.isListed;

  // Generate a placeholder image with product name
  const getImageUrl = () => {
    if (product.imageHash) {
      return `${IPFS_GATEWAY}${product.imageHash}`;
    }
    // Generate a deterministic gradient based on product id
    const colors = [
      ['#10b981', '#059669'],
      ['#6366f1', '#4f46e5'],
      ['#f59e0b', '#d97706'],
      ['#ef4444', '#dc2626'],
      ['#8b5cf6', '#7c3aed'],
      ['#06b6d4', '#0891b2'],
    ];
    const colorPair = colors[product.id % colors.length];
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair[0]}"/>
            <stop offset="100%" style="stop-color:${colorPair[1]}"/>
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#g)"/>
        <text x="200" y="150" text-anchor="middle" fill="white" font-size="20" font-family="Arial" dy=".3em">${product.name}</text>
      </svg>`
    )}`;
  };

  const handleBuy = async () => {
    if (!isConnected) {
      onShowStatus('Please connect your wallet first', 'error');
      return;
    }
    setBuyDialogOpen(true);
  };

  const confirmBuy = async () => {
    setLoading(true);
    try {
      // Step 1: Check allowance and approve if needed
      const currentAllowance = await checkAllowance(account!);
      if (parseFloat(currentAllowance) < parseFloat(product.price)) {
        setStatusMessage('Approving TonysCoin for purchase...');
        await approveToken(product.price, (status) => setStatusMessage(status));
      }

      // Step 2: Buy the product
      setStatusMessage('Processing purchase...');
      const txHash = await buyProduct(product.id, product.price, (status) => setStatusMessage(status));
      
      onShowStatus(`Product purchased successfully! TX: ${txHash.slice(0, 10)}...`, 'success');
      setBuyDialogOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Buy error:', error);
      const message = error.code === 4001 
        ? 'Transaction rejected by user' 
        : error.reason || error.message || 'Failed to purchase product';
      onShowStatus(message, 'error');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleTransfer = async () => {
    if (!newOwnerAddress) {
      onShowStatus('Please enter a valid address', 'error');
      return;
    }
    if (!newOwnerAddress.startsWith('0x') || newOwnerAddress.length !== 42) {
      onShowStatus('Invalid Ethereum address', 'error');
      return;
    }

    setLoading(true);
    try {
      setStatusMessage('Transferring ownership...');
      const txHash = await transferOwnership(
        product.id,
        newOwnerAddress,
        (status) => setStatusMessage(status)
      );
      
      onShowStatus(`Ownership transferred! TX: ${txHash.slice(0, 10)}...`, 'success');
      setTransferDialogOpen(false);
      setNewOwnerAddress('');
      onSuccess();
    } catch (error: any) {
      console.error('Transfer error:', error);
      const message = error.code === 4001 
        ? 'Transaction rejected by user' 
        : error.reason || error.message || 'Failed to transfer ownership';
      onShowStatus(message, 'error');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Status Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
          }}
        >
          {isListed ? (
            <Chip
              label="Listed"
              color="success"
              size="small"
              sx={{ fontWeight: 600, backdropFilter: 'blur(8px)' }}
            />
          ) : (
            <Chip
              label="Sold"
              color="default"
              size="small"
              sx={{ fontWeight: 600, backdropFilter: 'blur(8px)' }}
            />
          )}
        </Box>

        {/* Product Image */}
        <CardMedia
          component="img"
          height="200"
          image={getImageUrl()}
          alt={product.name}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        />

        {/* Product Info */}
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {product.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 2,
            }}
          >
            {product.description}
          </Typography>

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Token sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {parseFloat(product.price).toFixed(2)} TC
            </Typography>
          </Box>

          {/* Owner */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={product.owner}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {product.owner.slice(0, 6)}...{product.owner.slice(-4)}
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          {!isListed ? (
            <Chip label="Not Available" color="default" sx={{ width: '100%' }} />
          ) : isOwner ? (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SwapHoriz />}
              onClick={() => setTransferDialogOpen(true)}
              sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
            >
              Transfer
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={handleBuy}
              disabled={!isConnected}
            >
              Buy Now
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Buy Confirmation Dialog */}
      <Dialog open={buyDialogOpen} onClose={() => !loading && setBuyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart color="primary" />
            Purchase Product
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography color="text.secondary">{statusMessage || 'Processing...'}</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                You are about to purchase <strong>{product.name}</strong> for{' '}
                <strong>{parseFloat(product.price).toFixed(2)} TC</strong>
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                A 5% platform fee will be deducted from the purchase price.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You will need to approve TonysCoin spending before the purchase can be completed.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBuyDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmBuy}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
          >
            {loading ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => !loading && setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="secondary" />
            Transfer Ownership
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography color="text.secondary">{statusMessage || 'Processing...'}</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will transfer ownership of <strong>{product.name}</strong> to another address.
                No tokens will be exchanged.
              </Alert>
              <TextField
                fullWidth
                label="New Owner Address"
                placeholder="0x..."
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                sx={{ mt: 1 }}
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleTransfer}
            disabled={loading || !newOwnerAddress}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SwapHoriz />}
          >
            {loading ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCard;
