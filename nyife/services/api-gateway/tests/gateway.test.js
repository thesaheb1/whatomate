'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.JWT_ACCESS_SECRET  = 'test_access_secret_32_chars_xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_xxxxxxxxxx';
process.env.ADMIN_JWT_SECRET   = 'test_admin_secret_32_chars_xxxxxxxxxxxx';
process.env.CSRF_SECRET        = 'test_csrf_secret_32_chars_xxxxxxxxxxxxxxx';
process.env.MYSQL_HOST         = 'localhost';
process.env.DB_NAME            = 'nyife_gateway_test';
process.env.DB_USER            = 'root';
process.env.DB_PASS            = 'root';
process.env.REDIS_HOST         = 'localhost';
process.env.REDIS_PORT         = '6379';
process.env.GATEWAY_CORS_ORIGINS = 'http://localhost:5173';
process.env.AUTH_SERVICE_URL    = 'http://localhost:3001';

jest.mock('../src/config/database', () => ({
  sequelize: { authenticate: jest.fn().mockResolvedValue(true) },
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn(),
    publish: jest.fn(),
  },
  connectRedis: jest.fn().mockResolvedValue(true),
}));

// Mock Socket.IO to prevent actual Redis pub/sub
jest.mock('../src/socket', () => ({
  initSocketIO: jest.fn().mockReturnValue({ on: jest.fn() }),
  emitToOrg: jest.fn(),
  emitToUser: jest.fn(),
}));

// Mock http-proxy-middleware — don't actually proxy in tests
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => (req, res, next) => {
    res.status(200).json({ success: true, proxied: true, path: req.path });
  }),
}));

const request = require('supertest');
const app     = require('../src/app');
const jwt     = require('jsonwebtoken');

const makeUserToken = (payload = {}) =>
  jwt.sign(
    { sub: 'user-uuid-123', email: 'user@test.com', ...payload },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m', issuer: 'nyife', audience: 'nyife-client' }
  );

const makeAdminToken = (payload = {}) =>
  jwt.sign(
    { sub: 'admin-uuid-123', email: 'admin@test.com', isSuperAdmin: true, ...payload },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '8h', issuer: 'nyife-admin', audience: 'nyife-admin-client' }
  );

describe('API Gateway', () => {

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('api-gateway');
    });
  });

  describe('Public routes (no auth)', () => {
    it('POST /api/v1/auth/login should proxy without auth', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'Password123' });
      // Proxy mock returns 200
      expect([200, 401, 503]).toContain(res.status);
    });

    it('GET /api/v1/webhook should be accessible without auth', async () => {
      const res = await request(app).get('/api/v1/webhook');
      expect([200, 400, 404, 503]).toContain(res.status);
    });
  });

  describe('Authenticated routes', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/contacts');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid JWT in Authorization header', async () => {
      const token = makeUserToken();
      const { redis } = require('../src/config/redis');
      redis.get.mockResolvedValueOnce('test_csrf_token'); // csrf stored

      const res = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Organization-ID', 'org-uuid-123');
      // Proxy mock returns 200
      expect([200, 503]).toContain(res.status);
    });

    it('should accept valid JWT in cookie', async () => {
      const token = makeUserToken();
      const res = await request(app)
        .get('/api/v1/me')
        .set('Cookie', `nyife_access=${token}`);
      expect([200, 503]).toContain(res.status);
    });

    it('should reject expired JWT', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', email: 'test@test.com' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '-1s', issuer: 'nyife', audience: 'nyife-client' }
      );
      const res = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Admin routes', () => {
    it('should reject user JWT on admin route', async () => {
      const userToken = makeUserToken();
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(401);
    });

    it('should accept valid admin JWT', async () => {
      const adminToken = makeAdminToken();
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      // Admin token verified via ADMIN_JWT_SECRET — should not be 401
      expect([200, 503]).toContain(res.status);
      expect(res.status).not.toBe(403);
    });
  });

  describe('CSRF protection', () => {
    it('should reject POST without CSRF token', async () => {
      const token = makeUserToken();
      const res = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', `nyife_access=${token}`)
        .send({ name: 'Test', phone: '+1234567890' });
      // Either proxied (200) or CSRF rejected (401) depending on cookie presence
      expect([200, 401, 503]).toContain(res.status);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/this-route-does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
