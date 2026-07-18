// ═══════════════════════════════════════════════════════════════
// src/controllers/reportes.controller.js — Estadísticas y reportes
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const Cita      = require('../../models/Cita');
const Paciente  = require('../../models/Paciente');
const Historial = require('../../models/Historial');
const Pago      = require('../../models/Pago');
const Doctor    = require('../../models/Doctor');
const { generarPDFDoctor, generarExcelDoctor } = require('../../services/exportar.service');

/**
 * Reporte estadístico de un doctor (atenciones, pacientes únicos, citas por estado
 * y por mes, últimas atenciones y diagnósticos frecuentes) en un rango de fechas.
 * @route GET /api/reportes/doctor/:doctorId?desde=&hasta=
 * @param {import('express').Request} req - params: { doctorId }; query: { desde, hasta }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 con el reporte en JSON.
 */
exports.reporteDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { desde, hasta } = req.query;

    const filtroFecha = {};
    if (desde || hasta) {
      filtroFecha.fechaHora = {};
      if (desde) filtroFecha.fechaHora.$gte = new Date(desde);
      if (hasta) filtroFecha.fechaHora.$lte = new Date(hasta);
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ mensaje: 'ID de doctor inválido' });

    const doctorObjectId = mongoose.Types.ObjectId.createFromHexString(doctorId);

    // Citas agrupadas por estado
    const citasPorEstado = await Cita.aggregate([
      { $match: { doctorId: doctorObjectId, ...filtroFecha } },
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]);

    // Citas agrupadas por mes
    const citasPorMes = await Cita.aggregate([
      { $match: { doctorId: doctorObjectId, ...filtroFecha } },
      { $group: { _id: { mes: { $month: '$fechaHora' }, anio: { $year: '$fechaHora' } }, total: { $sum: 1 } } },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } }
    ]);

    // Total de atenciones completadas
    const totalAtenciones = await Cita.countDocuments({ doctorId, estado: 'completada', ...filtroFecha });

    // Pacientes únicos atendidos
    const pacientesUnicos = await Cita.distinct('pacienteId', { doctorId, estado: 'completada', ...filtroFecha });

    // Últimas 5 atenciones con datos del paciente
    const ultimasAtenciones = await Cita.find({ doctorId, estado: 'completada' })
      .populate({ path: 'pacienteId', populate: { path: 'usuarioId', select: 'nombre apellido' } })
      .sort({ fechaHora: -1 }).limit(5);

    // Top 5 diagnósticos más frecuentes
    const diagnosticosFrecuentes = await Historial.aggregate([
      { $match: { doctorId: doctorObjectId } },
      { $group: { _id: '$diagnostico', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      periodo: { desde, hasta },
      resumen: {
        totalAtenciones,
        totalPacientesUnicos: pacientesUnicos.length,
        citasPorEstado,
        citasPorMes
      },
      ultimasAtenciones,
      diagnosticosFrecuentes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reporte general del sistema: total de pacientes, recaudado, citas por estado y
 * por mes en un rango de fechas.
 * @route GET /api/reportes/admin?desde=&hasta=
 * @param {import('express').Request} req - query: { desde, hasta }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { periodo, resumen }.
 */
exports.reporteAdmin = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = {};
    if (desde || hasta) {
      filtroFecha.createdAt = {};
      if (desde) filtroFecha.createdAt.$gte = new Date(desde);
      if (hasta) filtroFecha.createdAt.$lte = new Date(hasta);
    }

    const totalPacientes = await Paciente.countDocuments({ activo: true });

    const citasPorEstado = await Cita.aggregate([
      { $match: filtroFecha },
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]);

    // Total recaudado en el período
    const pagos = await Pago.aggregate([
      { $match: { estado: 'pagado', ...filtroFecha } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]);

    const citasPorMes = await Cita.aggregate([
      { $match: filtroFecha },
      { $group: { _id: { mes: { $month: '$createdAt' }, anio: { $year: '$createdAt' } }, total: { $sum: 1 } } },
      { $sort: { '_id.anio': 1, '_id.mes': 1 } }
    ]);

    res.json({
      periodo: { desde, hasta },
      resumen: {
        totalPacientes,
        totalRecaudado: pagos[0]?.total || 0,
        citasPorEstado,
        citasPorMes
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: obtener datos del reporte del doctor ─────────────────────────────
/**
 * Helper interno: arma los datos del reporte de un doctor (compartido por las
 * versiones JSON, PDF y Excel).
 * @param {string} doctorId - ID del doctor.
 * @param {string} [desde] - Fecha inicial (ISO) del rango.
 * @param {string} [hasta] - Fecha final (ISO) del rango.
 * @returns {Promise<object|null>} Datos del reporte, o null si el ID es inválido.
 */
const _datosReporteDoctor = async (doctorId, desde, hasta) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) return null;

  const doctorObjectId = mongoose.Types.ObjectId.createFromHexString(doctorId);
  const filtroFecha = {};
  if (desde || hasta) {
    filtroFecha.fechaHora = {};
    if (desde) filtroFecha.fechaHora.$gte = new Date(desde);
    if (hasta) filtroFecha.fechaHora.$lte = new Date(hasta);
  }

  const doctorDoc = await Doctor.findById(doctorId)
    .populate('usuarioId',    'nombre apellido')
    .populate('especialidadId', 'nombre');

  const [citasPorEstado, citasPorMes, totalAtenciones, pacientesUnicos, ultimasAtenciones, diagnosticosFrecuentes] =
    await Promise.all([
      Cita.aggregate([
        { $match: { doctorId: doctorObjectId, ...filtroFecha } },
        { $group: { _id: '$estado', total: { $sum: 1 } } }
      ]),
      Cita.aggregate([
        { $match: { doctorId: doctorObjectId, ...filtroFecha } },
        { $group: { _id: { mes: { $month: '$fechaHora' }, anio: { $year: '$fechaHora' } }, total: { $sum: 1 } } },
        { $sort: { '_id.anio': 1, '_id.mes': 1 } }
      ]),
      Cita.countDocuments({ doctorId, estado: 'completada', ...filtroFecha }),
      Cita.distinct('pacienteId', { doctorId, estado: 'completada', ...filtroFecha }),
      Cita.find({ doctorId, estado: 'completada' })
        .populate({ path: 'pacienteId', populate: { path: 'usuarioId', select: 'nombre apellido' } })
        .sort({ fechaHora: -1 }).limit(10),
      Historial.aggregate([
        { $match: { doctorId: doctorObjectId } },
        { $group: { _id: '$diagnostico', total: { $sum: 1 } } },
        { $sort: { total: -1 } }, { $limit: 5 }
      ])
    ]);

  return {
    doctor: {
      nombre:       doctorDoc ? `Dr. ${doctorDoc.usuarioId?.nombre} ${doctorDoc.usuarioId?.apellido}` : '—',
      especialidad: doctorDoc?.especialidadId?.nombre || '—'
    },
    periodo: { desde, hasta },
    resumen: {
      totalAtenciones,
      totalPacientesUnicos: pacientesUnicos.length,
      citasPorEstado,
      citasPorMes
    },
    ultimasAtenciones,
    diagnosticosFrecuentes
  };
};

/**
 * Genera y descarga el reporte del doctor en PDF (pdfkit).
 * @route GET /api/reportes/doctor/:doctorId/pdf?desde=&hasta=
 * @param {import('express').Request} req - params: { doctorId }; query: { desde, hasta }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 stream PDF | 400 ID inválido.
 */
exports.reporteDoctorPDF = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { desde, hasta } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ mensaje: 'ID de doctor inválido' });

    const datos = await _datosReporteDoctor(doctorId, desde, hasta);
    generarPDFDoctor(datos, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Genera y descarga el reporte del doctor en Excel (exceljs).
 * @route GET /api/reportes/doctor/:doctorId/excel?desde=&hasta=
 * @param {import('express').Request} req - params: { doctorId }; query: { desde, hasta }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 stream Excel | 400 ID inválido.
 */
exports.reporteDoctorExcel = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { desde, hasta } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ mensaje: 'ID de doctor inválido' });

    const datos = await _datosReporteDoctor(doctorId, desde, hasta);
    await generarExcelDoctor(datos, res);
  } catch (error) {
    next(error);
  }
};
