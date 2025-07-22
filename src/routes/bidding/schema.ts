import Joi from 'joi';

const param = {
  params: Joi.object().keys({
    bidId: Joi.number().required(),
  }),
};

const productParam = {
  params: Joi.object().keys({
    productId: Joi.number().required(),
  }),
};

const placeBid = {
  body: Joi.object().keys({
    productId: Joi.number().required(),
    bidAmount: Joi.number().required().min(0.01),
    note: Joi.string().optional().max(500),
  }),
};

export default {
  param,
  productParam,
  placeBid,
}; 