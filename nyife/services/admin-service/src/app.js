'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');

const { connectDB }    = require('./config/database');
const { connectRedis } = require('./config/redis');
const { createLogger } = require('../../../shared/logger');
const { requestLogger }  = require('../../../shared/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');

const adminRoutes = require('./routes/admin.routes');

const logger = createLogger('admin-service');
const app    = express();
const PORT   = parseInt(process.env.PORT, 10) || 3004;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(requestLogger);

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Nyife Admin Service', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        adminCookie: { type: 'apiKey', in: 'cookie', name: 'nyife_admin' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-service', timestamp: new Date().toISOString() });
});

// Routes — all admin routes mounted at /api/v1/admin
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info('Admin service running', { port: PORT, env: process.env.NODE_ENV });
    });
  } catch (err) {
    logger.error('Failed to start admin service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });
process.on('SIGINT',  () => { logger.info('SIGINT received');  process.exit(0); });
process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));

if (require.main === module) start();

module.exports = app;
