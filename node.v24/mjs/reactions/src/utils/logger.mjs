/**
 * Logging utilities
 * @module utils/logger
 */

import winston from 'winston';

/**
 * Create a Winston logger instance
 * @param {Object} options - Logger options
 * @param {string} [options.level='info'] - Log level
 * @param {boolean} [options.console=true] - Log to console
 * @param {string} [options.file] - Log to file
 * @returns {winston.Logger} Logger instance
 */
export function createLogger(options = {}) {
  const { level = 'info', console: logToConsole = true, file } = options;

  const transports = [];

  if (logToConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          })
        ),
      })
    );
  }

  if (file) {
    transports.push(
      new winston.transports.File({
        filename: file,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({
    level,
    transports,
    exitOnError: false,
  });
}

/**
 * Setup logger based on configuration
 * @param {Object} config - Logging configuration
 * @returns {winston.Logger} Configured logger
 */
export function setupLogger(config = {}) {
  return createLogger({
    level: config.level || 'info',
    console: config.console !== false,
    file: config.file,
  });
}