'use strict';

const { sequelize } = require('../config/database');
const User = require('./User');
const EmailVerification = require('./EmailVerification');
const RefreshToken = require('./RefreshToken');
const LoginHistory = require('./LoginHistory');

// ── Associations ──────────────────────────────────────────────────────────────
User.hasMany(EmailVerification, { foreignKey: 'userId', as: 'emailVerifications' });
EmailVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistory' });
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { sequelize, User, EmailVerification, RefreshToken, LoginHistory };
