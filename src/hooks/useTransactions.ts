import { useCallback, useEffect, useState } from 'react';
import {
  fetchTransactions,
  fetchProducts,
  StoredTransaction,
  StoredProduct,
} from '../utils/apiClient';

export const normalizeProductId = (id?: number | string | null): string | null => {
  if (id === undefined || id === null || id === '') return null;
  try {
    return BigInt(id).toString();
  } catch {
    return String(id);
  }
};

export function useTransactions(typeFilter: string) {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Fetch transactions and product metadata in parallel so we can display
    // product names instead of raw product IDs.
    const [result, products] = await Promise.all([
      fetchTransactions({ type: typeFilter || undefined, limit: 100 }),
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
    refetch();
  }, [refetch]);

  return { transactions, productNames, loading, error, refetch };
}
