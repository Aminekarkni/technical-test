import request from 'supertest';
import app from '../app';
import User from '../database/models/User';
import Role from '../database/models/Role';
import Keystore from '../database/models/Keystore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
  let testUser: any;
  let testRole: any;
  let authToken: string;

  beforeEach(async () => {
    // Find or create the test role
    [testRole] = await Role.findOrCreate({
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          phoneNumber: '9876543210',
        });

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should fail with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '9876543210',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      console.log('Login response status:', response.status);
      console.log('Login response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      authToken = response.body.data.tokens.accessToken;
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login/google', () => {
    it('should handle Google OAuth login', async () => {
      const response = await request(app)
        .post('/api/auth/login/google')
        .send({
          idToken: 'mock-google-token',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      console.log('Using authToken:', authToken);
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Logout response status:', response.status);
      console.log('Logout response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/fcm-token', () => {
    it('should add FCM token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fcmToken: 'test-fcm-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('FCM token added successfully');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/fcm-token')
        .send({
          fcmToken: 'test-fcm-token',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/fcm-token', () => {
    it('should remove FCM token successfully', async () => {
      const response = await request(app)
        .delete('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fcmToken: 'test-fcm-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('FCM token removed successfully');
    });
  });
}); 