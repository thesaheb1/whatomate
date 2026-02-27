'use strict';

process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_xxxxx';

const bcrypt = require('bcrypt');

jest.mock('../src/models', () => ({
  ApiToken: {
    count:   jest.fn().mockResolvedValue(0),
    create:  jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    update:  jest.fn().mockResolvedValue([1]),
  },
}));

jest.mock('../src/config/database', () => ({
  sequelize: { authenticate: jest.fn() },
  connectDB: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), on: jest.fn(), connect: jest.fn() },
  connectRedis: jest.fn(),
}));

const { createToken, verifyToken, listTokens } = require('../src/services/apiTokenService');

describe('ApiTokenService', () => {

  describe('createToken', () => {
    it('should generate a token with nfy_ prefix', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.count.mockResolvedValue(0);
      ApiToken.create.mockResolvedValue({
        id: 'token-uuid-1',
        name: 'Test Token',
        tokenPrefix: 'abc123456789abcd',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await createToken({
        userId: 'user-1',
        organizationId: 'org-1',
        name: 'Test Token',
        permissions: [],
        expiresAt: null,
      });

      expect(result.token).toMatch(/^nfy_[a-f0-9]{64}$/);
      expect(result.id).toBe('token-uuid-1');
    });

    it('should throw if max tokens reached', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.count.mockResolvedValue(10);

      await expect(createToken({
        userId: 'user-1',
        organizationId: 'org-1',
        name: 'Over limit',
      })).rejects.toThrow('Maximum 10 active API tokens');
    });
  });

  describe('listTokens', () => {
    it('should return tokens without hash', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 't1', name: 'Token 1', tokenPrefix: 'pref', permissions: [] }],
      });

      const { tokens, total } = await listTokens('user-1', 'org-1', { page: 1, limit: 20 });
      expect(total).toBe(1);
      expect(tokens[0].id).toBe('t1');
    });
  });

  describe('verifyToken', () => {
    it('should return null for non-nfy_ token', async () => {
      const result = await verifyToken('invalid_token', 'org-1');
      expect(result).toBeNull();
    });

    it('should return null if no matching prefix', async () => {
      const { ApiToken } = require('../src/models');
      ApiToken.findAll.mockResolvedValue([]);
      const result = await verifyToken('nfy_' + 'a'.repeat(64), 'org-1');
      expect(result).toBeNull();
    });

    it('should return token data on bcrypt match', async () => {
      const rawToken = 'nfy_' + 'a'.repeat(64);
      const hash = await bcrypt.hash(rawToken, 4);
      const { ApiToken } = require('../src/models');
      ApiToken.findAll.mockResolvedValue([{
        id: 'token-id-1',
        userId: 'user-1',
        organizationId: 'org-1',
        permissions: ['contacts:read'],
        tokenHash: hash,
      }]);

      const result = await verifyToken(rawToken, 'org-1');
      expect(result).not.toBeNull();
      expect(result.userId).toBe('user-1');
      expect(result.permissions).toEqual(['contacts:read']);
    });
  });
});
