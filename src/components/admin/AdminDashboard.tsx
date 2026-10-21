import React, { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material';
import { Dashboard, Percent, Shield, Warning } from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import { useAdminStats } from '../../hooks/useAdminStats';
import { runTransaction } from '../../lib/errors';
import { shortHash } from '../../lib/format';
import { MARKETPLACE_ADDRESS } from '../../config/contracts';
import EmptyState from '../common/EmptyState';
import StatCard from './StatCard';
import FeeUpdateCard from './FeeUpdateCard';
import WithdrawFeesCard from './WithdrawFeesCard';
import type { ShowStatusFn } from '../../types/marketplace';

interface AdminDashboardProps {
  onShowStatus: ShowStatusFn;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const {
    isAdminOwner,
    checkingOwner,
    accruedFees,
    currentFeeBps,
    currentListingFee,
    activeAction,
    statusMessage,
    updatePlatformFee,
    updateListingFee,
    withdrawFees,
    setActiveAction,
    setStatusMessage,
  } = useAdminStats();

  const [newFeeBps, setNewFeeBps] = useState('');
  const [newListingFee, setNewListingFee] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const loading = activeAction !== null;

  const handleUpdateFee = async () => {
    const feeValue = parseInt(newFeeBps);
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 10000) {
      onShowStatus('Fee must be between 0 and 10000 basis points', 'error');
      return;
    }

    await runTransaction({
      action: async () => {
        setStatusMessage('Updating platform fee...');
        const txHash = await updatePlatformFee(feeValue, setStatusMessage);
        onShowStatus(`Platform fee updated! TX: ${shortHash(txHash)}`, 'success');
        setNewFeeBps('');
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to update fee',
      onStart: () => setActiveAction('fee'),
      onFinish: () => {
        setActiveAction(null);
        setStatusMessage('');
      },
    });
  };

  const handleUpdateListingFee = async () => {
    const feeValue = parseFloat(newListingFee);
    if (isNaN(feeValue) || feeValue <= 0) {
      onShowStatus('Listing fee must be greater than 0', 'error');
      return;
    }

    await runTransaction({
      action: async () => {
        setStatusMessage('Updating listing fee...');
        const txHash = await updateListingFee(newListingFee, setStatusMessage);
        onShowStatus(`Listing fee updated! TX: ${shortHash(txHash)}`, 'success');
        setNewListingFee('');
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to update listing fee',
      onStart: () => setActiveAction('listingFee'),
      onFinish: () => {
        setActiveAction(null);
        setStatusMessage('');
      },
    });
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

    await runTransaction({
      action: async () => {
        setStatusMessage('Withdrawing platform fees...');
        const txHash = await withdrawFees(account!, amount, setStatusMessage);
        onShowStatus(`Fees withdrawn! TX: ${shortHash(txHash)}`, 'success');
        setWithdrawAmount('');
      },
      onError: (message) => onShowStatus(message, 'error'),
      fallbackMessage: 'Failed to withdraw fees',
      onStart: () => setActiveAction('withdraw'),
      onFinish: () => {
        setActiveAction(null);
        setStatusMessage('');
      },
    });
  };

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Shield />}
        title="Admin Access Required"
        description="Please connect your wallet to access the admin dashboard."
      />
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

  if (!isAdminOwner) {
    return (
      <EmptyState
        icon={<Warning />}
        title="Access Denied"
        description="Only the contract owner can access this dashboard."
      >
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your address: {account?.slice(0, 10)}...{account?.slice(-8)}
        </Typography>
      </EmptyState>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        <Dashboard sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
        Admin Dashboard
      </Typography>

      <Snackbar open={loading} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
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
          <StatCard
            icon={<AccountBalanceIcon />}
            value={accruedFees}
            label="Accrued Fees (TC)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Percent />}
            color="secondary"
            value={`${(currentFeeBps / 100).toFixed(1)}%`}
            label={`Platform Fee (${currentFeeBps} bps)`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard emoji="🏷️" color="warning" value={currentListingFee} label="Listing Fee (TC)" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Shield />}
            color="success"
            value="Owner"
            label=""
            sublabel={
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
              >
                {account?.slice(0, 10)}...{account?.slice(-8)}
              </Typography>
            }
          />
        </Grid>
      </Grid>

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

      <FeeUpdateCard
        title={
          <>
            <Percent sx={{ mr: 1, verticalAlign: 'middle' }} />
            Update Platform Fee
          </>
        }
        description={
          <>
            Set the platform fee in basis points (100 bps = 1%, 500 bps = 5%, 10000 bps = 100%). Max
            allowed: 10,000 bps.
          </>
        }
        label="New Fee (basis points)"
        placeholder="500"
        value={newFeeBps}
        helperText={
          newFeeBps
            ? `${(parseInt(newFeeBps) / 100).toFixed(2)}%`
            : `Current: ${(currentFeeBps / 100).toFixed(1)}%`
        }
        buttonLabel="Update Fee"
        pendingLabel="Updating..."
        buttonColor="secondary"
        icon={<Percent />}
        disabled={loading}
        isPending={activeAction === 'fee'}
        onChange={setNewFeeBps}
        onSubmit={handleUpdateFee}
      />

      {/* Update Listing Fee */}
      <FeeUpdateCard
        title={<>🏷️ Update Listing Fee</>}
        description={
          <>
            Set the listing fee in TC. This is the fee charged to sellers when they create a new
            product listing. Current listing fee: <strong>{currentListingFee} TC</strong>
          </>
        }
        label="New Listing Fee (TC)"
        placeholder="10"
        value={newListingFee}
        helperText={`Current: ${currentListingFee} TC`}
        buttonLabel="Update Listing Fee"
        pendingLabel="Updating..."
        buttonColor="warning"
        icon={<span>🏷️</span>}
        disabled={loading}
        isPending={activeAction === 'listingFee'}
        onChange={setNewListingFee}
        onSubmit={handleUpdateListingFee}
      />

      {/* Withdraw Fees */}
      <WithdrawFeesCard
        accruedFees={accruedFees}
        amount={withdrawAmount}
        disabled={loading}
        isPending={activeAction === 'withdraw'}
        onChange={setWithdrawAmount}
        onWithdraw={handleWithdraw}
      />
    </Box>
  );
};

import { AccountBalance as AccountBalanceIcon } from '@mui/icons-material';

export default AdminDashboard;
