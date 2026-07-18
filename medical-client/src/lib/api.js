// Cliente HTTP sobre fetch con renovación automática del token.
// En desarrollo, Vite proxea /api → http://localhost:3000 (ver vite.config.js),
// por lo que las llamadas son same-origin y no hay problemas de CORS.
// En producción se define VITE_API_URL con la URL del backend (p. ej. Render);
// si está vacía, las rutas quedan relativas (modo desarrollo con proxy).

/** URL base del backend. Vacía en desarrollo (usa el proxy de Vite). @type {string} */
const API_BASE = import.meta.env.VITE_API_URL || '';
const API_PREFIX = '/api/v1';

function normalizeUrl(url) {
  if (typeof url !== 'string') return url;
  if (url === '/api') return API_PREFIX;
  if (url === API_PREFIX || url.startsWith(`${API_PREFIX}/`)) return url;
  if (url.startsWith('/api/')) {
    return `${API_PREFIX}${url.slice('/api'.length)}`;
  }
  return url;
}

/**
 * Devuelve el access token guardado en localStorage.
 * @returns {string|null} El access token, o null si no hay sesión.
 */
function getToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Guarda los tokens de sesión en localStorage.
 * @param {{accessToken?: string, refreshToken?: string}} param0 - Tokens a persistir.
 * @returns {void}
 */
function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Limpia la sesión (tokens y usuario) del localStorage.
 * @returns {void}
 */
function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Intenta renovar el access token usando el refresh token guardado.
 * @returns {Promise<boolean>} true si la renovación fue exitosa.
 */
async function refrescarToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  const res = await fetch(`${API_BASE}${normalizeUrl('/api/auth/refresh')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data);
  return true;
}

/**
 * Realiza una petición JSON autenticada. Si recibe 401, intenta renovar el token
 * una vez y reintenta; si falla, limpia la sesión y redirige a /login.
 * @param {string} method - Método HTTP (GET/POST/PUT/DELETE).
 * @param {string} url - URL del endpoint.
 * @param {object} [body] - Cuerpo a enviar como JSON.
 * @param {boolean} [_reintento=false] - Uso interno: evita bucles de reintento.
 * @returns {Promise<object>} Cuerpo de la respuesta parseado.
 * @throws {Error} Con el mensaje del servidor si la respuesta no es OK.
 */
async function request(method, url, body, _reintento = false) {
  const normalizedUrl = normalizeUrl(url);
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${normalizedUrl}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token expirado → intentar renovar una vez y reintentar la petición.
  const esEndpointAuth = normalizedUrl.includes('/api/v1/auth/login') || normalizedUrl.includes('/api/v1/auth/refresh');
  if (res.status === 401 && !_reintento && !esEndpointAuth) {
    const ok = await refrescarToken();
    if (ok) return request(method, url, body, true);
    clearSession();
    if (window.location.pathname.startsWith('/portal')) {
      window.location.href = '/login';
    }
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }

  if (!res.ok) {
    const msg =
      data.mensaje ||
      (Array.isArray(data.errores) && data.errores[0]?.msg) ||
      `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/**
 * Subida multipart (archivos). No fija Content-Type para que el navegador
 * establezca el boundary correcto del FormData.
 * @param {string} url - URL del endpoint.
 * @param {FormData} formData - Datos del formulario (incluido el archivo).
 * @param {string} [method='POST'] - Método HTTP.
 * @returns {Promise<object>} Cuerpo de la respuesta parseado.
 * @throws {Error} Con el mensaje del servidor si la respuesta no es OK.
 */
async function uploadRequest(url, formData, method = 'POST') {
  const normalizedUrl = normalizeUrl(url);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${normalizedUrl}`, { method, headers, body: formData });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* sin cuerpo */
  }
  if (!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);
  return data;
}

/**
 * Cliente HTTP de la app. Métodos JSON (get/post/put/del) y subida de archivos
 * (upload), todos con autenticación y renovación de token automática.
 */
export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
  upload: uploadRequest,
};
