/**
 * ProductCard
 * Displays a single marketplace product and its owner/buyer actions.
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PauseCircleOutlined,
  Person,
  PlayCircleOutlined,
  ShoppingCart,
  SwapHoriz,
  Token,
} from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import {
  approveToken,
  buyProduct,
  checkAllowance,
  setListing,
  transferOwnership,
  Product,
} from '../../utils/contractInteractions';
import { runTransaction } from '../../lib/errors';
import { formatPrice, shortenAddress, formatDate, shortHash } from '../../lib/format';
import { resolveImageUrl, generatePlaceholderImage } from '../../lib/ipfs';
import type { ShowStatusFn } from '../../types/marketplace';
import BuyDialog from './BuyDialog';
import TransferOwnershipDialog from './TransferOwnershipDialog';

interface ProductCardProps {
  product: Product;
  onSuccess: () => void;
  onShowStatus: ShowStatusFn;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSuccess, onShowStatus }) => {
  const { account, isConnected } = useWeb3();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isOwner = account?.toLowerCase() === product.owner.toLowerCase();
  const isListed = product.listed;
  const imageUrl = resolveImageUrl(product.imageURI, product.id, product.name);
  const placeholder = () => generatePlaceholderImage(product.id, product.name);

  const confirmBuy = async () => {
    await runTransaction({
      action: async () => {
        // The contract does 2 safeTransferFrom calls (price - fee → seller, fee → marketplace),
        // so we need to approve the FULL price amount first.
        const currentAllowance = await checkAllowance(account!);
        if (parseFloat(currentAllowance) < parseFloat(product.price)) {
          setStatusMessage('Approving TonysCoin for purchase...');
          await approveToken(product.price, setStatusMessage);
        }

        setStatusMessage('Processing purchase...');
        const txHash = await buyProduct(product.id, product.price, setStatusMessage);

        onShowStatus(`Product purchased successfully! TX: ${shortHash(txHash)}`, 'success');
        setBuyDialogOpen(false);
        onSuccess();
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to purchase product',
      onStart: () => setLoading(true),
      onFinish: () => {
        setLoading(false);
        setStatusMessage('');
      },
    });
  };

  const handleBuy = () => {
    if (!isConnected) {
      onShowStatus('Please connect your wallet first', 'error');
      return;
    }
    setBuyDialogOpen(true);
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

    await runTransaction({
      action: async () => {
        setStatusMessage('Transferring ownership...');
        const txHash = await transferOwnership(product.id, newOwnerAddress, setStatusMessage);

        onShowStatus(`Ownership transferred! TX: ${shortHash(txHash)}`, 'success');
        setTransferDialogOpen(false);
        setNewOwnerAddress('');
        onSuccess();
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to transfer ownership',
      onStart: () => setLoading(true),
      onFinish: () => {
        setLoading(false);
        setStatusMessage('');
      },
    });
  };

  const handleToggleListing = async () => {
    await runTransaction({
      action: async () => {
        const newStatus = !isListed;
        setStatusMessage(newStatus ? 'Listing product...' : 'Delisting product...');
        const txHash = await setListing(product.id, newStatus, setStatusMessage);

        onShowStatus(`Product ${newStatus ? 'listed' : 'delisted'}! TX: ${shortHash(txHash)}`, 'success');
        onSuccess();
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to update listing',
      onStart: () => setLoading(true),
      onFinish: () => {
        setLoading(false);
        setStatusMessage('');
      },
    });
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
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          <Chip
            label={isListed ? 'Listed' : 'Unlisted'}
            color={isListed ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 600, backdropFilter: 'blur(8px)' }}
          />
        </Box>

        {/* Product Image */}
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={product.name}
          sx={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = placeholder();
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
              {formatPrice(product.price)} TC
            </Typography>
          </Box>

          {/* Owner */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={product.owner}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {shortenAddress(product.owner)}
              </Typography>
            </Tooltip>
          </Box>

          {/* Created Date */}
          {product.createdAt > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Created: {formatDate(product.createdAt)}
            </Typography>
          )}
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ px: 2, pb: 2, pt: 0, flexDirection: 'column', gap: 1 }}>
          {isOwner ? (
            <>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SwapHoriz />}
                onClick={() => setTransferDialogOpen(true)}
                sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
                disabled={loading}
              >
                Transfer
              </Button>
              <Button
                variant="text"
                fullWidth
                size="small"
                startIcon={isListed ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handleToggleListing}
                disabled={loading}
              >
                {isListed ? 'Delist' : 'Relist'}
              </Button>
            </>
          ) : isListed ? (
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={handleBuy}
              disabled={!isConnected || loading}
            >
              Buy Now
            </Button>
          ) : (
            <Chip label="Not Available" color="default" sx={{ width: '100%' }} />
          )}
        </CardActions>
      </Card>

      <BuyDialog
        open={buyDialogOpen}
        productName={product.name}
        price={product.price}
        loading={loading}
        statusMessage={statusMessage}
        onCancel={() => setBuyDialogOpen(false)}
        onConfirm={confirmBuy}
      />

      <TransferOwnershipDialog
        open={transferDialogOpen}
        productName={product.name}
        newOwnerAddress={newOwnerAddress}
        loading={loading}
        statusMessage={statusMessage}
        onAddressChange={setNewOwnerAddress}
        onCancel={() => setTransferDialogOpen(false)}
        onConfirm={handleTransfer}
      />
    </>
  );
};

export default ProductCard;
