// ═══════════════════════════════════════════════════════════════
// src/middleware/morgan.js — Log de requests HTTP con Morgan
// ═══════════════════════════════════════════════════════════════

const morgan = require('morgan');
const logger = require('../config/logger');

// Stream que redirige los logs de Morgan a Winston
const stream = {
  write: (message) => logger.http(message.trim())
};

// En test no loguear requests HTTP para mantener la salida limpia
const morganMiddleware = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : morgan(':method :url :status :res[content-length] - :response-time ms', { stream });

module.exports = morganMiddleware;
