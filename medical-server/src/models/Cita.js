// ═══════════════════════════════════════════════════════════════
// src/models/Cita.js
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  pacienteId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Paciente',
    required: true
  },
  doctorId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Doctor',
    required: true
  },
  fechaHora: { type: Date, required: true },
  motivo:    { type: String, required: true, trim: true },
  estado: {
    type:    String,
    enum:    ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'],
    default: 'pendiente'
  },
  tipo: {
    type:    String,
    enum:    ['primera_vez', 'control', 'urgencia'],
    default: 'primera_vez'
  },
  observaciones:     { type: String, trim: true },
  // Datos de cancelación
  canceladoPor:      { type: String, trim: true },
  motivoCancelacion: { type: String, trim: true }
}, { timestamps: true, collection: 'citas' });

// ── Índices ───────────────────────────────────────────────────
// Solapamiento/agenda del doctor y verificación de disponibilidad
citaSchema.index({ doctorId: 1, fechaHora: 1 });
// Listado de citas del paciente (más recientes primero)
citaSchema.index({ pacienteId: 1, fechaHora: -1 });
// Filtros por estado
citaSchema.index({ estado: 1 });

module.exports = mongoose.model('Cita', citaSchema);
