// Etiquetas, colores y formateadores compartidos.

export const estadoColor = {
  pendiente: 'amber', confirmada: 'brand', completada: 'green', cancelada: 'red', no_asistio: 'slate',
};

export const labelEstado = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada',
  cancelada: 'Cancelada', no_asistio: 'No asistió',
};

export const estadoPago = {
  pendiente: 'amber', pagado: 'green', anulado: 'slate',
};

/**
 * Formatea una fecha ISO a fecha y hora local chilena (media/corta).
 * @param {string} iso - Fecha en formato ISO.
 * @returns {string} Fecha y hora formateadas.
 */
export const fmtFechaHora = (iso) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Formatea una fecha ISO a fecha local chilena (dd mmm aaaa).
 * @param {string} iso - Fecha en formato ISO.
 * @returns {string} Fecha formateada.
 */
export const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Formatea un RUT chileno al estilo 12.345.678-9 mientras se escribe.
 * @param {string} valor - RUT en cualquier formato (con o sin puntos/guion).
 * @returns {string} RUT formateado con puntos y guion.
 */
export function formatearRut(valor) {
  const limpio = String(valor || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';
  if (limpio.length === 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoFmt = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFmt}-${dv}`;
}

/**
 * Formatea un número como moneda chilena (CLP, sin decimales).
 * @param {number} n - Monto a formatear.
 * @returns {string} Monto formateado (ej. "$12.000").
 */
export const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(n || 0));
