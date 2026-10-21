
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
