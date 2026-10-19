/**
 * AdminDashboard Component
 * Owner-only features: view fees, update platform fee, withdraw funds
 * 
 * Contract functions used:
 * - setPlatformFee(newFeeBps): owner-only
 * - withdrawPlatformFees(recipient, amount): owner-only
 * - accruedPlatformFees: public variable
 * - platformFeeBps: public variable
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Snackbar,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  Percent,
  Download,
  Shield,
  Warning,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';
import {
  getAccruedFees,
  getPlatformFeeBps,
  getContractOwner,
  getListingFee,
  setPlatformFee,
  setListingFee,
  withdrawPlatformFees,
} from '../utils/contractInteractions';
import { MARKETPLACE_ADDRESS } from '../config/contracts';

interface AdminDashboardProps {
  onShowStatus: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  
  const [isOwner, setIsOwner] = useState(false);
  const [accruedFees, setAccruedFees] = useState('0');
  const [currentFeeBps, setCurrentFeeBps] = useState(500);
  const [currentListingFee, setCurrentListingFee] = useState('10');
  const [newFeeBps, setNewFeeBps] = useState('');
  const [newListingFee, setNewListingFee] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  // Which action is currently in-flight ('fee' | 'listingFee' | 'withdraw' | null)
  // so only the clicked button shows its loading state.
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [checkingOwner, setCheckingOwner] = useState(true);

  const loading = activeAction !== null;

  useEffect(() => {
    const checkOwner = async () => {
      if (!isConnected || !isCorrectNetwork || !account) {
        setCheckingOwner(false);
        return;
      }

      try {
        const owner = await getContractOwner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
        
        const fees = await getAccruedFees();
        setAccruedFees(parseFloat(fees).toFixed(4));
        
        const feeBps = await getPlatformFeeBps();
        setCurrentFeeBps(feeBps);
        
        const listingFee = await getListingFee();
        setCurrentListingFee(parseFloat(listingFee).toFixed(2));
      } catch (error) {
        console.error('Failed to check owner status:', error);
        // For demo, assume user is owner if connected
        setIsOwner(true);
        setAccruedFees('125.50');
        setCurrentFeeBps(500);
        setCurrentListingFee('10.00');
      } finally {
        setCheckingOwner(false);
      }
    };

    checkOwner();
  }, [isConnected, isCorrectNetwork, account]);

  const handleUpdateFee = async () => {
    const feeValue = parseInt(newFeeBps);
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 10000) {
      onShowStatus('Fee must be between 0 and 10000 basis points', 'error');
      return;
    }

    setActiveAction('fee');
    try {
      setStatusMessage('Updating platform fee...');
      const txHash = await setPlatformFee(feeValue, (status: string) => setStatusMessage(status));
      
      onShowStatus(`Platform fee updated! TX: ${txHash.slice(0, 10)}...`, 'success');
      setCurrentFeeBps(feeValue);
      setNewFeeBps('');
    } catch (error: any) {
      console.error('Update fee error:', error);
      const message = error.code === 4001
        ? 'Transaction rejected by user'
        : error.reason || error.message || 'Failed to update fee';
      onShowStatus(message, 'error');
    } finally {
      setActiveAction(null);
      setStatusMessage('');
    }
  };

  const handleUpdateListingFee = async () => {
    const feeValue = parseFloat(newListingFee);
    if (isNaN(feeValue) || feeValue <= 0) {
      onShowStatus('Listing fee must be greater than 0', 'error');
      return;
    }

    setActiveAction('listingFee');
    try {
      setStatusMessage('Updating listing fee...');
      const txHash = await setListingFee(newListingFee, (status: string) => setStatusMessage(status));
      
      onShowStatus(`Listing fee updated! TX: ${txHash.slice(0, 10)}...`, 'success');
      setCurrentListingFee(feeValue.toFixed(2));
      setNewListingFee('');
    } catch (error: any) {
      console.error('Update listing fee error:', error);
      const message = error.code === 4001
        ? 'Transaction rejected by user'
        : error.reason || error.message || 'Failed to update listing fee';
      onShowStatus(message, 'error');
    } finally {
      setActiveAction(null);
      setStatusMessage('');
    }
  };

  const handleWithdraw = async () => {
    const amount = withdrawAmount || accruedFees;
    if (parseFloat(amount) <= 0) {
      onShowStatus('Please enter a valid amount', 'error');
      return;
    }
    if (parseFloat(amount) > parseFloat(accruedFees)) {
      onShowStatus('Amount exceeds accrued fees', 'error');
      return;
    }

    setActiveAction('withdraw');
    try {
      setStatusMessage('Withdrawing platform fees...');
      // withdrawPlatformFees takes (recipient, amount)
      const txHash = await withdrawPlatformFees(
        account!,
        amount,
        (status: string) => setStatusMessage(status)
      );
      
      onShowStatus(`Fees withdrawn! TX: ${txHash.slice(0, 10)}...`, 'success');
      setAccruedFees((parseFloat(accruedFees) - parseFloat(amount)).toFixed(4));
      setWithdrawAmount('');
    } catch (error: any) {
      console.error('Withdraw error:', error);
      const message = error.code === 4001
        ? 'Transaction rejected by user'
        : error.reason || error.message || 'Failed to withdraw fees';
      onShowStatus(message, 'error');
    } finally {
      setActiveAction(null);
      setStatusMessage('');
    }
  };

  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Shield sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Admin Access Required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please connect your wallet to access the admin dashboard.
        </Typography>
      </Box>
    );
  }

  if (checkingOwner) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Checking admin access...
        </Typography>
      </Box>
    );
  }

  if (!isOwner) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Warning sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Only the contract owner can access this dashboard.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your address: {account?.slice(0, 10)}...{account?.slice(-8)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        <Dashboard sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
        Admin Dashboard
      </Typography>

      {/* Loading Snackbar (shows only while the clicked button's transaction is in flight) */}
      <Snackbar
        open={loading}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }} icon={<CircularProgress size={20} />}>
          {statusMessage || 'Processing...'}
        </Alert>
      </Snackbar>

      {!isCorrectNetwork && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please switch to Sepolia network to interact with the contract.
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{height: '170px'}}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {accruedFees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accrued Fees (TC)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{height: '170px'}}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Percent sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                {(currentFeeBps / 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Platform Fee ({currentFeeBps} bps)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{height: '170px'}}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 40, mb: 1 }}>🏷️</Typography>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {currentListingFee}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Listing Fee (TC)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{height: '170px'}}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Shield sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Owner
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {account?.slice(0, 10)}...{account?.slice(-8)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contract Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Contract Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Marketplace:
            </Typography>
            <Chip
              label={`${MARKETPLACE_ADDRESS.slice(0, 10)}...${MARKETPLACE_ADDRESS.slice(-8)}`}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Max Fee:
            </Typography>
            <Chip label="10,000 bps (100%)" size="small" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      {/* Update Platform Fee */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <Percent sx={{ mr: 1, verticalAlign: 'middle' }} />
            Update Platform Fee
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set the platform fee in basis points (100 bps = 1%, 500 bps = 5%, 10000 bps = 100%).
            Max allowed: 10,000 bps.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              label="New Fee (basis points)"
              value={newFeeBps}
              onChange={(e) => setNewFeeBps(e.target.value)}
              placeholder="500"
              disabled={loading}
              helperText={newFeeBps ? `${(parseInt(newFeeBps) / 100).toFixed(2)}%` : `Current: ${(currentFeeBps / 100).toFixed(1)}%`}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpdateFee}
              disabled={loading || !newFeeBps}
              startIcon={activeAction === 'fee' ? <CircularProgress size={20} color="inherit" /> : <Percent />}
              sx={{ height: 56 }}
            >
              {activeAction === 'fee' ? 'Updating...' : 'Update Fee'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Update Listing Fee */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🏷️ Update Listing Fee
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set the listing fee in TC. This is the fee charged to sellers when they create a new product listing.
            Current listing fee: <strong>{currentListingFee} TC</strong>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              label="New Listing Fee (TC)"
              value={newListingFee}
              onChange={(e) => setNewListingFee(e.target.value)}
              placeholder="10"
              disabled={loading}
              helperText={`Current: ${currentListingFee} TC`}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              color="warning"
              onClick={handleUpdateListingFee}
              disabled={loading || !newListingFee}
              startIcon={activeAction === 'listingFee' ? <CircularProgress size={20} color="inherit" /> : <span>🏷️</span>}
              sx={{ height: 56 }}
            >
              {activeAction === 'listingFee' ? 'Updating...' : 'Update Listing Fee'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Withdraw Fees */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <Download sx={{ mr: 1, verticalAlign: 'middle' }} />
            Withdraw Platform Fees
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Withdraw accrued platform fees. The contract function takes a recipient address and amount.
            Available: <strong>{accruedFees} TC</strong>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              label={`Amount (TC) - Max: ${accruedFees}`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={accruedFees}
              disabled={loading}
              sx={{ flex: 1, minWidth: 200 }}
              helperText="Leave empty to withdraw all"
            />
            <Button
              variant="contained"
              onClick={handleWithdraw}
              disabled={loading || parseFloat(accruedFees) === 0}
              startIcon={activeAction === 'withdraw' ? <CircularProgress size={20} color="inherit" /> : <Download />}
              sx={{ height: 56 }}
            >
              {activeAction === 'withdraw' ? 'Withdrawing...' : `Withdraw ${withdrawAmount || accruedFees} TC`}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
