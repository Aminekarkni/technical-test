import express from 'express';
import authentication from '../../authUtils/authentication';
import * as paymentController from '../../controllers/payment.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/fixed-price-order')
  .post(
    authentication,
    validator(schema.createFixedPriceOrder),
    paymentController.createFixedPriceOrder
  );

router
  .route('/auction-order')
  .post(
    authentication,
    validator(schema.createAuctionOrder),
    paymentController.createAuctionOrder
  );

router
  .route('/status/:invoiceId')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    paymentController.getPaymentStatus
  );

router
  .route('/callback')
  .post(paymentController.paymentCallback);

router
  .route('/refund/:invoiceId')
  .post(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    validator(schema.refund),
    paymentController.refundPayment
  );

export default router;
