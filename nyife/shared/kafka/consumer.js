'use strict';

const { Kafka, logLevel } = require('kafkajs');
const { createLogger } = require('../logger');

const logger = createLogger('kafka-consumer');

/**
 * Creates a Kafka consumer with idempotency (Redis dedup) and DLQ support.
 *
 * @param {object} config
 * @param {string[]} config.brokers
 * @param {string} config.clientId
 * @param {string} config.groupId
 * @param {import('ioredis').Redis} config.redis   - for deduplication
 * @param {object} config.producer                 - shared producer for DLQ
 * @param {string} config.dlqTopic                 - DLQ topic name
 * @returns {object}
 */
const createConsumer = (config) => {
  const kafka = new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });

  const consumer = kafka.consumer({
    groupId: config.groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576, // 1MB
  });

  const connect = async () => {
    await consumer.connect();
    logger.info('Kafka consumer connected', { groupId: config.groupId });
  };

  const disconnect = async () => {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  };

  /**
   * Subscribe to one or more topics.
   * @param {string|string[]} topics
   * @param {boolean} fromBeginning
   */
  const subscribe = async (topics, fromBeginning = false) => {
    const topicList = Array.isArray(topics) ? topics : [topics];
    for (const topic of topicList) {
      await consumer.subscribe({ topic, fromBeginning });
    }
    logger.info('Subscribed to topics', { topics: topicList });
  };

  /**
   * Start consuming messages with idempotency check.
   *
   * @param {Function} handler  - async (message: { topic, partition, key, value, headers }) => void
   * @param {object} options
   * @param {boolean} options.autoCommit  default true
   * @param {number} options.dedupTtlSecs  Redis dedup TTL, default 86400 (24h)
   */
  const run = async (handler, options = {}) => {
    const { autoCommit = true, dedupTtlSecs = 86400 } = options;

    await consumer.run({
      autoCommit,
      eachMessage: async ({ topic, partition, message }) => {
        const rawKey = message.key ? message.key.toString() : null;
        const rawValue = message.value ? message.value.toString() : null;

        if (!rawValue) {
          logger.warn('Empty Kafka message received', { topic, partition });
          return;
        }

        // ── Idempotency: deduplicate by topic+partition+offset in Redis ──
        const dedupKey = `kafka:dedup:${config.groupId}:${topic}:${partition}:${message.offset}`;
        if (config.redis) {
          const already = await config.redis.set(dedupKey, '1', 'EX', dedupTtlSecs, 'NX');
          if (!already) {
            logger.debug('Duplicate Kafka message skipped', { topic, partition, offset: message.offset });
            return;
          }
        }

        let parsed;
        try {
          parsed = JSON.parse(rawValue);
        } catch (parseErr) {
          logger.error('Failed to parse Kafka message', { topic, error: parseErr.message });
          await sendToDLQ(topic, rawKey, rawValue, 'PARSE_ERROR', parseErr.message);
          return;
        }

        try {
          await handler({
            topic,
            partition,
            key: rawKey,
            value: parsed,
            headers: message.headers || {},
            offset: message.offset,
          });
        } catch (handlerErr) {
          logger.error('Kafka message handler failed', {
            topic,
            partition,
            offset: message.offset,
            error: handlerErr.message,
            stack: handlerErr.stack,
          });
          await sendToDLQ(topic, rawKey, rawValue, 'HANDLER_ERROR', handlerErr.message);
          // Do NOT re-throw — we don't want to stop the consumer.
          // DLQ handles the failed message for replay.
        }
      },
    });
  };

  const sendToDLQ = async (originalTopic, key, rawValue, errorType, errorMessage) => {
    if (!config.producer || !config.dlqTopic) return;
    try {
      await config.producer.send(config.dlqTopic, {
        key: key || 'unknown',
        value: {
          originalTopic,
          errorType,
          errorMessage,
          rawPayload: rawValue,
          timestamp: new Date().toISOString(),
          groupId: config.groupId,
        },
      }, false);
      logger.warn('Message sent to DLQ', { dlqTopic: config.dlqTopic, originalTopic, errorType });
    } catch (dlqErr) {
      logger.error('Failed to send to DLQ', { error: dlqErr.message });
    }
  };

  return { consumer, connect, disconnect, subscribe, run };
};

module.exports = { createConsumer };
