import express from 'express';
import authentication from '../../authUtils/authentication';
import * as orderController from '../../controllers/order.controller';
import validator, { ValidationSource } from '../../helpers/utils/validator';
import schema from './schema';

const router = express.Router();

router
  .route('/')
  .post(
    authentication,
    validator(schema.createFixedPriceOrder),
    orderController.createFixedPriceOrder
  )
  .get(
    authentication,
    orderController.getUserOrders
  );

router
  .route('/:id')
  .get(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    orderController.getOrderById
  )
  .delete(
    authentication,
    validator(schema.param, ValidationSource.PARAM),
    orderController.cancelOrder
  );

export default router; 