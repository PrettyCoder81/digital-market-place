import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { History, Refresh, Search } from '@mui/icons-material';
import { useTransactions, normalizeProductId } from '../../hooks/useTransactions';
import TransactionTable from './TransactionTable';
import type { StoredTransaction } from '../../utils/apiClient';

const TX_TYPES = ['CREATE', 'BUY', 'TRANSFER', 'LISTING', 'UNLISTING', 'WITHDRAW', 'FEE_UPDATE'];

interface TransactionHistoryProps {
  initialType?: string;
}

export interface TxFilterState {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: TxFilterState = { status: '', search: '', dateFrom: '', dateTo: '' };

function applyFilters(
  transactions: StoredTransaction[],
  productNames: Record<string, string>,
  filters: TxFilterState,
): StoredTransaction[] {
  const q = filters.search.trim().toLowerCase();
  const fromTs = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  // Include the whole "to" day by shifting to end of day
  const toTs = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).getTime() : null;

  return transactions.filter((tx) => {
    if (filters.status && tx.status !== filters.status) return false;

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
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ initialType = '' }) => {
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [filters, setFilters] = useState<TxFilterState>(EMPTY_FILTERS);

  const { transactions, productNames, loading, error, refetch } = useTransactions(typeFilter);

  const filteredTransactions = useMemo(
    () => applyFilters(transactions, productNames, filters),
    [transactions, productNames, filters],
  );

  const hasActiveFilters =
    typeFilter !== '' ||
    filters.status !== '' ||
    filters.search.trim() !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';

  const clearFilters = () => {
    setTypeFilter('');
    setFilters(EMPTY_FILTERS);
  };

  const setFilter = <K extends keyof TxFilterState>(key: K, value: TxFilterState[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
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
            {TX_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={18} /> : <Refresh />}
            onClick={refetch}
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
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
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
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
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
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { max: filters.dateTo || undefined },
          }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: filters.dateFrom || undefined },
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

      <TransactionTable
        transactions={filteredTransactions}
        totalCount={transactions.length}
        loading={loading}
        productNames={productNames}
        onClearFilters={clearFilters}
      />
    </Box>
  );
};

export default TransactionHistory;
