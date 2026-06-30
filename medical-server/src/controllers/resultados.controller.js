// ═══════════════════════════════════════════════════════════════
// src/controllers/resultados.controller.js
// Resultados médicos con archivos subidos a Cloudinary
// Al eliminar, borra también el archivo de Cloudinary
// ═══════════════════════════════════════════════════════════════

const Resultado      = require('../models/Resultado');
const Cita           = require('../models/Cita');
const Paciente       = require('../models/Paciente');
const Doctor         = require('../models/Doctor');
const { cloudinary } = require('../config/cloudinary');
const notificaciones = require('../services/notificaciones.service');
const logger         = require('../config/logger');
const { enviarNuevoResultado } = require('../services/email.service');

/**
 * Lista los resultados de un paciente (con doctor y cita poblados).
 * @route GET /api/resultados/paciente/:pacienteId
 * @param {import('express').Request} req - params: { pacienteId }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { total, resultados }.
 */
exports.listarPorPaciente = async (req, res, next) => {
  try {
    const resultados = await Resultado.find({ pacienteId: req.params.pacienteId })
      .populate({ path: 'doctorId', populate: { path: 'usuarioId', select: 'nombre apellido' } })
      .populate('citaId', 'fechaHora motivo')
      .sort({ createdAt: -1 });
    res.json({ total: resultados.length, resultados });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve un resultado por ID con populate profundo. Un paciente solo puede ver
 * resultados propios.
 * @route GET /api/resultados/:id
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { resultado } | 403 ajeno | 404 no encontrado.
 */
exports.obtener = async (req, res, next) => {
  try {
    const resultado = await Resultado.findById(req.params.id)
      .populate({ path: 'pacienteId', populate: { path: 'usuarioId', select: 'nombre apellido' } })
      .populate({ path: 'doctorId',   populate: { path: 'usuarioId', select: 'nombre apellido' } })
      .populate('citaId', 'fechaHora motivo');
    if (!resultado) return res.status(404).json({ mensaje: 'Resultado no encontrado' });

    // Un paciente solo puede ver sus propios resultados
    if (req.pacienteScope) {
      const pid = String(resultado.pacienteId?._id || resultado.pacienteId);
      if (pid !== req.pacienteScope)
        return res.status(403).json({ mensaje: 'No autorizado sobre este recurso' });
    }

    res.json({ resultado });
  } catch (error) {
    next(error);
  }
};

/**
 * Registra un resultado médico (archivo opcional subido a Cloudinary), notifica
 * al paciente por Socket.io y le envía un email avisando del nuevo resultado.
 * @route POST /api/resultados
 * @param {import('express').Request} req - body: { pacienteId, citaId, doctorId, tipo, nombre, descripcion, observaciones, fecha }; req.file opcional.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 { resultado } | 404 cita no encontrada.
 */
exports.crear = async (req, res, next) => {
  try {
    const { pacienteId, citaId, doctorId, tipo, nombre, descripcion, observaciones, fecha } = req.body;

    const cita = await Cita.findById(citaId);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    // URL segura de Cloudinary (si se subió archivo)
    const archivo = req.file ? req.file.path : null;

    const resultado = await Resultado.create({ pacienteId, citaId, doctorId, tipo, nombre, descripcion, archivo, observaciones, fecha });

    // Notificar al paciente (tiempo real)
    notificaciones.resultadoSubido(resultado);

    // Enviar email al paciente avisando del nuevo resultado
    try {
      const pac = await Paciente.findById(pacienteId).populate('usuarioId', 'nombre apellido email');
      const doc = await Doctor.findById(doctorId).populate('usuarioId', 'nombre apellido');
      if (pac?.usuarioId?.email) {
        await enviarNuevoResultado({
          pacienteNombre: `${pac.usuarioId.nombre} ${pac.usuarioId.apellido}`,
          pacienteEmail:  pac.usuarioId.email,
          tipo,
          nombre,
          doctorNombre:   doc?.usuarioId ? `Dr. ${doc.usuarioId.nombre} ${doc.usuarioId.apellido}` : 'Profesional',
        });
      }
    } catch (emailError) {
      logger.error(`Error enviando email de resultado: ${emailError.message}`);
    }

    res.status(201).json({ mensaje: 'Resultado registrado', resultado });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza los metadatos de un resultado (tipo, nombre, descripción, observaciones).
 * @route PUT /api/resultados/:id
 * @param {import('express').Request} req - params: { id }; body parcial.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { resultado } | 404 no encontrado.
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { tipo, nombre, descripcion, observaciones } = req.body;
    const resultado = await Resultado.findByIdAndUpdate(
      req.params.id, { tipo, nombre, descripcion, observaciones }, { returnDocument: 'after' }
    );
    if (!resultado) return res.status(404).json({ mensaje: 'Resultado no encontrado' });
    res.json({ mensaje: 'Resultado actualizado', resultado });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un resultado y, si tenía archivo, lo borra también de Cloudinary.
 * @route DELETE /api/resultados/:id
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 eliminado | 404 no encontrado.
 */
exports.eliminar = async (req, res, next) => {
  try {
    const resultado = await Resultado.findByIdAndDelete(req.params.id);
    if (!resultado) return res.status(404).json({ mensaje: 'Resultado no encontrado' });

    // Eliminar archivo de Cloudinary si existe
    if (resultado.archivo) {
      try {
        // Extraer public_id desde la URL de Cloudinary
        const partes   = resultado.archivo.split('/');
        const archivo  = partes[partes.length - 1];
        const publicId = `medical-app/resultados/${archivo.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch (err) {
        // No bloquear si falla la eliminación en Cloudinary
      }
    }

    res.json({ mensaje: 'Resultado eliminado' });
  } catch (error) {
    next(error);
  }
};
