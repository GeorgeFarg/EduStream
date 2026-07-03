import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit alphanumeric code.
 * Excludes characters that look similar (e.g., 'O' and '0').
 */
export const generateClassCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, 1, O, 0
  const length = 6;
  const randomBytes = crypto.randomBytes(length);
  const result = new Array(length);
  
  for (let i = 0; i < length; i++) {
    result[i] = chars[randomBytes[i] % chars.length];
  }
  
  return result.join('');
};
