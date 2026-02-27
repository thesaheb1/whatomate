'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128-bit IV
const TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // 256-bit key

/**
 * Derives a 32-byte encryption key from the raw key string.
 * Accepts any string; pads or hashes to exactly 32 bytes.
 *
 * @param {string} rawKey
 * @returns {Buffer}
 */
const deriveKey = (rawKey) => {
  if (!rawKey) throw new Error('Encryption key is required');
  return crypto.createHash('sha256').update(String(rawKey)).digest();
};

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64-encoded string: iv(16) + authTag(16) + ciphertext
 *
 * @param {string} plaintext
 * @param {string} rawKey
 * @returns {string}  base64 encoded encrypted blob
 */
const encrypt = (plaintext, rawKey) => {
  if (!plaintext) return plaintext;
  const key = deriveKey(rawKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Concatenate: iv + authTag + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
};

/**
 * Decrypts an AES-256-GCM encrypted blob.
 *
 * @param {string} encryptedBase64
 * @param {string} rawKey
 * @returns {string}  plaintext
 */
const decrypt = (encryptedBase64, rawKey) => {
  if (!encryptedBase64) return encryptedBase64;
  const key = deriveKey(rawKey);
  const combined = Buffer.from(encryptedBase64, 'base64');

  const iv = combined.slice(0, IV_LENGTH);
  const authTag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};

/**
 * Generates a cryptographically secure random token.
 *
 * @param {number} bytes  default 32
 * @returns {string}  hex string
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generates a random API token in Nyife format: nfy_<64hex>
 */
const generateApiToken = () => {
  return `nfy_${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * Computes HMAC-SHA256 signature.
 *
 * @param {string|Buffer} data
 * @param {string} secret
 * @returns {string}  hex digest
 */
const hmacSha256 = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verifies Meta webhook X-Hub-Signature-256 header.
 *
 * @param {Buffer} body  raw request body buffer
 * @param {string} signature  header value (sha256=...)
 * @param {string} appSecret
 * @returns {boolean}
 */
const verifyWebhookSignature = (body, signature, appSecret) => {
  if (!signature || !appSecret) return false;
  const prefix = 'sha256=';
  if (!signature.startsWith(prefix)) return false;
  const received = Buffer.from(signature.slice(prefix.length), 'hex');
  const computed = Buffer.from(hmacSha256(body, appSecret), 'hex');
  return crypto.timingSafeEqual(received, computed);
};

module.exports = {
  encrypt,
  decrypt,
  generateToken,
  generateApiToken,
  hmacSha256,
  verifyWebhookSignature,
};
