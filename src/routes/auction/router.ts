import express from 'express';
import authentication from '../../authUtils/authentication';
import * as auctionController from '../../controllers/auction.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/process')
  .post(
    authentication,
    auctionController.processEndedAuctions
  );

router
  .route('/:auctionId/status')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    auctionController.getAuctionStatus
  );

router
  .route('/:auctionId/orders')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    auctionController.getAuctionOrders
  );

export default router; 