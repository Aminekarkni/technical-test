import Joi from 'joi';

const param = Joi.object().keys({
  auctionId: Joi.number().required(),
});

export default {
  param,
}; 