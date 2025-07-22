import express from 'express';
import authentication from '../../authUtils/authentication';
import * as productController from '../../controllers/product.controller';
import * as biddingController from '../../controllers/bidding.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';
import biddingSchema from '../bidding/schema';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const router = express.Router();

// Product-specific bidding schema (without productId in body)
const productBidSchema = {
  body: Joi.object().keys({
    bidAmount: Joi.number().required().min(0.01),
    note: Joi.string().optional().max(500),
  }),
};

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
    validator(productBidSchema, ValidationSource.BODY),
    (req: Request, res: Response, next: NextFunction) => {
      // Add productId to body from params for consistency
      req.body.productId = Number(req.params.id);
      biddingController.placeBid(req, res, next);
    }
  )
  .get(
    validator(schema.param, ValidationSource.PARAM),
    (req: Request, res: Response, next: NextFunction) => {
      // Add productId to params for consistency
      req.params.productId = req.params.id;
      biddingController.getProductBids(req, res, next);
    }
  );

router
  .route('/:id/bids/winning')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    (req: Request, res: Response, next: NextFunction) => {
      // Add productId to params for consistency
      req.params.productId = req.params.id;
      biddingController.getWinningBid(req, res, next);
    }
  );

router
  .route('/:id/bids/stats')
  .get(
    validator(schema.param, ValidationSource.PARAM),
    (req: Request, res: Response, next: NextFunction) => {
      // Add productId to params for consistency
      req.params.productId = req.params.id;
      biddingController.getAuctionStats(req, res, next);
    }
  );

export default router;
