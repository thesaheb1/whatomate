'use strict';

const { sequelize } = require('../config/database');
const UserProfile           = require('./UserProfile');
const ApiToken              = require('./ApiToken');
const UserAvailabilityLog   = require('./UserAvailabilityLog');
const WoocommerceIntegration = require('./WoocommerceIntegration');

module.exports = { sequelize, UserProfile, ApiToken, UserAvailabilityLog, WoocommerceIntegration };
