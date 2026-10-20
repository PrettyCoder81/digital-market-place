import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllProducts, Product } from '../utils/contractInteractions';
import { useWeb3 } from '../context/Web3Context';

export function useProducts() {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedProducts = await getAllProducts();
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Using demo data - connect wallet to see live products');
    } finally {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const listedCount = useMemo(() => products.filter((p) => p.listed).length, [products]);
  const unlistedCount = products.length - listedCount;

  return { products, loading, error, refetch, listedCount, unlistedCount };
}
