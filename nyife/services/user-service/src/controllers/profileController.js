'use strict';

const path = require('path');
const {
  getProfile,
  getOrCreateProfile,
  updateProfile,
  updateNotificationSettings,
  updateAvatar,
  updateAvailability,
} = require('../services/profileService');
const { success, created } = require('../../../../shared/response/formatter');
const { asyncHandler } = require('../../../../shared/utils/asyncHandler');
const { NotFoundError } = require('../../../../shared/errors/AppError');

// ── GET /me ───────────────────────────────────────────────────────────────────
const getMeHandler = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.userId, { fullName: req.userEmail?.split('@')[0] || 'User' });
  return success(res, {
    userId:              req.userId,
    email:               req.userEmail,
    fullName:            profile.fullName,
    phone:               profile.phone,
    avatarUrl:           profile.avatarUrl,
    language:            profile.language,
    theme:               profile.theme,
    timezone:            profile.timezone,
    emailNotifications:  profile.emailNotifications,
    inappNotifications:  profile.inappNotifications,
    notificationPrefs:   profile.notificationPrefs,
    isAvailable:         profile.isAvailable,
  });
});

// ── PUT /me ───────────────────────────────────────────────────────────────────
const updateMeHandler = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.userId, req.body);
  return success(res, profile, 'Profile updated');
});

// ── PUT /me/settings ──────────────────────────────────────────────────────────
const updateSettingsHandler = asyncHandler(async (req, res) => {
  const profile = await updateNotificationSettings(req.userId, req.body);
  return success(res, profile, 'Settings updated');
});

// ── PUT /me/availability ──────────────────────────────────────────────────────
const updateAvailabilityHandler = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const orgId = req.organizationId;
  const profile = await updateAvailability(req.userId, orgId, Boolean(isAvailable));
  return success(res, { isAvailable: profile.isAvailable }, 'Availability updated');
});

// ── POST /me/avatar ───────────────────────────────────────────────────────────
const uploadAvatarHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new NotFoundError('No file uploaded');

  const relativePath = `/uploads/avatars/${req.userId}/${path.basename(req.file.path)}`;
  const profile = await updateAvatar(req.userId, req.file.path, relativePath);
  return success(res, { avatarUrl: profile.avatarUrl }, 'Avatar uploaded');
});

// ── DELETE /me/avatar ─────────────────────────────────────────────────────────
const deleteAvatarHandler = asyncHandler(async (req, res) => {
  await updateAvatar(req.userId, null, null);
  return success(res, null, 'Avatar removed');
});

// ── GET /users/:userId (admin / internal) ─────────────────────────────────────
const getUserProfileHandler = asyncHandler(async (req, res) => {
  const profile = await getProfile(req.params.userId);
  return success(res, profile);
});

module.exports = {
  getMeHandler,
  updateMeHandler,
  updateSettingsHandler,
  updateAvailabilityHandler,
  uploadAvatarHandler,
  deleteAvatarHandler,
  getUserProfileHandler,
};
