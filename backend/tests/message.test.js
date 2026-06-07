require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User.model');
const Message = require('../models/Message.model');

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

const testUser2 = {
  name: 'Test User 2',
  username: 'testuser2',
  email: 'test2@test.com',
  password: '123456'
};

describe('GET /api/messages', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  });

  it('should get messages with pagination', async () => {
    const res = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('should respect pagination params', async () => {
    const res = await request(app)
      .get('/api/messages?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it('should fail without token', async () => {
    const res = await request(app).get('/api/messages');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/messages/:id', () => {
  let token;
  let token2;
  let messageId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});

    const res1 = await request(app).post('/api/auth/register').send(testUser);
    const res2 = await request(app).post('/api/auth/register').send(testUser2);
    token = res1.body.token;
    token2 = res2.body.token;

    const user = await User.findOne({ email: testUser.email });
    const message = await Message.create({
      content: 'Test message',
      sender: user._id
    });
    messageId = message._id;
  });

  it('should delete own message successfully', async () => {
    const res = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Message deleted successfully');
  });

  it('should not delete another users message', async () => {
    const res = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non existent message', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/messages/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should fail without token', async () => {
    const res = await request(app)
      .delete(`/api/messages/${messageId}`);

    expect(res.status).toBe(401);
  });
});