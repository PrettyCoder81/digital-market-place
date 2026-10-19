/**
 * TransactionHistory Component
 * Displays blockchain transactions stored in MongoDB (fetched via the
 * backend API GET /api/transactions), newest first.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Refresh,
  History,
  OpenInNew,
} from '@mui/icons-material';
import { fetchTransactions, StoredTransaction } from '../utils/apiClient';
import { SEPOLIA_BLOCK_EXPLORER } from '../config/contracts';

interface TransactionHistoryProps {
  /** Optional filter: only show transactions of this type */
  initialType?: string;
}

const TYPE_COLORS: Record<string, 'success' | 'primary' | 'secondary' | 'warning' | 'info' | 'default'> = {
  CREATE: 'primary',
  MINT: 'primary',
  BUY: 'success',
  SELL: 'success',
  TRANSFER: 'secondary',
  WITHDRAW: 'warning',
  FEE_UPDATE: 'info',
  LISTING: 'info',
  UNLISTING: 'default',
};

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning'> = {
  confirmed: 'success',
  failed: 'error',
  pending: 'warning',
};

const shortenAddress = (addr?: string) => {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatAmount = (amount?: string) => {
  const n = parseFloat(amount || '0');
  return isNaN(n) ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ initialType = '' }) => {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTransactions({
      type: typeFilter || undefined,
      limit: 100,
    });
    if (result === null) {
      setError('Could not load transactions. Is the backend server (port 5000) and MongoDB running?');
      setTransactions([]);
    } else {
      setTransactions(result);
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} component="div">
          <History sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Transactions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All types</MenuItem>
            {['CREATE', 'BUY', 'TRANSFER', 'LISTING', 'UNLISTING', 'WITHDRAW', 'FEE_UPDATE'].map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={18} /> : <Refresh />}
            onClick={load}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && transactions.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 && !error ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                No transactions yet. Buy, create, or transfer products to see them here.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell align="right">Amount (TC)</TableCell>
                    <TableCell align="right">Block</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Tx Hash</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx._id || tx.txHash} hover>
                      <TableCell>
                        <Chip
                          label={tx.type}
                          size="small"
                          color={TYPE_COLORS[tx.type] || 'default'}
                          sx={{ fontWeight: 600, minWidth: 90 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          size="small"
                          variant="outlined"
                          color={STATUS_COLORS[tx.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>{tx.productId ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={tx.from}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {shortenAddress(tx.from)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={tx.to || ''}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {shortenAddress(tx.to)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">{formatAmount(tx.amount)}</TableCell>
                      <TableCell align="right">{tx.blockNumber ?? '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tx.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`View on Etherscan: ${tx.txHash}`}>
                          <Button
                            size="small"
                            href={`${SEPOLIA_BLOCK_EXPLORER}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                          >
                            {tx.txHash.slice(0, 10)}…
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionHistory;
