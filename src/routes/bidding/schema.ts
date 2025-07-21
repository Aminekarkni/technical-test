import Joi from 'joi';

const param = {
  params: Joi.object().keys({
    bidId: Joi.number().required(),
  }),
};

const placeBid = {
  body: Joi.object().keys({
    bidAmount: Joi.number().required().min(0.01),
    note: Joi.string().optional(),
  }),
};

export default {
  param,
  placeBid,
}; 