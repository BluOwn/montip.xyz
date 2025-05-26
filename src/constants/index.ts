// Contract Address - Monad Testnet (Updated)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x7f003073a0b7763Fde2FdFf3E37Aa422EAb231d0";

// Monad Network Configuration
export const CHAIN_CONFIG = {
  chainId: "0x279f", // 10143 in hex
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

// Social Media Links
export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/Oprimedev",
  github: "https://github.com/bluown/montip.xyz",
};

// Contract Limits & Restrictions (Updated for optimized contract)
export const MIN_TIP_AMOUNT = 0.01; // 0.01 ETH as per optimized contract
export const MAX_USERNAME_LENGTH = 32; // Updated from contract constants
export const MAX_DESCRIPTION_LENGTH = 256; // Updated from contract constants
export const MAX_TIP_MESSAGE_LENGTH = 280; // Updated from contract constants
export const PLATFORM_FEE_PERCENT = 1; // 1% (100 basis points / 10000)

// Application Constants
export const APP_NAME = "MonTip";
export const APP_DESCRIPTION = "A decentralized tipping platform on Monad Network";

// Leaderboard Constants
export const LEADERBOARD_PAGE_SIZE = 10;

// Web3 Constants
export const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
export const LOCAL_STORAGE_PREFIX = "montip_";

// Contract-specific constants (from the optimized contract)
export const BASIS_POINTS_DENOMINATOR = 10000;
export const PLATFORM_FEE_BASIS_POINTS = 100; // 1%