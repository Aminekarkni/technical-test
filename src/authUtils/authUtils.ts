import jwt from 'jsonwebtoken';
import User from '../database/models/User';

export const createTokens = async (
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string
) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      prm: accessTokenKey,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      prm: refreshTokenKey,
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
  };
}; 