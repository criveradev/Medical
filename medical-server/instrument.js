// ═══════════════════════════════════════════════════════════════
// instrument.js — Inicialización de Sentry
// DEBE ser el primer archivo en cargarse
// ═══════════════════════════════════════════════════════════════

const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // En una app de salud NO enviar PII (IPs, cabeceras, cuerpos) a un tercero.
    // Evita filtrar emails, RUT, tokens y datos clínicos a Sentry.
    sendDefaultPii: false
});