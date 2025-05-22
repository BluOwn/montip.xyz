import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getReadOnlyContract, formatContractError } from '@/services/web3';
import toast from 'react-hot-toast';
import type { Jar } from '@/types/contract.types';
import { MAX_DESCRIPTION_LENGTH } from '@/constants';
import { isValidUsername } from '@/utils/validation';

interface UseJarReturn {
  jar: Jar | null;
  isLoading: boolean;
  error: string | null;
  refetch: (username: string) => Promise<void>;
  hasJar: (address: string) => Promise<boolean>;
  getUserJar: (address: string) => Promise<string>;
  createJar: (username: string, description: string) => Promise<boolean>;
  deleteJar: () => Promise<boolean>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
}

export const useJar = (initialUsername?: string): UseJarReturn => {
  const [jar, setJar] = useState<Jar | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJar = useCallback(async (username: string) => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const contract = getReadOnlyContract();
      const jarInfo = await contract.getJarInfo(username);
      
      const exists = jarInfo[0] !== ethers.ZeroAddress;
      
      if (exists) {
        setJar({
          owner: jarInfo[0],
          description: jarInfo[1],
          totalReceived: parseFloat(ethers.formatEther(jarInfo[2])),
          username,
          exists: true,
        });
      } else {
        setError(`Tip jar @${username} doesn't exist or has been deleted`);
        setJar(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching jar:', err);
      const formattedError = formatContractError(err as Error);
      setError(formattedError.message || 'Failed to fetch jar');
      setJar(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasJar = useCallback(async (address: string): Promise<boolean> => {
    try {
      const contract = getReadOnlyContract();
      return await contract.hasJar(address);
    } catch (err) {
      console.error('Error checking if user has jar:', err);
      return false;
    }
  }, []);

  const getUserJar = useCallback(async (address: string): Promise<string> => {
    try {
      const contract = getReadOnlyContract();
      return await contract.getUserJar(address);
    } catch (err) {
      console.error('Error getting user jar:', err);
      return '';
    }
  }, []);

  const isUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    if (!username || !isValidUsername(username)) {
      return false;
    }
    
    try {
      const contract = getReadOnlyContract();
      const jarInfo = await contract.getJarInfo(username);
      return jarInfo[0] === ethers.ZeroAddress;
    } catch (err) {
      console.error('Error checking username availability:', err);
      if (err instanceof Error && err.message.includes("execution reverted")) {
        return true;
      }
      return false;
    }
  }, []);

  const createJar = useCallback(async (username: string, description: string): Promise<boolean> => {
    if (!username || !isValidUsername(username)) {
      toast.error('Username must be up to 32 characters and can only contain letters, numbers, underscores, hyphens, and periods');
      return false;
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return false;
    }
    
    const available = await isUsernameAvailable(username);
    if (!available) {
      toast.error(`Username @${username} is already taken`);
      return false;
    }
    
    try {
      const contract = await getContract();
      const loadingToast = toast.loading('Creating your tip jar...');
      
      const tx = await contract.createJar(username, description);
      const receipt = await tx.wait();
      
      toast.dismiss(loadingToast);
      
      if (receipt.status === 1) {
        toast.success('Tip jar created successfully!');
        return true;
      } else {
        toast.error('Transaction failed');
        return false;
      }
    } catch (err: any) {
      console.error('Error creating jar:', err);
      const formattedError = formatContractError(err);
      
      if (formattedError.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error(formattedError.message || 'Error creating tip jar');
      }
      
      return false;
    }
  }, [isUsernameAvailable]);

  const deleteJar = useCallback(async (): Promise<boolean> => {
    try {
      const contract = await getContract();
      const loadingToast = toast.loading('Deleting your tip jar...');
      
      const tx = await contract.deleteJar();
      const receipt = await tx.wait();
      
      toast.dismiss(loadingToast);
      
      if (receipt.status === 1) {
        toast.success('Tip jar deleted successfully');
        return true;
      } else {
        toast.error('Transaction failed');
        return false;
      }
    } catch (err: any) {
      console.error('Error deleting jar:', err);
      const formattedError = formatContractError(err);
      
      if (formattedError.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error(formattedError.message || 'Error deleting tip jar');
      }
      
      return false;
    }
  }, []);

  useEffect(() => {
    if (initialUsername) {
      fetchJar(initialUsername);
    }
  }, [initialUsername, fetchJar]);

  return {
    jar,
    isLoading,
    error,
    refetch: fetchJar,
    hasJar,
    getUserJar,
    createJar,
    deleteJar,
    isUsernameAvailable,
  };
};