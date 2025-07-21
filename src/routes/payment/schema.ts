import Joi from 'joi';

const param = {
  params: Joi.object().keys({
    invoiceId: Joi.number().required(),
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

const createAuctionOrder = {
  body: Joi.object().keys({
    orderId: Joi.number().required(),
  }),
};

const refund = {
  body: Joi.object().keys({
    amount: Joi.number().required(),
    reason: Joi.string().required(),
  }),
};

export default {
  param,
  createFixedPriceOrder,
  createAuctionOrder,
  refund,
};
