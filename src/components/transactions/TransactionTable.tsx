/**
 * TransactionTable
 * Presentational table of stored blockchain transactions.
 */
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import type { StoredTransaction } from '../../utils/apiClient';
import { SEPOLIA_BLOCK_EXPLORER } from '../../config/contracts';
import { normalizeProductId } from '../../hooks/useTransactions';
import { shortenAddress, formatAmount } from '../../lib/format';

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

interface TransactionTableProps {
  transactions: StoredTransaction[];
  totalCount: number;
  loading: boolean;
  productNames: Record<string, string>;
  onClearFilters: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  totalCount,
  loading,
  productNames,
  onClearFilters,
}) => (
  <Card>
    <CardContent sx={{ p: 0 }}>
      {loading && totalCount === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : totalCount === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No transactions yet. Buy, create, or transfer products to see them here.
          </Typography>
        </Box>
      ) : transactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No transactions match the current filters.
          </Typography>
          <Button variant="outlined" size="small" onClick={onClearFilters}>
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
                <TableCell align="right">Amount (TC, BPS)</TableCell>
                <TableCell align="right">Block</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Tx Hash</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => {
                const productKey = normalizeProductId(tx.productId);
                const productName = productKey ? productNames[productKey] : undefined;
                return (
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
                      {productName ? (
                        <Tooltip title={`Product ID: ${productKey}`}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {productName}
                          </Typography>
                        </Tooltip>
                      ) : (
                        productKey ?? '—'
                      )}
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  </Card>
);

export default TransactionTable;
