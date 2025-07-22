import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Role from '../database/models/Role';
import Category from '../database/models/Category';
import Product from '../database/models/Product';
import Bid from '../database/models/Bid';
import Order from '../database/models/Order';
import OrderItem from '../database/models/OrderItem';
import Keystore from '../database/models/Keystore';
import { AuctionProcessorService } from '../services/cron/auctionProcessor.service';

describe('Complete Auction Flow E2E Tests - Login Without Registration', () => {
  let testUser: any;
  let testRole: any;
  let testCategory: any;
  let authToken: string;

  beforeEach(async () => {
    // Create test role
    [testRole] = await Role.findOrCreate({
      where: { code: 'user' },
      defaults: {
        name: 'User',
        code: 'user',
        description: 'Regular user',
      },
    });

    // Create test user (simulating existing user login without registration)
    [testUser] = await User.findOrCreate({
      where: { email: 'existinguser@example.com' },
      defaults: {
        firstName: 'Existing',
        lastName: 'User',
        email: 'existinguser@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        verified: true,
        emailIsVerified: true,
      },
    });

    await testUser.$add('roles', testRole);

    // Create test category
    [testCategory] = await Category.findOrCreate({
      where: { name: 'Complete Flow Category' },
      defaults: {
        name: 'Complete Flow Category',
        description: 'Test category for complete flow tests',
        image: 'https://example.com/category.jpg',
      },
    });
  });

  describe('Complete Auction Flow with Existing User', () => {
    it('should complete full auction flow: login -> create auction -> place bid -> auction ends -> order created -> payment ready', async () => {
      // Step 1: Login with existing user (no registration needed)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existinguser@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.tokens).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe('existinguser@example.com');
      expect(loginResponse.body.data.user.firstName).toBe('Existing');
      expect(loginResponse.body.data.user.lastName).toBe('User');

      // Extract token for subsequent requests
      authToken = loginResponse.body.data.tokens.accessToken;

      // Step 2: Create an auction that ends in 2 minutes
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 2);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Complete Flow Test Auction',
          description: 'Auction for complete flow testing',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      expect(createAuctionResponse.status).toBe(200);
      expect(createAuctionResponse.body.data.id).toBeDefined();
      expect(createAuctionResponse.body.data.name).toBe('Complete Flow Test Auction');
      expect(createAuctionResponse.body.data.type).toBe('auction');
      expect(createAuctionResponse.body.data.isActive).toBe(true);

      const createdAuction = createAuctionResponse.body.data;

      // Step 3: Place a bid on the auction
      const placeBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: createdAuction.id,
          bidAmount: 150,
          note: 'Complete flow test bid',
        });

      expect(placeBidResponse.status).toBe(200);
      expect(placeBidResponse.body.data.bid.id).toBeDefined();
      expect(placeBidResponse.body.data.isWinningBid).toBe(true);
      expect(Number(placeBidResponse.body.data.bid.bidAmount)).toBeCloseTo(150);

      // Step 4: Verify bid was placed correctly
      const getBidsResponse = await request(app)
        .get(`/api/bidding/product/${createdAuction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getBidsResponse.status).toBe(200);
      expect(getBidsResponse.body.data.bids).toHaveLength(1);
      expect(Number(getBidsResponse.body.data.bids[0].bidAmount)).toBeCloseTo(150);
      expect(getBidsResponse.body.data.bids[0].isWinningBid).toBe(true);

      // Step 5: Check auction status (should be active)
      const auctionStatusResponse = await request(app)
        .get(`/api/auctions/${createdAuction.id}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auctionStatusResponse.status).toBe(200);
      expect(auctionStatusResponse.body.data.isEnded).toBe(false);
      expect(auctionStatusResponse.body.data.isActive).toBe(true);
      expect(auctionStatusResponse.body.data.hasWinner).toBe(false);

      // Step 6: Wait for auction to end (simulate by updating end time to past)
      await Product.update(
        { auctionEndTime: new Date(Date.now() - 60000) }, // 1 minute ago
        { where: { id: createdAuction.id } }
      );

      // Step 7: Process ended auctions
      const processAuctionsResponse = await request(app)
        .post('/api/auctions/process')
        .set('Authorization', `Bearer ${authToken}`);

      expect(processAuctionsResponse.status).toBe(200);
      expect(processAuctionsResponse.body.data.processed).toBeGreaterThan(0);

      // Step 8: Check auction status after processing (should be ended with winner)
      const finalAuctionStatusResponse = await request(app)
        .get(`/api/auctions/${createdAuction.id}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalAuctionStatusResponse.status).toBe(200);
      expect(finalAuctionStatusResponse.body.data.isEnded).toBe(true);
      expect(finalAuctionStatusResponse.body.data.isActive).toBe(false);
      expect(finalAuctionStatusResponse.body.data.hasWinner).toBe(true);

      // Step 9: Check that order was created
      const auctionOrdersResponse = await request(app)
        .get(`/api/auctions/${createdAuction.id}/orders`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auctionOrdersResponse.status).toBe(200);
      expect(auctionOrdersResponse.body.data.totalOrders).toBe(1);
      expect(auctionOrdersResponse.body.data.orders).toHaveLength(1);

      const createdOrder = auctionOrdersResponse.body.data.orders[0];

      // Step 10: Verify order details
      expect(createdOrder.orderType).toBe('auction');
      expect(createdOrder.status).toBe('pending');
      expect(createdOrder.paymentStatus).toBe('pending_payment');
      expect(Number(createdOrder.totalAmount)).toBeCloseTo(150);
      expect(createdOrder.userId).toBe(testUser.id);
      expect(createdOrder.orderNumber).toMatch(/^AUCTION-/);
      expect(createdOrder.firstName).toBe('Existing');
      expect(createdOrder.lastName).toBe('User');
      expect(createdOrder.email).toBe('existinguser@example.com');

      // Step 11: Verify order item details
      expect(createdOrder.items).toHaveLength(1);
      const orderItem = createdOrder.items[0];
      expect(orderItem.productId).toBe(createdAuction.id);
      expect(orderItem.productName).toBe('Complete Flow Test Auction');
      expect(orderItem.quantity).toBe(1);
      expect(Number(orderItem.unitPrice)).toBeCloseTo(150);
      expect(Number(orderItem.totalPrice)).toBeCloseTo(150);

      // Step 12: Verify order note contains auction name
      expect(createdOrder.note).toContain('Complete Flow Test Auction');

      // Step 13: Check that the auction is now inactive in database
      const updatedAuction = await Product.findByPk(createdAuction.id);
      expect(updatedAuction).toBeDefined();
      expect(updatedAuction!.isActive).toBe(false);

      // Step 14: Verify winning bid is marked correctly
      const winningBid = await Bid.findOne({
        where: { productId: createdAuction.id, isWinningBid: true }
      });
      expect(winningBid).toBeDefined();
      expect(Number(winningBid!.bidAmount)).toBeCloseTo(150);
      expect(winningBid!.userId).toBe(testUser.id);

      // Step 15: Verify order item contains product data
      expect(orderItem.productData).toBeDefined();
      expect(orderItem.productData.id).toBe(createdAuction.id);
      expect(orderItem.productData.name).toBe('Complete Flow Test Auction');
      expect(orderItem.productData.type).toBe('auction');
      expect(orderItem.productData.winningBidId).toBeDefined();

      console.log('✅ Complete auction flow test passed successfully!');
      console.log(`📦 Order created: ${createdOrder.orderNumber}`);
      console.log(`💰 Total amount: $${createdOrder.totalAmount}`);
      console.log(`👤 Winner: ${createdOrder.firstName} ${createdOrder.lastName}`);
      console.log(`📧 Email: ${createdOrder.email}`);
      console.log(`💳 Payment status: ${createdOrder.paymentStatus}`);
    }, 60000); // 60 second timeout for this comprehensive test

    it('should handle multiple users bidding on same auction', async () => {
      // Login first user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existinguser@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.data.tokens.accessToken;

      // Create second user
      const secondUser = await User.create({
        firstName: 'Second',
        lastName: 'Bidder',
        email: 'secondbidder@example.com',
        password: 'password123',
        phoneNumber: '9876543210',
        verified: true,
        emailIsVerified: true,
      });

      await secondUser.$add('roles', testRole);

      // Login second user
      const secondLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'secondbidder@example.com',
          password: 'password123',
        });

      const secondUserToken = secondLoginResponse.body.data.tokens.accessToken;

      // Create auction
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 1);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Multi-User Auction',
          description: 'Auction with multiple bidders',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      const auction = createAuctionResponse.body.data;

      // First user places bid
      const firstBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: auction.id,
          bidAmount: 150,
          note: 'First user bid',
        });

      expect(firstBidResponse.status).toBe(200);
      expect(firstBidResponse.body.data.isWinningBid).toBe(true);

      // Second user places higher bid
      const secondBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          productId: auction.id,
          bidAmount: 200,
          note: 'Second user bid',
        });

      expect(secondBidResponse.status).toBe(200);
      expect(secondBidResponse.body.data.isWinningBid).toBe(true);

      // First user tries to place lower bid (should fail)
      const lowerBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: auction.id,
          bidAmount: 180,
          note: 'Lower bid attempt',
        });

      expect(lowerBidResponse.status).toBe(400);
      expect(lowerBidResponse.body.message).toContain('Bid must be higher');

      // End auction
      await Product.update(
        { auctionEndTime: new Date(Date.now() - 60000) },
        { where: { id: auction.id } }
      );

      // Process auction
      await request(app)
        .post('/api/auctions/process')
        .set('Authorization', `Bearer ${authToken}`);

      // Check that second user won
      const auctionOrdersResponse = await request(app)
        .get(`/api/auctions/${auction.id}/orders`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auctionOrdersResponse.body.data.orders[0].userId).toBe(secondUser.id);
      expect(auctionOrdersResponse.body.data.orders[0].totalAmount).toBe('200.00');
      expect(auctionOrdersResponse.body.data.orders[0].firstName).toBe('Second');
      expect(auctionOrdersResponse.body.data.orders[0].lastName).toBe('Bidder');
    }, 60000);

    it('should handle auction with no bids gracefully', async () => {
      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existinguser@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.data.tokens.accessToken;

      // Create auction
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 1);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'No Bids Auction',
          description: 'Auction with no bids',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      const auction = createAuctionResponse.body.data;

      // End auction without any bids
      await Product.update(
        { auctionEndTime: new Date(Date.now() - 60000) },
        { where: { id: auction.id } }
      );

      // Process auction
      const processResponse = await request(app)
        .post('/api/auctions/process')
        .set('Authorization', `Bearer ${authToken}`);

      expect(processResponse.status).toBe(200);

      // Check auction status
      const auctionStatusResponse = await request(app)
        .get(`/api/auctions/${auction.id}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auctionStatusResponse.body.data.isEnded).toBe(true);
      expect(auctionStatusResponse.body.data.hasWinner).toBe(false);

      // Check that no orders were created
      const auctionOrdersResponse = await request(app)
        .get(`/api/auctions/${auction.id}/orders`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auctionOrdersResponse.body.data.totalOrders).toBe(0);
    }, 60000);
  });

  describe('Authentication and Authorization Tests', () => {
    it('should require authentication for auction operations', async () => {
      // Try to create auction without authentication
      const createAuctionResponse = await request(app)
        .post('/api/products')
        .send({
          name: 'Unauthenticated Auction',
          description: 'Should fail',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: new Date(Date.now() + 60000).toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      expect(createAuctionResponse.status).toBe(401);

      // Try to place bid without authentication
      const placeBidResponse = await request(app)
        .post('/api/bidding/bid')
        .send({
          productId: 1,
          bidAmount: 150,
          note: 'Unauthenticated bid',
        });

      expect(placeBidResponse.status).toBe(401);

      // Try to get auction status without authentication
      const auctionStatusResponse = await request(app)
        .get('/api/auctions/1/status');

      // Should return 401 for authentication error or 404 for non-existent auction
      expect([401, 404]).toContain(auctionStatusResponse.status);
    });

    it('should validate login credentials correctly', async () => {
      // Try to login with wrong password
      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existinguser@example.com',
          password: 'wrongpassword',
        });

      expect(wrongPasswordResponse.status).toBe(400);
      expect(wrongPasswordResponse.body.message).toContain('Invalid credentials');

      // Try to login with non-existent email
      const nonExistentUserResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(nonExistentUserResponse.status).toBe(400);
      expect(nonExistentUserResponse.body.message).toContain('Invalid credentials');
    });
  });

  describe('Auction Validation Tests', () => {
    beforeEach(async () => {
      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existinguser@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should validate auction creation requirements', async () => {
      // Test missing required fields
      const invalidAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Auction',
          type: 'auction',
          // Missing required fields
        });

      expect(invalidAuctionResponse.status).toBe(400);

      // Test invalid auction end time (in the past)
      const pastEndTimeResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Past End Time Auction',
          description: 'Auction with past end time',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      expect(pastEndTimeResponse.status).toBe(400);
      expect(pastEndTimeResponse.body.message).toContain('Auction end time must be in the future');
    });

    it('should validate bid requirements', async () => {
      // Create auction
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 5);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Bid Validation Auction',
          description: 'Auction for bid validation tests',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      const auction = createAuctionResponse.body.data;

      // Test bid lower than starting price
      const lowBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: auction.id,
          bidAmount: 50, // Lower than starting price of 100
          note: 'Low bid',
        });

      expect(lowBidResponse.status).toBe(400);

      // Test bid on non-existent auction
      const invalidAuctionBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 99999,
          bidAmount: 150,
          note: 'Invalid auction',
        });

      expect(invalidAuctionBidResponse.status).toBe(404);
    });
  });
}); 