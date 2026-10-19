/**
 * Web3 Context Provider
 * Manages wallet connection state, account, chain, and contract data
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_DECIMAL } from '../config/contracts';
import { switchToSepolia, getTCBalance, getContractOwner } from '../utils/contractInteractions';

interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isOwner: boolean;
  tcBalance: string;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,
  isOwner: false,
  tcBalance: '0',
  isLoading: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  refreshBalance: async () => {},
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tcBalance, setTcBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // Check whether the connected account is the marketplace contract owner (admin)
  const refreshOwnerStatus = useCallback(async (addr: string | null) => {
    if (!addr || !window.ethereum) {
      setIsOwner(false);
      return;
    }
    try {
      const owner = await getContractOwner();
      setIsOwner(owner.toLowerCase() === addr.toLowerCase());
    } catch (error) {
      console.error('Failed to fetch contract owner:', error);
      setIsOwner(false);
    }
  }, []);

  useEffect(() => {
    refreshOwnerStatus(account);
  }, [account, chainId, refreshOwnerStatus]);

  const refreshBalance = useCallback(async () => {
    if (account) {
      try {
        const balance = await getTCBalance(account);
        setTcBalance(parseFloat(balance).toFixed(4));
      } catch (error) {
        console.error('Failed to fetch TC balance:', error);
        setTcBalance('0');
      }
    }
  }, [account]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this marketplace!');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        const network = await provider.getNetwork();
        const currentChainId = '0x' + network.chainId.toString(16);
        setChainId(currentChainId);
        
        if (currentChainId !== SEPOLIA_CHAIN_ID) {
          try {
            await switchToSepolia();
            setChainId(SEPOLIA_CHAIN_ID);
          } catch (err) {
            console.error('Failed to switch network:', err);
          }
        }
        
        // Fetch balance
        try {
          const balance = await getTCBalance(accounts[0]);
          setTcBalance(parseFloat(balance).toFixed(4));
        } catch {
          setTcBalance('0');
        }
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code !== 4001) {
        alert('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setTcBalance('0');
    setIsOwner(false);
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnectWallet]);

  // Auto-connect if already authorized
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_accounts', []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const network = await provider.getNetwork();
            setChainId('0x' + network.chainId.toString(16));
            try {
              const balance = await getTCBalance(accounts[0]);
              setTcBalance(parseFloat(balance).toFixed(4));
            } catch {
              setTcBalance('0');
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected,
        isCorrectNetwork,
        isOwner,
        tcBalance,
        isLoading,
        connectWallet,
        disconnectWallet,
        refreshBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
