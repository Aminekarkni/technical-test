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

describe('Complete Auction Flow E2E Tests', () => {
  let testUser: any;
  let testRole: any;
  let testCategory: any;
  let authToken: string;
  let createdAuction: any;
  let createdBid: any;
  let createdOrder: any;

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

    // Create test user
    [testUser] = await User.findOrCreate({
      where: { email: 'auctiontest@example.com' },
      defaults: {
        firstName: 'Auction',
        lastName: 'Tester',
        email: 'auctiontest@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        verified: true,
        emailIsVerified: true,
      },
    });

    // Add role to user
    await testUser.$add('roles', testRole);

    // Create test category
    [testCategory] = await Category.findOrCreate({
      where: { name: 'Test Category' },
      defaults: {
        name: 'Test Category',
        description: 'Test category for auction tests',
        image: 'https://example.com/category.jpg',
      },
    });

    // Generate auth token
    const { generateKeys } = require('../helpers/utils/auth');
    const { createTokens } = require('../authUtils/authUtils');
    const { accessTokenKey, refreshTokenKey } = generateKeys();
    
    await Keystore.create({
      userId: testUser.id,
      accessTokenKey,
      refreshTokenKey,
      isActive: true,
    });
    
    const tokens = await createTokens(testUser, accessTokenKey, refreshTokenKey);
    authToken = tokens.accessToken;
  });

  describe('Complete Auction Flow', () => {
    it('should complete full auction flow: login -> create auction -> place bid -> auction ends -> order created -> payment ready', async () => {
      // Step 1: Login (verify token works)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auctiontest@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.tokens).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe('auctiontest@example.com');

      // Step 2: Create an auction that ends in 2 minutes
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 2);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Auction',
          description: 'Auction for E2E testing',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      expect(createAuctionResponse.status).toBe(200);
      expect(createAuctionResponse.body.data.id).toBeDefined();
      createdAuction = createAuctionResponse.body.data;

      // Step 3: Place a bid on the auction
      const placeBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: createdAuction.id,
          bidAmount: 150,
          note: 'E2E test bid',
        });

      expect(placeBidResponse.status).toBe(200);
      expect(placeBidResponse.body.data.bid.id).toBeDefined();
      expect(placeBidResponse.body.data.isWinningBid).toBe(true);
      createdBid = placeBidResponse.body.data.bid;

      // Step 4: Verify bid was placed correctly
      const getBidsResponse = await request(app)
        .get(`/api/bidding/product/${createdAuction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getBidsResponse.status).toBe(200);
      expect(getBidsResponse.body.data.bids).toHaveLength(1);
      expect(Number(getBidsResponse.body.data.bids[0].bidAmount)).toBeCloseTo(150);

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

      createdOrder = auctionOrdersResponse.body.data.orders[0];

      // Step 10: Verify order details
      expect(createdOrder.orderType).toBe('auction');
      expect(createdOrder.status).toBe('pending');
      expect(createdOrder.paymentStatus).toBe('pending_payment');
      expect(createdOrder.totalAmount).toBe('150.00');
      expect(createdOrder.userId).toBe(testUser.id);
      expect(createdOrder.orderNumber).toMatch(/^AUCTION-/);

      // Step 11: Verify order item details
      expect(createdOrder.items).toHaveLength(1);
      const orderItem = createdOrder.items[0];
      expect(orderItem.productId).toBe(createdAuction.id);
      expect(orderItem.productName).toBe('E2E Test Auction');
      expect(orderItem.quantity).toBe(1);
      expect(orderItem.unitPrice).toBe('150.00');
      expect(orderItem.totalPrice).toBe('150.00');

      // Step 12: Verify order note contains auction name
      expect(createdOrder.note).toContain('E2E Test Auction');

      // Step 13: Check that the auction is now inactive in database
      const updatedAuction = await Product.findByPk(createdAuction.id);
      expect(updatedAuction).toBeDefined();
      expect(updatedAuction!.isActive).toBe(false);

      // Step 14: Verify winning bid is marked correctly
      const winningBid = await Bid.findOne({
        where: { productId: createdAuction.id, isWinningBid: true }
      });
      expect(winningBid).toBeDefined();
      expect(winningBid).toBeDefined();
      expect(Number(winningBid!.bidAmount)).toBeCloseTo(150);
      expect(winningBid!.userId).toBe(testUser.id);
    }, 60000); // 60 second timeout for this comprehensive test

    it('should handle multiple bids and select highest bidder', async () => {
      // Create auction
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + 1);

      const createAuctionResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Multi-Bid Auction',
          description: 'Auction with multiple bids',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: auctionEndTime.toISOString(),
          images: ['https://example.com/test.jpg'],
          coverImage: 'https://example.com/test-cover.jpg',
          categoryId: testCategory.id,
        });

      const auction = createAuctionResponse.body.data;

      // Create second user for bidding
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

      // Generate token for second user
      const { generateKeys } = require('../helpers/utils/auth');
      const { createTokens } = require('../authUtils/authUtils');
      const { accessTokenKey: key2, refreshTokenKey: refreshKey2 } = generateKeys();
      
      await Keystore.create({
        userId: secondUser.id,
        accessTokenKey: key2,
        refreshTokenKey: refreshKey2,
        isActive: true,
      });
      
      const tokens2 = await createTokens(secondUser, key2, refreshKey2);
      const secondUserToken = tokens2.accessToken;

      // First user places bid
      await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: auction.id,
          bidAmount: 150,
          note: 'First bid',
        });

      // Second user places higher bid
      const secondBidResponse = await request(app)
        .post('/api/bidding/bid')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          productId: auction.id,
          bidAmount: 200,
          note: 'Higher bid',
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
          note: 'Lower bid',
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
    }, 60000);

    it('should handle auction with no bids gracefully', async () => {
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

      // Test bid without authentication
      const unauthenticatedBidResponse = await request(app)
        .post('/api/bidding/bid')
        .send({
          productId: auction.id,
          bidAmount: 150,
          note: 'Unauthenticated bid',
        });

      expect(unauthenticatedBidResponse.status).toBe(401);
    });
  });

  describe('Auction Processor Service Tests', () => {
    it('should process ended auctions correctly', async () => {
      // Create auction that ends immediately
      const auctionEndTime = new Date(Date.now() - 1000); // 1 second ago

      const auction = await Product.create({
        name: 'Processor Test Auction',
        description: 'Auction for processor testing',
        type: 'auction',
        startingPrice: 100,
        auctionEndTime,
        images: ['https://example.com/test.jpg'],
        coverImage: 'https://example.com/test-cover.jpg',
        categoryId: testCategory.id,
        isActive: true,
      });

      // Place winning bid
      await Bid.create({
        userId: testUser.id,
        productId: auction.id,
        bidAmount: 150,
        isWinningBid: true,
        note: 'Processor test bid',
      });

      // Process auctions
      const result = await AuctionProcessorService.processEndedAuctions();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.results).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      // Verify order was created
      const order = await Order.findOne({
        where: {
          orderType: 'auction',
          userId: testUser.id,
        },
      });

      expect(order).toBeDefined();
      expect(order).toBeDefined();
      expect(order!.status).toBe('pending');
      expect(order!.paymentStatus).toBe('pending_payment');
      expect(Number(order!.totalAmount)).toBeCloseTo(150);
    });

    it('should handle auction with no winning bid', async () => {
      // Create auction that ends immediately
      const auctionEndTime = new Date(Date.now() - 1000);

      const auction = await Product.create({
        name: 'No Winner Auction',
        description: 'Auction with no winner',
        type: 'auction',
        startingPrice: 100,
        auctionEndTime,
        images: ['https://example.com/test.jpg'],
        coverImage: 'https://example.com/test-cover.jpg',
        categoryId: testCategory.id,
        isActive: true,
      });

      // Verify auction is ended
      expect(auction.isAuctionEnded).toBe(true);

      // Process auctions (no bids placed)
      const result = await AuctionProcessorService.processEndedAuctions();

      // Since there are no bids, the auction should be processed but no order created
      expect(result.processed).toBeGreaterThan(0);
      expect(result.results).toHaveLength(0); // No results because no winning bid
      expect(result.errors).toHaveLength(0);

      // Verify auction is now inactive
      const updatedAuction = await Product.findByPk(auction.id);
      expect(updatedAuction).toBeDefined();
      expect(updatedAuction!.isActive).toBe(false);

      // Verify no order was created
      const order = await Order.findOne({
        where: {
          orderType: 'auction',
        },
      });

      expect(order).toBeNull();
    });
  });
}); 