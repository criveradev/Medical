// ═══════════════════════════════════════════════════════════════
// src/config/swagger.js — Documentación API con Swagger
// ═══════════════════════════════════════════════════════════════

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Medical API',
      version:     '1.0.0',
      description: 'API REST para sistema de citas médicas — MEAN Stack'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo' }
    ],
    components: {
      securitySchemes: {
        // Esquema de autenticación Bearer JWT
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    // Aplicar autenticación a todos los endpoints por defecto
    security: [{ bearerAuth: [] }]
  },
  // Leer comentarios JSDoc de todos los archivos de rutas
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
