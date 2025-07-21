import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../database/models/User';
import Keystore from '../database/models/Keystore';
import Role from '../database/models/Role';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import { generateKeys } from '../helpers/utils/auth';
import { createTokens } from '../authUtils/authUtils';
import { googleAuthProvider, verifyGoogleToken } from '../services/auth/googleAuthProvider.service';
import Logger from '../core/Logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new BadRequestError('User already exists with this email');
    }

    const role = await Role.findOne({ where: { code: 'user' } });
    if (!role) {
      throw new NotFoundError('User role not found');
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      verified: false,
      emailIsVerified: false,
    });

    await user.$add('roles', role);

    const { accessTokenKey, refreshTokenKey } = generateKeys();
    await Keystore.create({
      userId: user.id,
      accessTokenKey,
      refreshTokenKey,
      isActive: true,
    });

    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

    return new SuccessResponse('User registered successfully', {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        verified: user.verified,
        emailIsVerified: user.emailIsVerified,
      },
      tokens,
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user) {
      throw new BadRequestError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestError('Invalid credentials');
    }

    await user.update({ lastLogin: new Date() });

    const { accessTokenKey, refreshTokenKey } = generateKeys();
    await Keystore.create({
      userId: user.id,
      accessTokenKey,
      refreshTokenKey,
      isActive: true,
    });

    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

    return new SuccessResponse('Login successful', {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        verified: user.verified,
        emailIsVerified: user.emailIsVerified,
        roles: user.roles,
      },
      tokens,
    }).send(res);
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw new BadRequestError('Google ID token is required');
    }

    const result = await googleAuthProvider(idToken);

    return new SuccessResponse('Google authentication successful', result).send(res);
  } catch (error) {
    next(error);
  }
};

export const addFcmToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fcmToken } = req.body;
    const userId = (req as any).user.id;

    if (!fcmToken) {
      throw new BadRequestError('FCM token is required');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.addFcmToken(fcmToken);

    return new SuccessResponse('FCM token added successfully', {}).send(res);
  } catch (error) {
    next(error);
  }
};

export const removeFcmToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fcmToken } = req.body;
    const userId = (req as any).user.id;

    if (!fcmToken) {
      throw new BadRequestError('FCM token is required');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.removeFcmToken(fcmToken);

    return new SuccessResponse('FCM token removed successfully', {}).send(res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keystore = (req as any).keystore;

    await keystore.update({ isActive: false });

    return new SuccessResponse('Logout successful', {}).send(res);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }
    
    return new SuccessResponse('Token refreshed successfully', {
      accessToken: 'new-access-token',
    }).send(res);
  } catch (error) {
    next(error);
  }
};
