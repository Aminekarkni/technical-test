import express from 'express';
import authentication from '../../authUtils/authentication';
import * as biddingController from '../../controllers/bidding.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/bid')
  .post(
    authentication,
    validator(schema.placeBid, ValidationSource.BODY),
    biddingController.placeBid
  );

router
  .route('/product/:productId')
  .get(
    authentication,
    validator(schema.productParam, ValidationSource.PARAM),
    biddingController.getProductBids
  );

router
  .route('/my-bids')
  .get(
    authentication,
    biddingController.getUserBids
  );

router
  .route('/winning/:productId')
  .get(
    authentication,
    validator(schema.productParam, ValidationSource.PARAM),
    biddingController.getWinningBid
  );

router
  .route('/cancel/:bidId')
  .delete(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    biddingController.cancelBid
  );

export default router; 