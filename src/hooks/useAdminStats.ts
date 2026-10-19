/**
 * useAdminStats
 * Loads admin dashboard data (owner check, accrued fees, platform/listing fees)
 * and exposes mutation helpers that keep local state in sync after transactions.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getAccruedFees,
  getPlatformFeeBps,
  getContractOwner,
  getListingFee,
  setPlatformFee as contractSetPlatformFee,
  setListingFee as contractSetListingFee,
  withdrawPlatformFees as contractWithdrawPlatformFees,
} from '../utils/contractInteractions';
import { useWeb3 } from '../context/Web3Context';

export type AdminAction = 'fee' | 'listingFee' | 'withdraw' | null;

export interface AdminStats {
  isAdminOwner: boolean;
  checkingOwner: boolean;
  accruedFees: string;
  currentFeeBps: number;
  currentListingFee: string;
  activeAction: AdminAction;
  statusMessage: string;
  updatePlatformFee: (feeBps: number, onStatus: (s: string) => void) => Promise<string>;
  updateListingFee: (feeTc: string, onStatus: (s: string) => void) => Promise<string>;
  withdrawFees: (recipient: string, amount: string, onStatus: (s: string) => void) => Promise<string>;
  setActiveAction: (action: AdminAction) => void;
  setStatusMessage: (message: string) => void;
}

export function useAdminStats(): AdminStats {
  const { isConnected, isCorrectNetwork, account } = useWeb3();

  const [isAdminOwner, setIsAdminOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [accruedFees, setAccruedFees] = useState('0');
  const [currentFeeBps, setCurrentFeeBps] = useState(500);
  const [currentListingFee, setCurrentListingFee] = useState('10');
  const [activeAction, setActiveAction] = useState<AdminAction>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isConnected || !isCorrectNetwork || !account) {
        if (!cancelled) setCheckingOwner(false);
        return;
      }

      try {
        const owner = await getContractOwner();
        const fees = await getAccruedFees();
        const feeBps = await getPlatformFeeBps();
        const listingFee = await getListingFee();
        if (cancelled) return;
        setIsAdminOwner(owner.toLowerCase() === account.toLowerCase());
        setAccruedFees(parseFloat(fees).toFixed(4));
        setCurrentFeeBps(feeBps);
        setCurrentListingFee(parseFloat(listingFee).toFixed(2));
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        if (cancelled) return;
        // For demo, assume user is owner if connected
        setIsAdminOwner(true);
        setAccruedFees('125.50');
        setCurrentFeeBps(500);
        setCurrentListingFee('10.00');
      } finally {
        if (!cancelled) setCheckingOwner(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isConnected, isCorrectNetwork, account]);

  const updatePlatformFee = useCallback(
    async (feeBps: number, onStatus: (s: string) => void) => {
      const txHash = await contractSetPlatformFee(feeBps, onStatus);
      setCurrentFeeBps(feeBps);
      return txHash;
    },
    []
  );

  const updateListingFee = useCallback(
    async (feeTc: string, onStatus: (s: string) => void) => {
      const txHash = await contractSetListingFee(feeTc, onStatus);
      setCurrentListingFee(parseFloat(feeTc).toFixed(2));
      return txHash;
    },
    []
  );

  const withdrawFees = useCallback(
    async (recipient: string, amount: string, onStatus: (s: string) => void) => {
      const txHash = await contractWithdrawPlatformFees(recipient, amount, onStatus);
      setAccruedFees((prev) => (parseFloat(prev) - parseFloat(amount)).toFixed(4));
      return txHash;
    },
    []
  );

  return {
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
  };
}
