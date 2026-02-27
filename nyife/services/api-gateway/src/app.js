'use strict';

require('dotenv').config();

const http     = require('http');
const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB }    = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocketIO } = require('./socket');
const { createLogger } = require('../../../shared/logger');
const { requestLogger } = require('../../../shared/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');

const routesModule = require('./routes');
const apiRoutes = routesModule;
const adminRouter = routesModule.adminRouter;

const logger = createLogger('api-gateway');
const app    = express();
const PORT   = parseInt(process.env.PORT, 10) || 3000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'connect.facebook.net'],
      frameSrc:   ["'self'", '*.facebook.com', '*.fbcdn.net'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.GATEWAY_CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Organization-ID', 'X-API-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// ── Body & Cookies ────────────────────────────────────────────────────────────
// Raw body needed for webhook signature verification
app.use('/api/v1/webhook',        express.raw({ type: 'application/json', limit: '5mb' }));
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Trust proxy ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
// Admin routes FIRST (before user auth middleware kicks in)
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', apiRoutes);

// ── Swagger Aggregated Docs ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'Nyife API', version: '1.0.0', description: 'Nyife WhatsApp SaaS Platform API' },
      servers: [{ url: '/api/v1', description: 'API Gateway' }],
      components: {
        securitySchemes: {
          cookieAuth:  { type: 'apiKey', in: 'cookie', name: 'nyife_access' },
          apiTokenAuth: { type: 'apiKey', in: 'header', name: 'X-API-Token' },
          adminAuth:   { type: 'apiKey', in: 'cookie', name: 'nyife_admin' },
        },
      },
    },
    apis: ['./src/routes/*.js'],
  });
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api/v1/docs.json', (req, res) => res.json(spec));
}

// ── 404 + Error Handling ───────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    const httpServer = http.createServer(app);
    initSocketIO(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info('API Gateway running', { port: PORT, env: process.env.NODE_ENV });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down`);
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start api-gateway', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

if (require.main === module) {
  start();
}

module.exports = app;
