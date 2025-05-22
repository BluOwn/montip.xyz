import { useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getContract, formatContractError } from '@/services/web3';
import type { Tip } from '@/types/contract.types';
import { MIN_TIP_AMOUNT } from '@/constants';
import { isValidTipMessage } from '@/utils/validation';

interface UseTipsReturn {
  tips: Tip[];
  isLoading: boolean;
  error: string | null;
  fetchTips: (username: string, offset?: number, limit?: number) => Promise<void>;
  fetchRecentTips: (username: string) => Promise<void>;
  sendTip: (username: string, amount: string, message: string) => Promise<boolean>;
  withdrawFailedTips: () => Promise<boolean>;
  getTipCount: (username: string) => Promise<number>;
  loadMoreTips: (username: string) => Promise<boolean>;
  hasMoreTips: boolean;
}

export const useTips = (): UseTipsReturn => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreTips, setHasMoreTips] = useState<boolean>(true);
  
  // Track pagination
  const offsetRef = useRef<number>(0);
  const limitRef = useRef<number>(10);
  const totalTipsRef = useRef<number>(0);

  const fetchTips = useCallback(
    async (username: string, offset = 0, limit = 10) => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const contract = await getContract();
        const [senders, amounts, messages, timestamps] = await contract.getTips(username, offset, limit);
        
        const formattedTips: Tip[] = [];
        for (let i = 0; i < senders.length; i++) {
          formattedTips.push({
            sender: senders[i],
            amount: parseFloat(ethers.formatEther(amounts[i])),
            message: messages[i],
            timestamp: Number(timestamps[i]),
          });
        }
        
        // If we're fetching from the beginning, replace all tips
        if (offset === 0) {
          setTips(formattedTips);
        } else {
          // Otherwise, append the new tips
          setTips(prevTips => [...prevTips, ...formattedTips]);
        }
        
        // Update pagination state
        offsetRef.current = offset + formattedTips.length;
        limitRef.current = limit;
        
        // Check if there are more tips to load
        const tipCount = await getTipCount(username);
        totalTipsRef.current = tipCount;
        setHasMoreTips(offsetRef.current < tipCount);
        
      } catch (err: any) {
        console.error('Error fetching tips:', err);
        const formattedError = formatContractError(err);
        setError(formattedError.message || 'Failed to fetch tips');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchRecentTips = useCallback(async (username: string) => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const [senders, amounts, messages, timestamps] = await contract.getRecentTips(username);
      
      const formattedTips: Tip[] = [];
      for (let i = 0; i < senders.length; i++) {
        formattedTips.push({
          sender: senders[i],
          amount: parseFloat(ethers.formatEther(amounts[i])),
          message: messages[i],
          timestamp: Number(timestamps[i]),
        });
      }
      
      setTips(formattedTips);
      
      // Update pagination state
      offsetRef.current = formattedTips.length;
      
      // Check if there are more tips to load
      const tipCount = await getTipCount(username);
      totalTipsRef.current = tipCount;
      setHasMoreTips(offsetRef.current < tipCount);
      
    } catch (err: any) {
      console.error('Error fetching recent tips:', err);
      const formattedError = formatContractError(err);
      setError(formattedError.message || 'Failed to fetch recent tips');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTip = useCallback(async (username: string, amount: string, message: string): Promise<boolean> => {
    if (!username) {
      toast.error('Username is required');
      return false;
    }
    
    // Validate tip amount
    if (!amount || parseFloat(amount) < MIN_TIP_AMOUNT) {
      toast.error(`Tip amount must be at least ${MIN_TIP_AMOUNT} MON`);
      return false;
    }
    
    // Validate message
    if (message && !isValidTipMessage(message)) {
      toast.error('Message is too long');
      return false;
    }
    
    try {
      const contract = await getContract();
      const amountWei = ethers.parseEther(amount);
      
      // Show loading toast
      const loadingToast = toast.loading('Sending tip...');
      
      // Send transaction
      const tx = await contract.sendTip(username, message, { value: amountWei });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (receipt.status === 1) {
        toast.success(`Tip of ${amount} MON sent successfully!`);
        return true;
      } else {
        toast.error('Transaction failed');
        return false;
      }
    } catch (err: any) {
      console.error('Error sending tip:', err);
      const formattedError = formatContractError(err);
      
      if (formattedError.code === 4001) {
        toast.error('Transaction rejected');
      } else if (formattedError.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for this transaction');
      } else {
        toast.error(formattedError.message || 'Error sending tip');
      }
      
      return false;
    }
  }, []);

  const withdrawFailedTips = useCallback(async (): Promise<boolean> => {
    try {
      const contract = await getContract();
      
      // Show loading toast
      const loadingToast = toast.loading('Withdrawing failed tips...');
      
      // Send transaction
      const tx = await contract.withdrawFailedTips();
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (receipt.status === 1) {
        // Look for the FailedTipWithdrawn event to get the amount
        const failedTipEvent = receipt.logs.find(
          (log: any) => log.fragment?.name === 'FailedTipWithdrawn'
        );
        
        if (failedTipEvent && failedTipEvent.args) {
          const amount = ethers.formatEther(failedTipEvent.args[1]);
          toast.success(`Withdrew ${amount} MON from failed tips`);
        } else {
          toast.success('Failed tips withdrawn successfully');
        }
        
        return true;
      } else {
        toast.error('Transaction failed');
        return false;
      }
    } catch (err: any) {
      console.error('Error withdrawing failed tips:', err);
      const formattedError = formatContractError(err);
      
      if (formattedError.code === 4001) {
        toast.error('Transaction rejected');
      } else if (formattedError.message.includes('No failed tips')) {
        toast('No failed tips to withdraw', { icon: 'ℹ️' });
      } else {
        toast.error(formattedError.message || 'Error withdrawing failed tips');
      }
      
      return false;
    }
  }, []);

  const getTipCount = useCallback(async (username: string): Promise<number> => {
    if (!username) return 0;
    
    try {
      const contract = await getContract();
      const count = await contract.getTipCount(username);
      return Number(count);
    } catch (err) {
      console.error('Error getting tip count:', err);
      return 0;
    }
  }, []);

  const loadMoreTips = useCallback(async (username: string): Promise<boolean> => {
    if (!username || !hasMoreTips || isLoading) return false;
    
    try {
      await fetchTips(username, offsetRef.current, limitRef.current);
      return true;
    } catch (err) {
      console.error('Error loading more tips:', err);
      return false;
    }
  }, [fetchTips, hasMoreTips, isLoading]);

  return {
    tips,
    isLoading,
    error,
    fetchTips,
    fetchRecentTips,
    sendTip,
    withdrawFailedTips,
    getTipCount,
    loadMoreTips,
    hasMoreTips,
  };
};