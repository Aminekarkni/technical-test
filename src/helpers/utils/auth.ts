import crypto from 'crypto';

export const generateKeys = () => {
  const accessTokenKey = crypto.randomBytes(32).toString('hex');
  const refreshTokenKey = crypto.randomBytes(32).toString('hex');
  return { accessTokenKey, refreshTokenKey };
}; 