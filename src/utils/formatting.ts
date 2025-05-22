/**
 * Formats a timestamp to a human-readable date string
 */
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  /**
   * Formats a timestamp to a human-readable date and time string
   */
  export const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  /**
   * Returns a relative time string (e.g., "2 hours ago" or "in 3 days")
   */
  export const timeAgo = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - timestamp;
    
    if (secondsAgo < 0) {
      return 'in the future';
    }
    
    if (secondsAgo < 60) {
      return `${secondsAgo} second${secondsAgo === 1 ? '' : 's'} ago`;
    }
    
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
      return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    }
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
    }
    
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 30) {
      return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    }
    
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) {
      return `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`;
    }
    
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
  };
  
  /**
   * Formats a number to a string with commas
   */
  export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  /**
   * Formats an amount of MON with specified decimal places
   */
  export const formatMON = (value: number, decimals = 4): string => {
    return `${value.toFixed(decimals)} MON`;
  };