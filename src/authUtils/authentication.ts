import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../database/models/User';
import Keystore from '../database/models/Keystore';
import { AuthFailureError } from '../core/ApiError';

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AuthFailureError('Access token required');
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    const keystore = await Keystore.findOne({
      where: { accessTokenKey: payload.prm, isActive: true },
      include: [{ 
        model: User, 
        include: [{ 
          model: require('../database/models/Role').default,
          through: { attributes: [] }
        }] 
      }],
    });

    if (!keystore || !keystore.user) {
      throw new AuthFailureError('Invalid access token');
    }

    (req as any).user = keystore.user;
    (req as any).keystore = keystore;
    next();
  } catch (error) {
    next(new AuthFailureError('Invalid access token'));
  }
}; 