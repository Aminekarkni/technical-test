import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Role from '../database/models/Role';
import Order from '../database/models/Order';

describe('Payment Routes', () => {
  let testUser: any;
  let testCategory: any;
  let testProduct: any;
  let testOrder: any;
  let authToken: string;

  beforeEach(async () => {
    const testRole = await Role.create({
      name: 'User',
      code: 'user',
      description: 'Regular user',
    });

    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123', // Let the model hash it
      phoneNumber: '1234567890',
      verified: true,
      emailIsVerified: true,
    });

    await testUser.addRole(testRole);

    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Test category description',
    });

    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stockQuantity: 10,
      categoryId: testCategory.id,
      type: 'fixed_price',
    });

    // Create a test order for auction payment tests
    testOrder = await Order.create({
      userId: testUser.id,
      orderNumber: `TEST-ORDER-${Date.now()}`,
      orderType: 'auction',
      status: 'pending',
      paymentStatus: 'pending_payment',
      subtotal: 150,
      taxAmount: 0,
      shippingAmount: 0,
      totalAmount: 150,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      phoneNumber: testUser.phoneNumber,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    if (loginResponse.body.data && loginResponse.body.data.tokens) {
      authToken = loginResponse.body.data.tokens.accessToken;
    } else {
      console.error('Login response does not contain expected tokens structure');
      // Fallback: create token manually like in auth.test.ts
      const { generateKeys } = require('../helpers/utils/auth');
      const { createTokens } = require('../authUtils/authUtils');
      const keys = await generateKeys();
      const tokens = await createTokens(testUser, keys.privateKey);
      authToken = tokens.accessToken;
    }
  });

  describe('POST /api/payments/fixed-price-order', () => {
    it('should create fixed price order payment', async () => {
      const response = await request(app)
        .post('/api/payments/fixed-price-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
          deliveryType: 'DELIVERY',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.payment).toBeDefined();
    }, 60000); // Increase timeout to 60 seconds

    it('should fail with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/payments/fixed-price-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id,
          quantity: 20,
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/fixed-price-order')
        .send({
          productId: testProduct.id,
          quantity: 1,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/payments/auction-order', () => {
    let auctionProduct: any;

    beforeEach(async () => {
      auctionProduct = await Product.create({
        name: 'Auction Product',
        description: 'Auction description',
        type: 'auction',
        startingPrice: 100,
        currentHighestBid: 150,
        auctionEndTime: new Date(Date.now() - 86400000), // Ended
        categoryId: testCategory.id,
        isActive: true,
      });
    });

    it('should create auction order payment', async () => {
      const response = await request(app)
        .post('/api/payments/auction-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.payment).toBeDefined();
    }, 60000); // Increase timeout to 60 seconds

    it('should fail with non-existent order', async () => {
      const response = await request(app)
        .post('/api/payments/auction-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: 99999,
        });

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/auction-order')
        .send({
          orderId: testOrder.id,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/status/:invoiceId', () => {
    it('should get payment status', async () => {
      const response = await request(app)
        .get('/api/payments/status/12345');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should handle invalid invoice id', async () => {
      const response = await request(app)
        .get('/api/payments/status/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments/callback', () => {
    it('should process webhook callback', async () => {
      const response = await request(app)
        .post('/api/payments/callback')
        .send({
          InvoiceId: 12345,
          PaymentId: 'test-payment-id',
          PaymentStatus: 'PAID',
          TransactionId: 'test-transaction-id',
          TransactionDate: new Date().toISOString(),
          PaymentMethod: 'CARD',
          Amount: 100,
          Currency: 'USD',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should handle invalid webhook data', async () => {
      const response = await request(app)
        .post('/api/payments/callback')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments/refund/:invoiceId', () => {
    it('should process refund successfully', async () => {
      const response = await request(app)
        .post('/api/payments/refund/12345')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          reason: 'Customer request',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/refund/12345')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -50,
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/refund/12345')
        .send({
          amount: 50,
        });

      expect(response.status).toBe(401);
    });
  });
}); 