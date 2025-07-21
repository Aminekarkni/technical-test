import express from 'express';
import authentication from '../../authUtils/authentication';
import * as authController from '../../controllers/auth.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/register')
  .post(
    validator(schema.register),
    authController.register
  );

router
  .route('/login')
  .post(
    validator(schema.login),
    authController.login
  );

router
  .route('/login/google')
  .post(
    validator(schema.googleAuth),
    authController.googleAuth
  );

router
  .route('/logout')
  .post(
    authentication,
    authController.logout
  );

router
  .route('/refresh-token')
  .post(
    validator(schema.refreshToken),
    authController.refreshToken
  );

router
  .route('/fcm-token')
  .post(
    authentication,
    validator(schema.addFcmToken),
    authController.addFcmToken
  )
  .delete(
    authentication,
    validator(schema.removeFcmToken),
    authController.removeFcmToken
  );

export default router;
