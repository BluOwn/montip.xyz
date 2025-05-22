// src/contexts/Web3Context.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { initializeWeb3, getAccount, isConnected, switchToMonadNetwork, getBalance } from '@/services/web3';
import toast from 'react-hot-toast';
import { CHAIN_CONFIG } from '@/constants';
import { Web3Context } from './Web3ContextDefinition';

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const checkNetwork = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const correct = chainId === CHAIN_CONFIG.chainId;
      setIsCorrectNetwork(correct);
      return correct;
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!account) return;
    
    try {
      const balanceValue = await getBalance(account);
      setBalance(balanceValue);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [account]);

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const success = await initializeWeb3();
      
      if (success) {
        const address = await getAccount();
        setAccount(address);
        
        await checkNetwork();
        await refreshBalance();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet. Please try again.');
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [checkNetwork, refreshBalance]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setIsCorrectNetwork(false);
    // Note: MetaMask doesn't support programmatic disconnection
    // This just resets our local state
    toast.success('Wallet disconnected');
  }, []);

  const switchNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const success = await switchToMonadNetwork();
      
      if (success) {
        setIsCorrectNetwork(true);
        toast.success('Connected to Monad Network');
      } else {
        toast.error('Failed to switch to Monad Network');
      }
      
      return success;
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Error switching networks');
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const success = await connect();
          if (!success) {
            setIsInitializing(false);
          }
        } catch (error) {
          console.error('Initialization error:', error);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    init();

    // Set up event listeners
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAccount(null);
          setBalance(null);
          // Fixed toast.info to use a standard toast with an icon
          toast('Wallet disconnected', { icon: 'ℹ️' });
        } else {
          setAccount(accounts[0]);
          await refreshBalance();
          toast.success('Wallet connected');
        }
      };

      const handleChainChanged = async () => {
        await checkNetwork();
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Clean up listeners on unmount
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connect, checkNetwork, refreshBalance]);

  // Refresh balance periodically
  useEffect(() => {
    if (!account) return;
    
    const intervalId = setInterval(() => {
      refreshBalance();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [account, refreshBalance]);

  const value = {
    account,
    balance,
    isConnected: isConnected() && account !== null,
    isInitializing,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};