/**
 * TransactionHistory Component
 * Displays blockchain transactions stored in MongoDB (fetched via the
 * backend API GET /api/transactions), newest first.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  InputAdornment,
} from '@mui/material';
import {
  Refresh,
  History,
  OpenInNew,
  Search,
} from '@mui/icons-material';
import { fetchTransactions, fetchProducts, StoredTransaction, StoredProduct } from '../utils/apiClient';
import { SEPOLIA_BLOCK_EXPLORER } from '../config/contracts';

/** Format a productId (number or string) as an on-chain id key, e.g. "1" */
const normalizeProductId = (id?: number | string | null): string | null => {
  if (id === undefined || id === null || id === '') return null;
  try {
    return BigInt(id).toString();
  } catch {
    return String(id);
  }
};

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
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Fetch transactions and product metadata in parallel so we can display
    // product names instead of raw product IDs.
    const [result, products] = await Promise.all([
      fetchTransactions({
        type: typeFilter || undefined,
        limit: 100,
      }),
      fetchProducts({ limit: 1000 }),
    ]);

    const nameMap: Record<string, string> = {};
    (products || []).forEach((p: StoredProduct) => {
      const key = normalizeProductId(p.productId);
      if (key && p.name) nameMap[key] = p.name;
    });
    setProductNames(nameMap);

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

  // Apply client-side filters: status, free-text search, and date range
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    // Include the whole "to" day by shifting to end of day
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return transactions.filter((tx) => {
      if (statusFilter && tx.status !== statusFilter) return false;

      const ts = new Date(tx.timestamp).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;

      if (!q) return true;
      const productKey = normalizeProductId(tx.productId);
      const productName = productKey ? (productNames[productKey] || '').toLowerCase() : '';
      return (
        (tx.txHash || '').toLowerCase().includes(q) ||
        (tx.from || '').toLowerCase().includes(q) ||
        (tx.to || '').toLowerCase().includes(q) ||
        (tx.type || '').toLowerCase().includes(q) ||
        productName.includes(q) ||
        (productKey || '').includes(q)
      );
    });
  }, [transactions, statusFilter, searchQuery, dateFrom, dateTo, productNames]);

  const hasActiveFilters =
    typeFilter !== '' ||
    statusFilter !== '' ||
    searchQuery.trim() !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} component="div">
          <History sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Transactions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {hasActiveFilters && (
            <Button size="small" color="error" variant="text" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
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
          placeholder="Search by hash, address, product name or ID…"
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
          sx={{ flexGrow: 1, minWidth: 240 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
        </TextField>
        <TextField
          size="small"
          label="From date"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { max: dateTo || undefined },
          }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: dateFrom || undefined },
          }}
          sx={{ minWidth: 160 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Showing {filteredTransactions.length} of {transactions.length}
        </Typography>
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
          ) : filteredTransactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No transactions match the current filters.
              </Typography>
              <Button variant="outlined" size="small" onClick={clearFilters}>
                Clear filters
              </Button>
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
                  {filteredTransactions.map((tx) => (
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
                      <TableCell>
                        {(() => {
                          const key = normalizeProductId(tx.productId);
                          const name = key ? productNames[key] : undefined;
                          return name ? (
                            <Tooltip title={`Product ID: ${key}`}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {name}
                              </Typography>
                            </Tooltip>
                          ) : (
                            key ?? '—'
                          );
                        })()}
                      </TableCell>
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
