// src/hooks/useWeb3.ts
import { useContext } from 'react';
import { Web3Context } from '@/contexts/Web3ContextDefinition';
import type { Web3ContextState } from '@/contexts/Web3ContextDefinition';

export const useWeb3Context = (): Web3ContextState => {
  const context = useContext(Web3Context);
  
  if (!context) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  
  return context;
};