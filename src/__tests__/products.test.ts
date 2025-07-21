import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Role from '../database/models/Role';
import Keystore from '../database/models/Keystore';
import bcrypt from 'bcryptjs';

describe('Product Routes', () => {
  let testUser: any;
  let testCategory: any;
  let authToken: string;

  beforeEach(async () => {
    // Find or create the test role
    const [testRole] = await Role.findOrCreate({
      where: { code: 'user' },
      defaults: {
        name: 'User',
        code: 'user',
        description: 'Regular user',
      },
    });

    // Find or create the test user
    [testUser] = await User.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123', // Let the model hash it
        phoneNumber: '1234567890',
        verified: true,
        emailIsVerified: true,
      },
    });

    // Add role to user if not already added
    await testUser.$add('roles', testRole);

    // Find or create the test category
    [testCategory] = await Category.findOrCreate({
      where: { name: 'Electronics' },
      defaults: {
        name: 'Electronics',
        description: 'Electronic products',
        isActive: true,
      },
    });

    // Generate a test token for authenticated requests
    const { generateKeys } = require('../helpers/utils/auth');
    const { createTokens } = require('../authUtils/authUtils');
    const { accessTokenKey, refreshTokenKey } = generateKeys();
    
    // Create keystore record
    await Keystore.create({
      userId: testUser.id,
      accessTokenKey,
      refreshTokenKey,
      isActive: true,
    });
    
    const tokens = await createTokens(testUser, accessTokenKey, refreshTokenKey);
    authToken = tokens.accessToken;
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create({
        name: 'Test Product',
        description: 'Test description',
        type: 'fixed_price',
        price: 100,
        stockQuantity: 10,
        categoryId: testCategory.id,
        isActive: true,
      });

      await Product.create({
        name: 'Auction Product',
        description: 'Auction description',
        type: 'auction',
        startingPrice: 50,
        currentHighestBid: 50,
        auctionEndTime: new Date(Date.now() + 86400000),
        categoryId: testCategory.id,
        isActive: true,
      });
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.products.length).toBe(2);
    });

    it('should filter products by type', async () => {
      const response = await request(app)
        .get('/api/products?type=fixed_price');

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].type).toBe('fixed_price');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/products?categoryId=${testCategory.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(2);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?search=Test');

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].name).toContain('Test');
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test description',
        type: 'fixed_price',
        price: 100,
        stockQuantity: 10,
        categoryId: testCategory.id,
        isActive: true,
      });
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.id).toBe(testProduct.id);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create fixed price product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Product',
          description: 'New description',
          type: 'fixed_price',
          price: 150,
          stockQuantity: 20,
          categoryId: testCategory.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.name).toBe('New Product');
    });

    it('should create auction product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Auction Product',
          description: 'Auction description',
          type: 'auction',
          startingPrice: 100,
          auctionEndTime: new Date(Date.now() + 86400000),
          categoryId: testCategory.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.name).toBe('Auction Product');
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          type: 'invalid_type',
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'New Product',
          type: 'fixed_price',
          price: 150,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test description',
        type: 'fixed_price',
        price: 100,
        stockQuantity: 10,
        categoryId: testCategory.id,
        isActive: true,
      });
    });

    it('should update product successfully', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Product',
          price: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.name).toBe('Updated Product');
    });

    it('should fail with non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Product',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test description',
        type: 'fixed_price',
        price: 100,
        stockQuantity: 10,
        categoryId: testCategory.id,
        isActive: true,
      });
    });

    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
    });

    it('should fail with non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 