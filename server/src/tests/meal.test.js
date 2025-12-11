const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Meal = require('../models/meal.model');
const Settings = require('../models/settings.model');
const config = require('../config');

describe('Meal API', () => {
  let accessToken;
  let userId;

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
    await Meal.deleteMany({});
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await Settings.deleteMany({});
    await Meal.deleteMany({});
    await User.deleteMany({});

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });

    if (registerResponse.status === 201 && registerResponse.body.success) {
      accessToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user.id;
    } else {
      throw new Error('Failed to create test user: ' + JSON.stringify(registerResponse.body));
    }
  });

  describe('POST /api/v1/meals', () => {
    it('should create a meal successfully with imageUrl', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Meal',
          type: 'breakfast',
          date: new Date().toISOString(),
          calories: 500,
          imageUrl: 'https://example.com/image.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meal).toHaveProperty('id');
      expect(response.body.data.meal.title).toBe('Test Meal');
      expect(response.body.data.meal.type).toBe('breakfast');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).post('/api/v1/meals').send({
        title: 'Test Meal',
        type: 'breakfast',
        date: new Date().toISOString(),
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid meal type', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Meal',
          type: 'invalid',
          date: new Date().toISOString(),
          imageUrl: 'https://example.com/image.jpg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without imageUrl or image file', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Meal',
          type: 'breakfast',
          date: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/meals', () => {
    beforeEach(async () => {
      await Meal.create([
        {
          user: userId,
          title: 'Meal 1',
          type: 'breakfast',
          date: new Date(),
          imageUrl: 'https://example.com/image1.jpg',
        },
        {
          user: userId,
          title: 'Meal 2',
          type: 'lunch',
          date: new Date(),
          imageUrl: 'https://example.com/image2.jpg',
        },
      ]);
    });

    it('should get meals successfully', async () => {
      const response = await request(app)
        .get('/api/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meals).toHaveLength(2);
      expect(response.body.data.pagination).toHaveProperty('total', 2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/meals?page=1&limit=1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.meals).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/v1/meals/upload-signature', () => {
    it('should get upload signature successfully', async () => {
      const response = await request(app)
        .get('/api/v1/meals/upload-signature')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('signature');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('folder');
      expect(response.body.data).toHaveProperty('publicId');
      expect(response.body.data).toHaveProperty('cloudName');
      expect(response.body.data).toHaveProperty('apiKey');
      expect(response.body.data).toHaveProperty('uploadUrl');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/v1/meals/upload-signature');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should not match /:id route (route ordering test)', async () => {
      // This test ensures that /upload-signature doesn't get matched by /:id
      // If it did, Mongoose would try to cast "upload-signature" as ObjectId and fail
      const response = await request(app)
        .get('/api/v1/meals/upload-signature')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should return 200 with signature data, not 400/500 with ObjectId cast error
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.signature).toBeDefined();
    });
  });

  describe('GET /api/v1/meals/:id', () => {
    let mealId;

    beforeEach(async () => {
      const meal = await Meal.create({
        user: userId,
        title: 'Test Meal',
        type: 'breakfast',
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      });
      mealId = meal._id;
    });

    it('should get meal by id successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meal).toHaveProperty('id', mealId.toString());
      expect(response.body.data.meal.title).toBe('Test Meal');
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/v1/meals/invalid-id-format')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid meal ID format');
    });

    it('should return 404 for non-existent meal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/meals/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Meal not found');
    });
  });

  describe('DELETE /api/v1/meals/:id', () => {
    let mealId;

    beforeEach(async () => {
      const meal = await Meal.create({
        user: userId,
        title: 'Test Meal',
        type: 'breakfast',
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      });
      mealId = meal._id;
    });

    it('should delete meal successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const meal = await Meal.findById(mealId);
      expect(meal).toBeNull();
    });

    it('should fail to delete other user meal', async () => {
      const otherUserResponse = await request(app).post('/api/v1/auth/register').send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const otherMeal = await Meal.create({
        user: otherUserResponse.body.data.user.id,
        title: 'Other Meal',
        type: 'lunch',
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      });

      const response = await request(app)
        .delete(`/api/v1/meals/${otherMeal._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
