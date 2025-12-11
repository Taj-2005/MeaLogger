const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');
const config = require('../config');

describe('Auth API', () => {
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    const testUri = config.mongoUri.replace('meal-logger', 'meal-logger-test');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    } else if (mongoose.connection.host !== 'localhost' || !mongoose.connection.name.includes('test')) {
      await mongoose.connection.close();
      await mongoose.connect(testUri);
    }
  });

  afterAll(async () => {
    await Settings.deleteMany({});
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await Settings.deleteMany({});
    await User.deleteMany({});
    accessToken = undefined;
    refreshToken = undefined;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User 2',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      accessToken = registerResponse.body.data.tokens.accessToken;
      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without token', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
