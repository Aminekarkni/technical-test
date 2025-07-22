import express from 'express';
import auth from './auth/router';
import products from './product/router';
import payments from './payment/router';
import bidding from './bidding/router';
import orders from './order/router';
import auctions from './auction/router';
import health from './health/router';

const router = express.Router();

router.use('/auth', auth);
router.use('/products', products);
router.use('/payments', payments);
router.use('/bidding', bidding);
router.use('/orders', orders);
router.use('/auctions', auctions);
router.use('/', health);

export default router;

