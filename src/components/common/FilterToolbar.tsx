/**
 * FilterToolbar
 * Generic filter bar container + shared constants for product/transaction filters.
 */
import React from 'react';
import { Box } from '@mui/material';

export type StatusFilter = 'all' | 'listed' | 'unlisted';
export type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name (A–Z)' },
];

export const TRANSACTION_TYPES = [
  'CREATE',
  'BUY',
  'TRANSFER',
  'LISTING',
  'UNLISTING',
  'WITHDRAW',
  'FEE_UPDATE',
];

const FilterToolbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    {children}
  </Box>
);

export default FilterToolbar;
