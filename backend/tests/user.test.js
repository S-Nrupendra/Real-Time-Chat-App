require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User.model');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const testUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@test.com',
  password: '123456'
};

describe('GET /api/users/profile', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  });

  it('should get profile successfully', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('should fail without token', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/online', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  });

  it('should get online users', async () => {
    const res = await request(app)
      .get('/api/users/online')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});

describe('PUT /api/users/profile', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  });

  it('should update name successfully', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  it('should fail with nothing to update', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should fail without token', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(401);
  });
});