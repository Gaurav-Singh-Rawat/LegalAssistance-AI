const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

test('GET /api/health returns service status', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'online');
  assert.equal(response.body.service, 'Legal AI Assistant Backend');
});

test('POST /api/auth/register rejects invalid email format', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'bad-email',
      password: 'password123',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /valid email/i);
});

test('POST /api/auth/login rejects missing credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: '', password: '' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
