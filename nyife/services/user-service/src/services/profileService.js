'use strict';

const path   = require('path');
const fs     = require('fs');
const { UserProfile, UserAvailabilityLog } = require('../models');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');
const { NotFoundError, ConflictError } = require('../../../../shared/errors/AppError');
const { sanitizeString } = require('../../../../shared/utils/sanitize');

const logger = createLogger('profile-service');

// ── Get or create profile ─────────────────────────────────────────────────────
const getProfile = async (userId) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  if (!profile) throw new NotFoundError('User profile');
  return profile;
};

const getOrCreateProfile = async (userId, defaults = {}) => {
  const [profile] = await UserProfile.findOrCreate({
    where: { userId },
    defaults: {
      fullName: defaults.fullName || 'User',
      phone: defaults.phone || null,
      language: 'en',
      theme: 'system',
      timezone: 'Asia/Kolkata',
      ...defaults,
    },
  });
  return profile;
};

// ── Update profile ────────────────────────────────────────────────────────────
const updateProfile = async (userId, data) => {
  const profile = await getOrCreateProfile(userId);

  const allowed = ['fullName', 'phone', 'language', 'theme', 'timezone'];
  const updates = {};
  for (const field of allowed) {
    if (data[field] !== undefined) {
      updates[field] = typeof data[field] === 'string'
        ? sanitizeString(data[field])
        : data[field];
    }
  }

  await profile.update(updates);
  logger.info('Profile updated', { userId });

  // Invalidate cache
  await redis.del(`profile:${userId}`);
  return profile;
};

// ── Notification settings ─────────────────────────────────────────────────────
const updateNotificationSettings = async (userId, settings) => {
  const profile = await getOrCreateProfile(userId);
  const updates = {};

  if (settings.emailNotifications !== undefined) {
    updates.emailNotifications = Boolean(settings.emailNotifications);
  }
  if (settings.inappNotifications !== undefined) {
    updates.inappNotifications = Boolean(settings.inappNotifications);
  }
  if (settings.notificationPrefs !== undefined) {
    updates.notificationPrefs = settings.notificationPrefs;
  }

  await profile.update(updates);
  await redis.del(`profile:${userId}`);
  return profile;
};

// ── Avatar upload ─────────────────────────────────────────────────────────────
const updateAvatar = async (userId, filePath, publicUrl) => {
  const profile = await getOrCreateProfile(userId);

  // Delete old avatar file if it's a local upload
  if (profile.avatarUrl && profile.avatarUrl.startsWith('/uploads/')) {
    const oldPath = path.join(
      process.env.UPLOAD_BASE_PATH || './uploads',
      profile.avatarUrl.replace('/uploads/', '')
    );
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  await profile.update({ avatarUrl: publicUrl || filePath });
  await redis.del(`profile:${userId}`);
  logger.info('Avatar updated', { userId });
  return profile;
};

// ── Availability ──────────────────────────────────────────────────────────────
const updateAvailability = async (userId, organizationId, isAvailable) => {
  const profile = await getOrCreateProfile(userId);

  if (profile.isAvailable === isAvailable) {
    return profile; // No change needed
  }

  // Close the previous open availability log entry
  await UserAvailabilityLog.update(
    { endedAt: new Date() },
    { where: { userId, organizationId, endedAt: null } }
  );

  // Open a new log entry
  await UserAvailabilityLog.create({
    userId,
    organizationId,
    isAvailable,
    startedAt: new Date(),
  });

  await profile.update({ isAvailable });
  await redis.del(`profile:${userId}`);

  logger.info('Availability updated', { userId, organizationId, isAvailable });
  return profile;
};

// ── Get organizations for user (proxied from org-service in real deployment) ──
const getMyOrganizations = async (userId) => {
  // This endpoint acts as a passthrough — actual org data lives in org-service.
  // Returns stub here; gateway routes to org-service for full data.
  return [];
};

module.exports = {
  getProfile,
  getOrCreateProfile,
  updateProfile,
  updateNotificationSettings,
  updateAvatar,
  updateAvailability,
  getMyOrganizations,
};
