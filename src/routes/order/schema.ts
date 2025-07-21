import Joi from 'joi';

const param = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const createFixedPriceOrder = {
  body: Joi.object().keys({
    productId: Joi.number().required(),
    quantity: Joi.number().min(1).default(1),
    deliveryType: Joi.string().valid('DELIVERY', 'PICKUP').default('DELIVERY'),
    addressId: Joi.number().optional(),
  }),
};

export default {
  param,
  createFixedPriceOrder,
}; 