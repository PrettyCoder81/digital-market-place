/**
 * TransferOwnershipDialog
 * Dialog for transferring product ownership to another address.
 */
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
  TextField,
  Typography,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';

interface TransferOwnershipDialogProps {
  open: boolean;
  productName: string;
  newOwnerAddress: string;
  loading: boolean;
  statusMessage: string;
  onAddressChange: (address: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
  open,
  productName,
  newOwnerAddress,
  loading,
  statusMessage,
  onAddressChange,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={open} onClose={() => !loading && onCancel()} maxWidth="sm" fullWidth>
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
            This will transfer ownership of <strong>{productName}</strong> to another address. No tokens
            will be exchanged. The product will be automatically delisted.
          </Alert>
          <TextField
            fullWidth
            label="New Owner Address"
            placeholder="0x..."
            value={newOwnerAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            sx={{ mt: 1 }}
            variant="outlined"
          />
        </>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={onConfirm}
        disabled={loading || !newOwnerAddress}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SwapHoriz />}
      >
        {loading ? 'Transferring...' : 'Transfer'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default TransferOwnershipDialog;
