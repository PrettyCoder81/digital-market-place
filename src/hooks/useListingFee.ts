import { useEffect, useState } from 'react';
import { getListingFee } from '../utils/contractInteractions';
import { useWeb3 } from '../context/Web3Context';

const DEFAULT_FEE = '10';

export function useListingFee(): string {
  const { isConnected } = useWeb3();
  const [listingFee, setListingFee] = useState<string>(DEFAULT_FEE);

  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;

    (async () => {
      try {
        const fee = await getListingFee();
        if (!cancelled) setListingFee(fee);
      } catch {
        if (!cancelled) setListingFee(DEFAULT_FEE);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected]);

  return listingFee;
}
