'use strict';

process.env.NODE_ENV       = 'test';
process.env.PORT           = '3099';
process.env.DB_NAME        = 'nyife_user_test';
process.env.DB_USER        = 'root';
process.env.DB_PASS        = 'root';
process.env.MYSQL_HOST     = 'localhost';
process.env.REDIS_HOST     = 'localhost';
process.env.REDIS_PORT     = '6379';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_xxxxx';
process.env.KAFKA_BROKERS  = 'localhost:9092';
process.env.UPLOAD_BASE_PATH = '/tmp/nyife-test-uploads';

jest.mock('../src/config/database', () => ({
  sequelize: { authenticate: jest.fn().mockResolvedValue(true) },
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    on:  jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
  },
  connectRedis: jest.fn().mockResolvedValue(true),
}));

const mockProfile = {
  id: 'profile-uuid-1',
  userId: 'user-uuid-1',
  fullName: 'Test User',
  phone: null,
  avatarUrl: null,
  language: 'en',
  theme: 'system',
  timezone: 'Asia/Kolkata',
  emailNotifications: true,
  inappNotifications: true,
  notificationPrefs: {},
  isAvailable: true,
  update: jest.fn().mockImplementation(function(data) {
    Object.assign(this, data);
    return Promise.resolve(this);
  }),
  destroy: jest.fn().mockResolvedValue(true),
  toJSON: function() { return { ...this }; },
};

jest.mock('../src/models', () => ({
  UserProfile: {
    findOne:       jest.fn(),
    findOrCreate:  jest.fn(),
    create:        jest.fn(),
    update:        jest.fn().mockResolvedValue([1]),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    count:         jest.fn().mockResolvedValue(0),
  },
  ApiToken: {
    findOne:       jest.fn(),
    findAll:       jest.fn().mockResolvedValue([]),
    create:        jest.fn(),
    update:        jest.fn().mockResolvedValue([1]),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    count:         jest.fn().mockResolvedValue(0),
    destroy:       jest.fn(),
  },
  UserAvailabilityLog: {
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
  },
  WoocommerceIntegration: {
    findOne:       jest.fn(),
    findOrCreate:  jest.fn(),
    create:        jest.fn(),
    update:        jest.fn().mockResolvedValue([1]),
  },
}));

const request = require('supertest');
const app     = require('../src/app');

// Helper: simulate gateway-forwarded headers
const withGatewayHeaders = (req) =>
  req
    .set('x-user-id',          'user-uuid-1')
    .set('x-user-email',       'user@test.com')
    .set('x-organization-id',  'org-uuid-1');

describe('User Service', () => {

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('user-service');
    });
  });

  describe('GET /api/v1/me', () => {
    it('should return 401 without gateway headers', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
    });

    it('should return profile when gateway headers present', async () => {
      const { UserProfile } = require('../src/models');
      UserProfile.findOrCreate.mockResolvedValue([{ ...mockProfile }, false]);

      const res = await withGatewayHeaders(request(app).get('/api/v1/me'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe('user-uuid-1');
    });
  });

  describe('PUT /api/v1/me', () => {
    it('should update profile fields', async () => {
      const { UserProfile } = require('../src/models');
      UserProfile.findOrCreate.mockResolvedValue([{ ...mockProfile }, false]);

      const res = await withGatewayHeaders(request(app).put('/api/v1/me'))
        .send({ fullName: 'Updated Name', language: 'hi', theme: 'dark' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid theme value', async () => {
      const res = await withGatewayHeaders(request(app).put('/api/v1/me'))
        .send({ theme: 'purple' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/me/availability', () => {
    it('should update availability', async () => {
      const { UserProfile, UserAvailabilityLog } = require('../src/models');
      UserProfile.findOrCreate.mockResolvedValue([{ ...mockProfile, isAvailable: true }, false]);

      const res = await withGatewayHeaders(request(app).put('/api/v1/me/availability'))
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing isAvailable field', async () => {
      const res = await withGatewayHeaders(request(app).put('/api/v1/me/availability'))
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/api-tokens', () => {
    it('should list API tokens', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.findAndCountAll.mockResolvedValue({ count: 1, rows: [
        { id: 'token-1', name: 'My Token', tokenPrefix: 'abc123', permissions: [], isActive: true },
      ]});

      const res = await withGatewayHeaders(request(app).get('/api/v1/api-tokens'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/api-tokens', () => {
    it('should create API token and return raw token once', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.count.mockResolvedValue(0);
      ApiToken.create.mockResolvedValue({
        id: 'new-token-id',
        name: 'My Token',
        tokenPrefix: 'abc123456789abcd',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      });

      const res = await withGatewayHeaders(request(app).post('/api/v1/api-tokens'))
        .send({ name: 'My Token', permissions: ['contacts:read'] });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toMatch(/^nfy_/);
      expect(res.body.message).toContain('Save it now');
    });

    it('should reject creation without name', async () => {
      const res = await withGatewayHeaders(request(app).post('/api/v1/api-tokens'))
        .send({ permissions: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/internal/api-tokens/verify', () => {
    it('should return 401 without internal service header', async () => {
      const res = await request(app)
        .post('/api/v1/internal/api-tokens/verify')
        .set('x-user-id', 'user-1')
        .send({ token: 'nfy_abc123', organizationId: 'org-1' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.findAll.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/internal/api-tokens/verify')
        .set('x-internal-service', 'api-gateway')
        .send({ token: 'nfy_' + 'a'.repeat(64), organizationId: 'org-1' });
      expect(res.status).toBe(401);
    });
  });
});
