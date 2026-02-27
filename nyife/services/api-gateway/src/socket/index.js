'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { redis } = require('../config/redis');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('gateway-socket');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Initialize Socket.IO server attached to the HTTP server.
 * Handles:
 *   - Authentication via JWT cookie or query param
 *   - Organization rooms (broadcast only to org members)
 *   - Typing indicators (ephemeral)
 *   - Real-time message status updates (forwarded from downstream services)
 *   - Campaign status updates
 *   - Notification dispatch
 *   - Agent availability broadcasts
 *
 * Downstream services push events to Socket.IO via Redis pub/sub.
 */
const initSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.GATEWAY_CORS_ORIGINS || '').split(',').map(s => s.trim()),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication middleware ────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie?.match(/nyife_access=([^;]+)/)?.[1] ||
        socket.handshake.query?.token;

      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, ACCESS_SECRET, {
        issuer: 'nyife',
        audience: 'nyife-client',
      });

      socket.userId = payload.sub;
      socket.userEmail = payload.email;
      socket.organizationId = socket.handshake.query?.organizationId || payload.organizationId;

      logger.debug('Socket authenticated', { userId: socket.userId, socketId: socket.id });
      next();
    } catch (err) {
      logger.warn('Socket auth failed', { error: err.message });
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, userEmail, organizationId } = socket;
    logger.info('Socket connected', { userId, socketId: socket.id, orgId: organizationId });

    // Join organization room (all broadcasts scoped to org)
    if (organizationId) {
      socket.join(`org:${organizationId}`);
    }

    // Join personal room (for user-specific notifications)
    socket.join(`user:${userId}`);

    // Track online presence
    redis.sadd(`online:${organizationId}`, userId).catch(() => {});
    redis.expire(`online:${organizationId}`, 3600).catch(() => {});

    // Broadcast presence to org
    socket.to(`org:${organizationId}`).emit('user:online', { userId, userEmail });

    // ── Typing indicator ──────────────────────────────────────────────────────
    socket.on('typing:start', (data) => {
      const { contactId } = data;
      socket.to(`org:${organizationId}`).emit('typing:start', {
        contactId,
        userId,
        userEmail,
      });
      // Auto-expire after 5 seconds
      redis.set(
        `typing:${organizationId}:${contactId}:${userId}`,
        '1',
        'EX', 5
      ).catch(() => {});
    });

    socket.on('typing:stop', (data) => {
      const { contactId } = data;
      socket.to(`org:${organizationId}`).emit('typing:stop', { contactId, userId });
      redis.del(`typing:${organizationId}:${contactId}:${userId}`).catch(() => {});
    });

    // ── Mark messages as read ─────────────────────────────────────────────────
    socket.on('messages:read', (data) => {
      const { contactId, messageIds } = data;
      socket.to(`org:${organizationId}`).emit('messages:read', {
        contactId,
        messageIds,
        readBy: userId,
      });
    });

    // ── Join contact room (for live chat view) ────────────────────────────────
    socket.on('conversation:join', (data) => {
      const { contactId } = data;
      socket.join(`conversation:${organizationId}:${contactId}`);
      logger.debug('Joined conversation room', { userId, contactId });
    });

    socket.on('conversation:leave', (data) => {
      const { contactId } = data;
      socket.leave(`conversation:${organizationId}:${contactId}`);
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId, socketId: socket.id, reason });
      redis.srem(`online:${organizationId}`, userId).catch(() => {});
      socket.to(`org:${organizationId}`).emit('user:offline', { userId });
    });
  });

  // ── Redis Pub/Sub subscriber (downstream services publish events here) ───────
  // Downstream services publish to Redis channels; gateway forwards to Socket.IO rooms.
  const subscriber = new (require('ioredis'))({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableReadyCheck: false,
  });

  subscriber.connect().then(() => {
    subscriber.subscribe(
      'nyife:socket:org',       // org-scoped broadcast
      'nyife:socket:user',      // user-specific event
      'nyife:socket:campaign',  // campaign status update
      (err) => {
        if (err) logger.error('Redis subscribe error', { error: err.message });
        else logger.info('Redis pub/sub subscribed for socket relay');
      }
    );

    subscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        switch (channel) {
          case 'nyife:socket:org':
            // { orgId, event, payload }
            io.to(`org:${data.orgId}`).emit(data.event, data.payload);
            break;
          case 'nyife:socket:user':
            // { userId, event, payload }
            io.to(`user:${data.userId}`).emit(data.event, data.payload);
            break;
          case 'nyife:socket:campaign':
            // { orgId, campaignId, event, payload }
            io.to(`org:${data.orgId}`).emit('campaign:update', {
              campaignId: data.campaignId,
              ...data.payload,
            });
            break;
        }
      } catch (err) {
        logger.error('Socket relay error', { channel, error: err.message });
      }
    });
  }).catch((err) => {
    logger.error('Redis pub/sub connect failed', { error: err.message });
  });

  logger.info('Socket.IO initialized');
  return io;
};

/**
 * Helper used by downstream services (via Redis pub/sub) to emit to org rooms.
 * Downstream services call this indirectly by publishing to Redis channel.
 */
const emitToOrg = async (redisClient, orgId, event, payload) => {
  await redisClient.publish('nyife:socket:org', JSON.stringify({ orgId, event, payload }));
};

const emitToUser = async (redisClient, userId, event, payload) => {
  await redisClient.publish('nyife:socket:user', JSON.stringify({ userId, event, payload }));
};

module.exports = { initSocketIO, emitToOrg, emitToUser };
