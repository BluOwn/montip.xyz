// src/services/web3.ts
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '@/config/abi';
import { CONTRACT_ADDRESS, CHAIN_CONFIG } from '@/constants';
import type { ContractError } from '@/types/contract.types';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;
let readOnlyProvider: ethers.JsonRpcProvider | null = null;
let readOnlyContract: ethers.Contract | null = null;

/**
 * Get a read-only provider that doesn't require wallet connection
 */
export const getReadOnlyProvider = (): ethers.JsonRpcProvider => {
  if (!readOnlyProvider) {
    readOnlyProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrls[0]);
  }
  return readOnlyProvider;
};

/**
 * Get a read-only contract instance that doesn't require wallet connection
 */
export const getReadOnlyContract = (): ethers.Contract => {
  if (!readOnlyContract) {
    const provider = getReadOnlyProvider();
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
  return readOnlyContract;
};

/**
 * Initialize Web3 by connecting to the wallet and setting up providers
 */
export const initializeWeb3 = async (): Promise<boolean> => {
  try {
    if (window.ethereum === undefined) {
      throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Check if we're on the right network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== CHAIN_CONFIG.chainId) {
      const success = await switchToMonadNetwork();
      if (!success) {
        throw new Error('Failed to switch to Monad Network');
      }
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    return true;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    return false;
  }
};

/**
 * Switch to the Monad Network or add it if it doesn't exist
 */
export const switchToMonadNetwork = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    try {
      // Try to switch to the Monad network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: CHAIN_CONFIG.chainId,
              chainName: CHAIN_CONFIG.chainName,
              nativeCurrency: CHAIN_CONFIG.nativeCurrency,
              rpcUrls: CHAIN_CONFIG.rpcUrls,
              blockExplorerUrls: CHAIN_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      }
      // Other errors
      throw switchError;
    }
  } catch (error) {
    console.error('Error switching to Monad network:', error);
    return false;
  }
};

/**
 * Get the contract instance (requires wallet connection for write operations)
 */
export const getContract = async (): Promise<ethers.Contract> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }
  
  if (contract) {
    return contract;
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

/**
 * Get the current signer
 */
export const getSigner = async (): Promise<ethers.Signer> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }
  
  if (signer) {
    return signer;
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
};

/**
 * Get the current account address
 */
export const getAccount = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  
  if (accounts.length === 0) {
    throw new Error('No accounts found. Please connect your wallet.');
  }
  
  return accounts[0];
};

/**
 * Check if the wallet is connected
 */
export const isConnected = (): boolean => {
  return provider !== null && signer !== null;
};

/**
 * Format contract errors for better user experience
 */
export const formatContractError = (error: any): ContractError => {
  // Metamask errors
  if (error.code) {
    switch (error.code) {
      case 4001:
        return {
          code: error.code,
          message: 'Transaction rejected by user',
        };
      case 4100:
        return {
          code: error.code,
          message: 'Unauthorized - Please connect your wallet',
        };
      case 4200:
        return {
          code: error.code,
          message: 'Wallet not connected or wrong chain',
        };
      case 4900:
        return {
          code: error.code,
          message: 'Disconnected from chain',
        };
      case 4901:
        return {
          code: error.code,
          message: 'Chain not connected',
        };
      default:
        return {
          code: error.code,
          message: error.message || 'Unknown error',
        };
    }
  }

  // Contract-specific errors
  if (error.data && error.data.message) {
    return {
      code: -1,
      message: error.data.message,
    };
  }

  // Parse error strings
  const errorString = error.toString();
  
  if (errorString.includes('user rejected transaction')) {
    return {
      code: 4001,
      message: 'Transaction rejected by user',
    };
  }
  
  if (errorString.includes('insufficient funds')) {
    return {
      code: -1,
      message: 'Insufficient funds for transaction',
    };
  }

  return {
    code: -1,
    message: errorString || 'Unknown error',
  };
};

/**
 * Get the current balance of the connected account
 */
export const getBalance = async (address: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const balanceWei = await provider.getBalance(address);
  return ethers.formatEther(balanceWei);
};