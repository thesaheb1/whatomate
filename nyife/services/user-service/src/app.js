'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');

const { connectDB }    = require('./config/database');
const { connectRedis } = require('./config/redis');
const { createLogger } = require('../../../shared/logger');
const { requestLogger }  = require('../../../shared/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');
const { apiLimiter }   = require('../../../shared/middleware/rateLimiter');

const userRoutes = require('./routes/user.routes');

const logger = createLogger('user-service');
const app    = express();
const PORT   = parseInt(process.env.PORT, 10) || 3002;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Static uploads (served in dev — in prod use Nginx) ────────────────────────
const uploadBase = process.env.UPLOAD_BASE_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadBase)));

// ── Swagger ────────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Nyife User Service', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
  },
  apis: ['./src/routes/*.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// ── Rate limit + Routes ────────────────────────────────────────────────────────
app.use('/api/v1', apiLimiter, userRoutes);

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info('User service running', { port: PORT, env: process.env.NODE_ENV });
    });
  } catch (err) {
    logger.error('Failed to start user service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });
process.on('SIGINT',  () => { logger.info('SIGINT received');  process.exit(0); });
process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));

if (require.main === module) start();

module.exports = app;
