import Joi from 'joi';

const register = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const googleAuth = {
  body: Joi.object().keys({
    idToken: Joi.string().required(),
  }),
};

const refreshToken = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const addFcmToken = {
  body: Joi.object().keys({
    fcmToken: Joi.string().required(),
  }),
};

const removeFcmToken = {
  body: Joi.object().keys({
    fcmToken: Joi.string().required(),
  }),
};

export default {
  register,
  login,
  googleAuth,
  refreshToken,
  addFcmToken,
  removeFcmToken,
};
