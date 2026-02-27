'use strict';

const { Kafka, CompressionTypes, logLevel } = require('kafkajs');
const { createLogger } = require('../logger');

const logger = createLogger('kafka-producer');

/**
 * Creates a Kafka producer instance with retry logic and acknowledgement config.
 *
 * @param {object} config
 * @param {string[]} config.brokers
 * @param {string} config.clientId
 * @returns {{ producer: import('kafkajs').Producer, connect: Function, disconnect: Function, send: Function, sendBatch: Function }}
 */
const createProducer = (config) => {
  const kafka = new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });

  const producer = kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
  });

  const connect = async () => {
    await producer.connect();
    logger.info('Kafka producer connected', { clientId: config.clientId });
  };

  const disconnect = async () => {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  };

  /**
   * Send a single message to a topic.
   * Fire-and-forget (acks=0) for analytics events.
   * Acknowledged (acks=-1) for critical paths.
   *
   * @param {string} topic
   * @param {object} message  - must have key and value
   * @param {boolean} waitForAck
   */
  const send = async (topic, message, waitForAck = true) => {
    const record = {
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: message.key ? String(message.key) : null,
          value: JSON.stringify(message.value),
          headers: message.headers || {},
        },
      ],
    };

    try {
      if (waitForAck) {
        await producer.send({ ...record, acks: -1 });
      } else {
        producer.send({ ...record, acks: 0 }).catch((err) => {
          logger.error('Fire-and-forget Kafka send failed', { topic, error: err.message });
        });
      }
      logger.debug('Kafka message sent', { topic, key: message.key });
    } catch (err) {
      logger.error('Kafka send error', { topic, error: err.message, stack: err.stack });
      throw err;
    }
  };

  /**
   * Send multiple messages in a single batch (for bulk campaign dispatch).
   *
   * @param {string} topic
   * @param {Array<{key: string, value: object, headers?: object}>} messages
   */
  const sendBatch = async (topic, messages) => {
    const records = messages.map((m) => ({
      key: m.key ? String(m.key) : null,
      value: JSON.stringify(m.value),
      headers: m.headers || {},
    }));

    try {
      await producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        acks: -1,
        messages: records,
      });
      logger.debug('Kafka batch sent', { topic, count: messages.length });
    } catch (err) {
      logger.error('Kafka batch send error', { topic, error: err.message });
      throw err;
    }
  };

  return { producer, connect, disconnect, send, sendBatch };
};

module.exports = { createProducer };
