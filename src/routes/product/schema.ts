import Joi from 'joi';

const param = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid('fixed_price', 'auction').required(),
    price: Joi.number().when('type', {
      is: 'fixed_price',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    stockQuantity: Joi.number().when('type', {
      is: 'fixed_price',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    startingPrice: Joi.number().when('type', {
      is: 'auction',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    auctionEndTime: Joi.date().when('type', {
      is: 'auction',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    categoryId: Joi.number().required(),
    images: Joi.array().items(Joi.string()).optional(),
    coverImage: Joi.string().optional(),
    isRecommended: Joi.boolean().optional(),
    isTopSeller: Joi.boolean().optional(),
  }),
};

const update = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    price: Joi.number().optional(),
    stockQuantity: Joi.number().optional(),
    startingPrice: Joi.number().optional(),
    auctionEndTime: Joi.date().optional(),
    categoryId: Joi.number().optional(),
    images: Joi.array().items(Joi.string()).optional(),
    coverImage: Joi.string().optional(),
    isRecommended: Joi.boolean().optional(),
    isTopSeller: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export default {
  param,
  create,
  update,
};
