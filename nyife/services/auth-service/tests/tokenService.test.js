'use strict';

process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_xxxxxxxxxx';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

jest.mock('../src/config/redis', () => ({
  redis: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn().mockReturnValue({ del: jest.fn(), exec: jest.fn().mockResolvedValue([]) }),
  },
  connectRedis: jest.fn(),
}));

jest.mock('../src/models', () => ({
  RefreshToken: {
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    findAll: jest.fn().mockResolvedValue([]),
  },
}));

const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  generateCsrfToken,
} = require('../src/services/tokenService');

describe('TokenService', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      const decoded = jwt.decode(token);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.iss).toBe('nyife');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken({ sub: 'user-123', email: 'test@example.com' });
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe('user-123');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw on expired token', () => {
      const token = jwt.sign(
        { sub: 'user-123' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '-1s', issuer: 'nyife', audience: 'nyife-client' }
      );
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token and store JTI in Redis', async () => {
      const { redis } = require('../src/config/redis');
      const { token, jti } = await generateRefreshToken('user-123', '127.0.0.1', 'Jest');
      expect(typeof token).toBe('string');
      expect(typeof jti).toBe('string');
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        'user-123',
        'EX',
        expect.any(Number)
      );
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate and store CSRF token', async () => {
      const { redis } = require('../src/config/redis');
      const token = await generateCsrfToken('user-123');
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes hex
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('csrf:'),
        token,
        'EX',
        900
      );
    });
  });
});
