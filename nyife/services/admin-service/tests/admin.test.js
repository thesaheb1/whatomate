'use strict';

process.env.NODE_ENV         = 'test';
process.env.PORT             = '3099';
process.env.DB_NAME          = 'nyife_admin_test';
process.env.DB_USER          = 'root';
process.env.DB_PASS          = 'root';
process.env.MYSQL_HOST       = 'localhost';
process.env.REDIS_HOST       = 'localhost';
process.env.REDIS_PORT       = '6379';
process.env.ADMIN_JWT_SECRET = 'test_admin_secret_32_chars_xxxxxxxxxxxx';
process.env.ADMIN_JWT_EXPIRY = '8h';
process.env.BCRYPT_ROUNDS    = '4';
process.env.KAFKA_BROKERS    = 'localhost:9092';
process.env.ENCRYPTION_KEY   = 'test_encryption_key_32_chars_xxxxx';

jest.mock('../src/config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([[]]),
  },
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('axios', () => ({
  get:   jest.fn().mockResolvedValue({ data: { data: { users: [], total: 0 } } }),
  post:  jest.fn().mockResolvedValue({ data: { data: {} } }),
  patch: jest.fn().mockResolvedValue({ data: { data: {} } }),
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

const mockAdmin = {
  id: 'admin-uuid-1',
  firstName: 'Super', lastName: 'Admin',
  email: 'superadmin@nyife.com',
  passwordHash: null, // will be set in test
  isSuperAdmin: true,
  isActive: true,
  lastLoginAt: null,
  toSafeJSON: function() {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, email: this.email, isSuperAdmin: this.isSuperAdmin };
  },
  update: jest.fn().mockImplementation(function(data) { Object.assign(this, data); return Promise.resolve(this); }),
  destroy: jest.fn().mockResolvedValue(true),
  sequelize: { query: jest.fn().mockResolvedValue([[]]) },
};

jest.mock('../src/models', () => ({
  AdminUser: {
    findOne:        jest.fn(),
    findByPk:       jest.fn(),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    create:         jest.fn(),
    update:         jest.fn().mockResolvedValue([1]),
  },
  AdminRole: {
    findAll:   jest.fn().mockResolvedValue([]),
    findByPk:  jest.fn(),
    create:    jest.fn(),
    destroy:   jest.fn(),
  },
  AdminRolePermission: {
    findAll:    jest.fn().mockResolvedValue([]),
    bulkCreate: jest.fn().mockResolvedValue([]),
    destroy:    jest.fn().mockResolvedValue(1),
  },
  AdminAuditLog: {
    create:         jest.fn().mockResolvedValue({}),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
  },
  SiteSetting: {
    findAll:      jest.fn().mockResolvedValue([]),
    findOne:      jest.fn(),
    findOrCreate: jest.fn(),
    update:       jest.fn().mockResolvedValue([1]),
  },
  EmailTemplate: {
    findAll:        jest.fn().mockResolvedValue([]),
    findByPk:       jest.fn(),
    findOne:        jest.fn(),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    create:         jest.fn(),
    update:         jest.fn().mockResolvedValue([1]),
    destroy:        jest.fn().mockResolvedValue(1),
  },
  Translation: {
    findAll:      jest.fn().mockResolvedValue([]),
    findOrCreate: jest.fn(),
    destroy:      jest.fn().mockResolvedValue(1),
  },
  SupportedLanguage: {
    findAll:      jest.fn().mockResolvedValue([]),
    findOrCreate: jest.fn(),
    update:       jest.fn().mockResolvedValue([1]),
  },
}));

const request = require('supertest');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const app     = require('../src/app');

const makeAdminToken = (extra = {}) =>
  jwt.sign(
    { sub: 'admin-uuid-1', email: 'superadmin@nyife.com', isSuperAdmin: true, permissions: { _all: true }, ...extra },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '8h', issuer: 'nyife-admin', audience: 'nyife-admin-client' }
  );

describe('Admin Service', () => {

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('admin-service');
    });
  });

  describe('POST /api/v1/admin/auth/login', () => {
    it('should return 401 for unknown admin', async () => {
      const { AdminUser } = require('../src/models');
      AdminUser.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'unknown@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return 200 with token for valid credentials', async () => {
      const hash = await bcrypt.hash('Password123!', 4);
      const { AdminUser } = require('../src/models');
      const { redis } = require('../src/config/redis');

      AdminUser.findOne.mockResolvedValue({
        ...mockAdmin,
        passwordHash: hash,
        update: jest.fn().mockResolvedValue(true),
        sequelize: { query: jest.fn().mockResolvedValue([[]]) },
      });
      AdminUser.findByPk.mockResolvedValue({ isSuperAdmin: true });
      redis.set.mockResolvedValue('OK');

      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'superadmin@nyife.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'test@test.com' }); // missing password
      expect(res.status).toBe(400);
    });
  });

  describe('Protected admin routes', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/admin/users');
      expect(res.status).toBe(401);
    });

    it('should accept valid admin JWT', async () => {
      const token = makeAdminToken();
      const { AdminUser } = require('../src/models');
      AdminUser.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should reject sub-admin without permission', async () => {
      const token = makeAdminToken({
        isSuperAdmin: false,
        permissions: { users: { create: false, read: false, update: false, delete: false } },
      });
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/settings', () => {
    it('should return settings for super admin', async () => {
      const { SiteSetting, redis } = require('../src/models');
      const { redis: redisClient } = require('../src/config/redis');
      redisClient.get.mockResolvedValue(null);
      SiteSetting.findAll.mockResolvedValue([
        { settingKey: 'site.name', value: 'Nyife', toJSON: () => ({ settingKey: 'site.name', value: 'Nyife' }) },
      ]);

      const token = makeAdminToken();
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/emails/templates', () => {
    it('should list email templates', async () => {
      const { EmailTemplate } = require('../src/models');
      EmailTemplate.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 't1', slug: 'welcome', name: 'Welcome', subject: 'Welcome!', category: 'transactional' }],
      });

      const token = makeAdminToken();
      const res = await request(app)
        .get('/api/v1/admin/emails/templates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/translations/languages', () => {
    it('should return language list (public)', async () => {
      const { SupportedLanguage } = require('../src/models');
      SupportedLanguage.findAll.mockResolvedValue([
        { locale: 'en', name: 'English', isActive: true, isDefault: true },
      ]);

      const token = makeAdminToken();
      const res = await request(app)
        .get('/api/v1/admin/translations/languages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
