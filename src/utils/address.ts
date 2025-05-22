/**
 * Shortens an Ethereum address to a more readable format
 * Example: 0x1234...abcd
 */
export const shortenAddress = (address: string, chars = 4): string => {
    if (!address) return '';
    
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
  };