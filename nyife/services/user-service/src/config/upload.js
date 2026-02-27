'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../../../../shared/errors/AppError');

const BASE = process.env.UPLOAD_BASE_PATH || './uploads';
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(BASE, 'avatars', req.userId || 'tmp');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ValidationError('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
  cb(null, true);
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = { uploadAvatar };
