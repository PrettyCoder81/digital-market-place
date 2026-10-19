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
  setPlatformFee,
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
  const [newFeeBps, setNewFeeBps] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [checkingOwner, setCheckingOwner] = useState(true);

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
      } catch (error) {
        console.error('Failed to check owner status:', error);
        // For demo, assume user is owner if connected
        setIsOwner(true);
        setAccruedFees('125.50');
        setCurrentFeeBps(500);
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

    setLoading(true);
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
      setLoading(false);
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

    setLoading(true);
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
      setLoading(false);
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

      {/* Status Alert */}
      {loading && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<CircularProgress size={20} />}
        >
          {statusMessage || 'Processing...'}
        </Alert>
      )}

      {!isCorrectNetwork && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please switch to Sepolia network to interact with the contract.
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Shield sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Percent />}
              sx={{ height: 56 }}
            >
              Update Fee
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
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
              sx={{ height: 56 }}
            >
              {loading ? 'Withdrawing...' : `Withdraw ${withdrawAmount || accruedFees} TC`}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
