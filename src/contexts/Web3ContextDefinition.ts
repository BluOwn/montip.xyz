// src/contexts/Web3ContextDefinition.ts

import { createContext } from 'react';

export interface Web3ContextState {
  account: string | null;
  balance: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: () => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

export const Web3Context = createContext<Web3ContextState>({
  account: null,
  balance: null,
  isConnected: false,
  isInitializing: true,
  isCorrectNetwork: false,
  connect: async () => false,
  disconnect: () => {},
  switchNetwork: async () => false,
  refreshBalance: async () => {},
});