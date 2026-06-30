// ═══════════════════════════════════════════════════════════════
// src/config/logger.js — Logger profesional con Winston
// ═══════════════════════════════════════════════════════════════

const winston = require('winston');
const path    = require('path');

// Niveles personalizados incluyendo 'http' para Morgan
const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const logger = winston.createLogger({
  levels,
  level: 'http', // Capturar desde http hacia arriba
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Solo errores en archivo separado
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level:    'error'
    }),
    // Todos los logs en archivo combined
    new winston.transports.File({
      filename: path.join('logs', 'combined.log')
    }),
    // Consola con colores para desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, stack }) =>
          stack
            ? `${timestamp} [${level}]: ${message}\n${stack}`
            : `${timestamp} [${level}]: ${message}`
        )
      )
    })
  ]
});

module.exports = logger;
