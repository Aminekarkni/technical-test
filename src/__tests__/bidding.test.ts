import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Role from '../database/models/Role';
import Bid from '../database/models/Bid';

describe('Bidding Routes', () => {
  let testUser: any;
  let testCategory: any;
  let testAuctionProduct: any;
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

    testAuctionProduct = await Product.create({
      name: 'Auction Product',
      description: 'Auction description',
      type: 'auction',
      startingPrice: 100,
      currentHighestBid: 120,
      auctionEndTime: new Date(Date.now() + 86400000),
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

  describe('POST /api/products/:id/bids', () => {
    it('should place bid successfully', async () => {
      const response = await request(app)
        .post(`/api/products/${testAuctionProduct.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bidAmount: 150,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.bid).toBeDefined();
      expect(response.body.data.bid.bidAmount).toBe(150);
    });

    it('should fail with bid lower than current highest', async () => {
      const response = await request(app)
        .post(`/api/products/${testAuctionProduct.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bidAmount: 50,
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testAuctionProduct.id}/bids`)
        .send({
          bidAmount: 150,
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid bid amount', async () => {
      const response = await request(app)
        .post(`/api/products/${testAuctionProduct.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bidAmount: -50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/products/:id/bids', () => {
    beforeEach(async () => {
      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 110,
      });

      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 120,
      });
    });

    it('should get all bids for product', async () => {
      const response = await request(app)
        .get(`/api/products/${testAuctionProduct.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.bids).toBeDefined();
      expect(response.body.data.bids.length).toBe(2);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999/bids');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/products/:id/bids/winning', () => {
    beforeEach(async () => {
      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 150,
      });
    });

    it('should get winning bid', async () => {
      const response = await request(app)
        .get(`/api/products/${testAuctionProduct.id}/bids/winning`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.winningBid).toBeDefined();
      if (response.body.data.winningBid) {
        expect(response.body.data.winningBid.bidAmount).toBe(150);
      }
    });

    it('should return null for product without winning bid', async () => {
      const response = await request(app)
        .get('/api/products/99999/bids/winning')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/products/:id/bids/stats', () => {
    beforeEach(async () => {
      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 110,
      });

      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 120,
      });
    });

    it('should get auction statistics', async () => {
      const response = await request(app)
        .get(`/api/products/${testAuctionProduct.id}/bids/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalBids).toBe(2);
      expect(response.body.data.highestBid).toBe(120);
    });
  });

  describe('GET /api/bidding/my-bids', () => {
    beforeEach(async () => {
      await Bid.create({
        userId: testUser.id,
        productId: testAuctionProduct.id,
        bidAmount: 150,
      });
    });

    it('should get user bids', async () => {
      const response = await request(app)
        .get('/api/bidding/my-bids')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.bids).toBeDefined();
      expect(response.body.data.bids.length).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/bidding/my-bids');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/bidding/cancel/:bidId', () => {
    it('should cancel bid successfully', async () => {
      // First, let's place a bid that we can cancel
      const bidResponse = await request(app)
        .post(`/api/products/${testAuctionProduct.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bidAmount: 200,
        });

      expect(bidResponse.status).toBe(200);
      const bidId = bidResponse.body.data.bid.id;

      const response = await request(app)
        .delete(`/api/bidding/cancel/${bidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should fail with non-existent bid', async () => {
      const response = await request(app)
        .delete('/api/bidding/cancel/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/bidding/cancel/123');

      expect(response.status).toBe(401);
    });
  });
}); 