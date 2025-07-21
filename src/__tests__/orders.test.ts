import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Role from '../database/models/Role';
import Order from '../database/models/Order';

describe('Order Routes', () => {
  let testUser: any;
  let testCategory: any;
  let testProduct: any;
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

    await testUser.$add('roles', testRole);

    testCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic products',
      isActive: true,
    });

    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      type: 'fixed_price',
      price: 100,
      stockQuantity: 10,
      categoryId: testCategory.id,
      isActive: true,
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
      const Keystore = require('../database/models/Keystore').default;
      
      const { accessTokenKey, refreshTokenKey } = generateKeys();
      await Keystore.create({
        userId: testUser.id,
        accessTokenKey,
        refreshTokenKey,
        isActive: true,
      });
      
      const tokens = await createTokens(testUser, accessTokenKey, refreshTokenKey);
      authToken = tokens.accessToken;
    }
  });

  describe('POST /api/orders', () => {
    it('should create fixed price order successfully', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
          deliveryType: 'DELIVERY',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.payment).toBeDefined();
    });

    it('should fail with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id,
          quantity: 20,
        });

      expect(response.status).toBe(400);
    });

    it('should fail with auction product', async () => {
      const auctionProduct = await Product.create({
        name: 'Auction Product',
        description: 'Auction description',
        type: 'auction',
        startingPrice: 100,
        currentHighestBid: 100,
        auctionEndTime: new Date(Date.now() + 86400000),
        categoryId: testCategory.id,
        isActive: true,
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: auctionProduct.id,
          quantity: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          productId: testProduct.id,
          quantity: 1,
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 99999,
          quantity: -1,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      await Order.create({
        userId: testUser.id,
        orderNumber: 'ORDER-123',
        orderType: 'fixed_price',
        status: 'pending',
        paymentStatus: 'pending_payment',
        subtotal: 100,
        taxAmount: 0,
        shippingAmount: 10,
        totalAmount: 110,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber,
      });
    });

    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.orders.length).toBe(1);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders.length).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        orderNumber: 'ORDER-123',
        orderType: 'fixed_price',
        status: 'pending',
        paymentStatus: 'pending_payment',
        subtotal: 100,
        taxAmount: 0,
        shippingAmount: 10,
        totalAmount: 110,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber,
      });
    });

    it('should get order by id', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testOrder.id);
    });

    it('should fail with non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        orderNumber: 'ORDER-123',
        orderType: 'fixed_price',
        status: 'pending',
        paymentStatus: 'pending_payment',
        subtotal: 100,
        taxAmount: 0,
        shippingAmount: 10,
        totalAmount: 110,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber,
      });
    });

    it('should cancel order successfully', async () => {
      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should fail with non-existent order', async () => {
      const response = await request(app)
        .delete('/api/orders/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 