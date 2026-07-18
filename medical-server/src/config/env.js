// ═══════════════════════════════════════════════════════════════
// src/config/env.js — Validación de variables de entorno
// ═══════════════════════════════════════════════════════════════

const requeridasBase = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES',
  'CLIENT_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const requeridasSmtp = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const requeridasResend = ['EMAIL_FROM'];

// Variables opcionales: si faltan, solo se avisa (la app sigue funcionando).
// - SENTRY_DSN: sin él, Sentry queda inactivo (no se reportan errores a terceros).
// - REDIS_*: sin Redis, el caché degrada a consultar MongoDB directamente.
const opcionales = ['SENTRY_DSN'];

/**
 * Verifica que todas las variables de entorno requeridas estén definidas.
 * Si falta alguna, lista las faltantes y termina el proceso (exit 1).
 * @returns {void}
 */
const validarEnv = () => {
  const requeridas = [...requeridasBase];

  if (process.env.NODE_ENV !== 'test') {
    if (process.env.RESEND_API_KEY) {
      requeridas.push(...requeridasResend);
    } else {
      requeridas.push(...requeridasSmtp);
    }
  }

  const faltantes = requeridas.filter(v => !process.env[v]);
  if (faltantes.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    faltantes.forEach(v => console.error(`   - ${v}`));
    console.error('\nAgrega las variables al archivo .env y reinicia el servidor');
    process.exit(1);
  }

  // Avisar (sin bloquear) si falta alguna variable opcional.
  const opcFaltantes = opcionales.filter(v => !process.env[v]);
  if (opcFaltantes.length > 0) {
    console.warn(`⚠️  Variables opcionales no definidas: ${opcFaltantes.join(', ')}`);
  }

  console.log('✅ Variables de entorno validadas');
};

module.exports = validarEnv;
