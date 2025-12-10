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
    // Connect to test database
    const testUri = config.mongoUri.replace('meal-logger', 'meal-logger-test');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    } else if (mongoose.connection.host !== 'localhost' || !mongoose.connection.name.includes('test')) {
      await mongoose.connection.close();
      await mongoose.connect(testUri);
    }
  });

  afterAll(async () => {
    // Clean up
    await Settings.deleteMany({});
    await Meal.deleteMany({});
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clear data
    await Settings.deleteMany({});
    await Meal.deleteMany({});
    await User.deleteMany({});

    // Create test user and get token
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test${Date.now()}@example.com`, // Unique email for each test run
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
      // Create test meals
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

      // Verify meal is deleted
      const meal = await Meal.findById(mealId);
      expect(meal).toBeNull();
    });

    it('should fail to delete other user meal', async () => {
      // Create another user
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
