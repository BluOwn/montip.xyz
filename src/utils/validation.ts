export const normalizeUsername = (username: string): string => {
  return username.toLowerCase();
};

export const isValidUsername = (username: string): boolean => {
  const normalized = normalizeUsername(username);
  
  if (normalized.length === 0 || normalized.length > 32) {
    return false;
  }
  
  const regex = /^[a-z0-9_\-.]+$/;
  return regex.test(normalized);
};

export const isValidWebsite = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

export const isValidTwitterHandle = (handle: string): boolean => {
  if (handle.startsWith('@')) {
    handle = handle.substring(1);
  }
  
  const regex = /^[a-zA-Z0-9_]{1,15}$/;
  return regex.test(handle);
};

export const isValidDescription = (description: string, maxLength = 256): boolean => {
  return description.length <= maxLength;
};

export const isValidTipMessage = (message: string, maxLength = 280): boolean => {
  return message.length <= maxLength;
};