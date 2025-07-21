import { OAuth2Client } from 'google-auth-library';
import User from '../../database/models/User';
import Role from '../../database/models/Role';
import Keystore from '../../database/models/Keystore';
import { BadRequestError, NotFoundError } from '../../core/ApiError';
import { generateKeys } from '../../helpers/utils/auth';
import { createTokens } from '../../authUtils/authUtils';
import Logger from '../../core/Logger';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new BadRequestError('Invalid Google token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
  } catch (error) {
    Logger.error('Error verifying Google token:', error);
    throw new BadRequestError('Invalid Google token');
  }
};

export const googleAuthProvider = async (idToken: string) => {
  try {
    const googleData = await verifyGoogleToken(idToken);

    let user = await User.findOne({
      where: { email: googleData.email },
    });
    if (!user) {
      const userRole = await Role.findOne({ where: { code: 'user' } });
      if (!userRole) {
        throw new NotFoundError('User role not found');
      }

      user = await User.create({
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        email: googleData.email,
        avatar: googleData.picture,
        googleId: googleData.googleId,
        verified: true,
        emailIsVerified: true,
      });

      await user.$add('roles', userRole);
    } else {
      await user.update({
        googleId: googleData.googleId,
        avatar: googleData.picture,
        verified: true,
        emailIsVerified: true,
      });
    }

    const { accessTokenKey, refreshTokenKey } = generateKeys();
    await Keystore.create({
      userId: user.id,
      accessTokenKey,
      refreshTokenKey,
      isActive: true,
    });

    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        verified: user.verified,
        emailIsVerified: user.emailIsVerified,
      },
      tokens,
    };
  } catch (error) {
    Logger.error('Error in Google auth provider:', error);
    throw error;
  }
}; 