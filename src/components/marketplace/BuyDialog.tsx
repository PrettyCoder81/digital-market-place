import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { CheckCircle, ShoppingCart } from '@mui/icons-material';
import { formatPrice } from '../../lib/format';

interface BuyDialogProps {
  open: boolean;
  productName: string;
  price: string;
  loading: boolean;
  statusMessage: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const BuyDialog: React.FC<BuyDialogProps> = ({
  open,
  productName,
  price,
  loading,
  statusMessage,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={open} onClose={() => !loading && onCancel()} maxWidth="sm" fullWidth>
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
            You are about to purchase <strong>{productName}</strong> for{' '}
            <strong>{formatPrice(price)} TC</strong>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            A platform fee will be deducted from the purchase price and sent to the marketplace. The
            remaining amount goes directly to the seller.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You will need to approve TonysCoin spending for the full price before the purchase can be
            completed.
          </Typography>
        </>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
      >
        {loading ? 'Processing...' : 'Confirm Purchase'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default BuyDialog;
