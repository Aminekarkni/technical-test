import express from 'express';
import authentication from '../../authUtils/authentication';
import * as biddingController from '../../controllers/bidding.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/my-bids')
  .get(
    authentication,
    biddingController.getUserBids
  );

router
  .route('/cancel/:bidId')
  .delete(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    biddingController.cancelBid
  );

export default router; 