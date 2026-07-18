// ═══════════════════════════════════════════════════════════════
// src/config/api.js — Prefijos y versión pública de la API
// ═══════════════════════════════════════════════════════════════

const LEGACY_API_PREFIX = '/api';
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `${LEGACY_API_PREFIX}/${API_VERSION}`;
const LEGACY_API_DOCS_PATH = `${LEGACY_API_PREFIX}/docs`;
const API_DOCS_PATH = `${API_PREFIX}/docs`;

module.exports = {
  LEGACY_API_PREFIX,
  API_VERSION,
  API_PREFIX,
  LEGACY_API_DOCS_PATH,
  API_DOCS_PATH,
};
