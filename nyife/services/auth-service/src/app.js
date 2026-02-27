'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { configurePassport, passport } = require('./config/passport');
const { createLogger } = require('../../../shared/logger');
const { requestLogger } = require('../../../shared/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');
const { initProducer } = require('./controllers/authController');

const authRoutes = require('./routes/auth.routes');

const logger = createLogger('auth-service');
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Gateway handles CSP
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.GATEWAY_CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Organization-ID'],
}));

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── Request logging ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Trust proxy (behind nginx / api-gateway) ──────────────────────────────────
app.set('trust proxy', 1);

// ── Passport ──────────────────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Swagger API Docs ──────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Nyife Auth Service', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'nyife_access' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ── Error Handling ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    await initProducer();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Auth service running`, { port: PORT, env: process.env.NODE_ENV });
    });
  } catch (err) {
    logger.error('Failed to start auth service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

// ── Graceful Shutdown ──────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

if (require.main === module) {
  start();
}

module.exports = app;
