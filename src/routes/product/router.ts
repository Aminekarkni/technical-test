import express from 'express';
import authentication from '../../authUtils/authentication';
import * as productController from '../../controllers/product.controller';
import * as biddingController from '../../controllers/bidding.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';
import biddingSchema from '../bidding/schema';

const router = express.Router();

router
  .route('/')
  .post(
    authentication,
    validator(schema.create),
    productController.createProduct
  )
  .get(productController.getAllProducts);

router
  .route('/:id')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    productController.getProductById
  )
  .put(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    validator(schema.update),
    productController.updateProduct
  )
  .delete(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    productController.deleteProduct
  );

// Bidding endpoints
router
  .route('/:id/bids')
  .post(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    validator(biddingSchema.placeBid),
    biddingController.placeBid
  )
  .get(
    validator(schema.param, ValidationSource.PARAM),
    biddingController.getProductBids
  );

router
  .route('/:id/bids/winning')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    biddingController.getWinningBid
  );

router
  .route('/:id/bids/stats')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    biddingController.getAuctionStats
  );

export default router;
