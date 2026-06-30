// ═══════════════════════════════════════════════════════════════
// src/app.js — Configuración de Express
// Middlewares de seguridad, CORS, rutas y manejo de errores
// ═══════════════════════════════════════════════════════════════

// Sentry solo se inicializa fuera del entorno de test
// para no interferir con Jest ni contaminar los reportes de errores
if (process.env.NODE_ENV !== 'test') {
  require('../instrument');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { origenPermitido } = require('./config/cors');
const morganMW = require('./middleware/morgan');
const xssSanitizer = require('./middleware/xss');
const sanitizar = require('./middleware/sanitizar');
const errores = require('./middleware/errores');
const { authenticate } = require('./middleware/auth');
const { Sentry } = require('./config/sentry');

const app = express();

// ── Proxy de confianza ────────────────────────────────────────
// En producción la app corre detrás de un reverse proxy (Render, etc.) que
// agrega X-Forwarded-For. Sin esto, express-rate-limit vería a todos los
// usuarios como una sola IP y los limitaría en conjunto.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Seguridad HTTP ────────────────────────────────────────────
app.use(helmet());       // Headers de seguridad (CSP, HSTS, etc.)
app.use(compression());  // Compresión gzip de respuestas

// ── Rate limiting ─────────────────────────────────────────────
// General: 100 req/15min en producción, 1000 en desarrollo.
// Configurable con RATE_LIMIT_MAX (útil tras el proxy de dev, donde todas las
// peticiones comparten una IP y el SPA hace varias llamadas por pantalla).
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 100 : 1000),
  message: { mensaje: 'Demasiadas solicitudes, intenta en 15 minutos' }
});

// Login: 5 intentos/15min en producción (protección contra fuerza bruta).
// Configurable con LOGIN_RATE_MAX para no estorbar durante el desarrollo.
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_MAX) || (process.env.NODE_ENV === 'production' ? 5 : 100),
  message: { mensaje: 'Demasiados intentos de login, intenta en 15 minutos' }
});

app.use('/api/', limiterGeneral);
app.use('/api/auth/login', limiterLogin);

// ── CORS ──────────────────────────────────────────────────────
// Permite los orígenes configurados en CLIENT_URL (frontend). La lógica de
// orígenes vive en ./config/cors y la comparte Socket.io (server.js).
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (origenPermitido(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Sanitización ──────────────────────────────────────────────
// Previene inyección NoSQL eliminando operadores $ de body y query
app.use(sanitizar);

// Sanitización XSS — excluye /api/docs para no romper Swagger UI
app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs')) return next();
  xssSanitizer(req, res, next);
});

// ── Logging y archivos estáticos ──────────────────────────────
app.use(morganMW);
// Archivos locales (fallback; producción usa Cloudinary). Protegido: solo
// usuarios autenticados pueden descargar, ya que pueden contener datos clínicos.
app.use('/uploads', authenticate, express.static('uploads'));

// ── Raíz ──────────────────────────────────────────────────────
// Responde 200 en / para health checks por defecto y para que abrir el dominio
// en el navegador no devuelva 404.
app.get('/', (req, res) => {
  res.json({ servicio: 'Medical API', estado: 'ok', docs: '/api/docs' });
});

// ── Health check ──────────────────────────────────────────────
// Endpoint simple para verificar que el servicio está vivo (deploys, uptime).
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Documentación Swagger ─────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Medical API Docs'
}));

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/departamentos', require('./routes/departamentos.routes'));
app.use('/api/especialidades', require('./routes/especialidades.routes'));
app.use('/api/doctores', require('./routes/doctores.routes'));
app.use('/api/pacientes', require('./routes/pacientes.routes'));
app.use('/api/citas', require('./routes/citas.routes'));
app.use('/api/historial', require('./routes/historial.routes'));
app.use('/api/pagos', require('./routes/pagos.routes'));
app.use('/api/resultados', require('./routes/resultados.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));

// ── 404 — Ruta no encontrada ──────────────────────────────────
// Devuelve JSON (no el HTML por defecto de Express) y conserva las cabeceras
// CORS que ya puso el middleware de cors para los orígenes permitidos.
app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Manejo de errores ─────────────────────────────────────────
// Sentry debe ir ANTES del middleware de errores propio
if (process.env.NODE_ENV !== 'test') {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errores); // Captura todos los next(error) de los controladores

module.exports = app;
