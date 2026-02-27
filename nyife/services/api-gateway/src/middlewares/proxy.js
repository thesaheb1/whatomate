'use strict';

const { createProxyMiddleware } = require('http-proxy-middleware');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('gateway-proxy');

/**
 * Creates a reverse-proxy middleware for a downstream service.
 *
 * @param {string} target  base URL of the downstream service
 * @param {string} name    service name (for logging)
 * @param {object} opts    extra http-proxy-middleware options
 */
const createServiceProxy = (target, name, opts = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    // Strip the /api/v1 prefix only when the downstream service already has it
    // All services mount their routes at /api/v1 internally
    pathRewrite: opts.pathRewrite || undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward real client IP
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        proxyReq.setHeader('x-forwarded-for', clientIp);
        proxyReq.setHeader('x-real-ip', clientIp);
        proxyReq.setHeader('x-gateway-forwarded', 'true');

        // Remove raw cookie headers so downstream cannot be confused by gateway cookies
        proxyReq.removeHeader('cookie');
      },
      proxyRes: (proxyRes, req, res) => {
        logger.debug('Proxied response', {
          service: name,
          method: req.method,
          path: req.path,
          status: proxyRes.statusCode,
        });
      },
      error: (err, req, res) => {
        logger.error('Proxy error', {
          service: name,
          path: req.path,
          error: err.message,
        });
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: `${name} is temporarily unavailable. Please try again.`,
            },
          });
        }
      },
    },
    ...opts,
  });
};

module.exports = { createServiceProxy };
