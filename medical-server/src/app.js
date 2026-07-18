// ═══════════════════════════════════════════════════════════════
// src/app.js — Configuración de Express
// Middlewares de seguridad, CORS, rutas y manejo de errores
// ═══════════════════════════════════════════════════════════════

// NOTA: Sentry se inicializa en el entry point (server.js → ./instrument),
// que debe cargarse antes que cualquier otra librería para que la
// auto-instrumentación de Sentry v10 funcione. No inicializar aquí.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const {
  API_VERSION,
  API_PREFIX,
  API_DOCS_PATH,
  LEGACY_API_PREFIX,
  LEGACY_API_DOCS_PATH,
} = require('./config/api');
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

app.use(LEGACY_API_PREFIX, limiterGeneral);
app.use(`${API_PREFIX}/auth/login`, limiterLogin);
app.use(`${LEGACY_API_PREFIX}/auth/login`, limiterLogin);

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

// Sanitización XSS — excluye las rutas de Swagger para no romper la UI
app.use((req, res, next) => {
  if (req.path.startsWith(API_DOCS_PATH) || req.path.startsWith(LEGACY_API_DOCS_PATH)) return next();
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
  res.json({ servicio: 'Medical API', estado: 'ok', version: API_VERSION, docs: API_DOCS_PATH });
});

// ── Health check ──────────────────────────────────────────────
// Endpoint simple para verificar que el servicio está vivo (deploys, uptime).
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Documentación Swagger ─────────────────────────────────────
app.use(API_DOCS_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Medical API Docs'
}));
app.use(LEGACY_API_DOCS_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Medical API Docs'
}));

// ── Rutas de la API — v1 ──────────────────────────────────────
// Cada versión es un árbol de rutas/controladores independiente
// (./routes/v1, ./controllers/v1). Comparten modelos, servicios y
// middleware, pero pueden divergir en validación y forma de respuesta
// sin afectar a otras versiones.
//
// LEGACY_API_PREFIX (/api sin versión) se mantiene como alias de v1
// por compatibilidad con clientes existentes; el día que exista v2,
// este alias debe seguir apuntando a v1 (el default), no a la última.
const rutasV1 = {
  auth: require('./routes/v1/auth.routes'),
  departamentos: require('./routes/v1/departamentos.routes'),
  especialidades: require('./routes/v1/especialidades.routes'),
  doctores: require('./routes/v1/doctores.routes'),
  pacientes: require('./routes/v1/pacientes.routes'),
  citas: require('./routes/v1/citas.routes'),
  historial: require('./routes/v1/historial.routes'),
  pagos: require('./routes/v1/pagos.routes'),
  resultados: require('./routes/v1/resultados.routes'),
  reportes: require('./routes/v1/reportes.routes'),
};

for (const [recurso, router] of Object.entries(rutasV1)) {
  app.use(`${API_PREFIX}/${recurso}`, router);
  app.use(`${LEGACY_API_PREFIX}/${recurso}`, router);
}

// ── Rutas de la API — v2 ──────────────────────────────────────
// Cuando exista una v2 real, se agrega aquí sin tocar lo anterior:
//
// const rutasV2 = { citas: require('./routes/v2/citas.routes'), ... };
// for (const [recurso, router] of Object.entries(rutasV2)) {
//   app.use(`/api/v2/${recurso}`, router);
// }
//
// Los recursos que v2 NO redefina deben seguir sirviéndose desde v1
// (fallback explícito), o quedar fuera de v2 hasta migrarse.

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
