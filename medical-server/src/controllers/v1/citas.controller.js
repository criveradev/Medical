// ═══════════════════════════════════════════════════════════════
// src/controllers/citas.controller.js
// Lógica de negocio para citas médicas
// Incluye: verificación de disponibilidad, notificaciones Socket.io y email
// ═══════════════════════════════════════════════════════════════

const Cita     = require('../../models/Cita');
const Doctor   = require('../../models/Doctor');
const Paciente = require('../../models/Paciente');
const { enviarConfirmacionCita, enviarCancelacionCita, enviarCitaAgendada } = require('../../services/email.service');
const notificaciones = require('../../services/notificaciones.service');
const logger         = require('../../config/logger');

// Populate anidado reutilizable para citas
const populateCita = [
  { path: 'pacienteId', populate: { path: 'usuarioId', select: 'nombre apellido email telefono' } },
  { path: 'doctorId',   populate: [
    { path: 'usuarioId',     select: 'nombre apellido' },
    { path: 'especialidadId', select: 'nombre' }
  ]}
];

/**
 * Lista citas con paginación y filtros (estado, doctor, fecha). Si el solicitante
 * es paciente (req.pacienteScope), se restringe a sus propias citas.
 * @route GET /api/citas
 * @param {import('express').Request} req - query: { page, limit, estado, doctorId, fecha }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { total, pagina, totalPaginas, citas }.
 */
exports.listar = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const { estado, doctorId, fecha } = req.query;
    const filtro = {};

    if (estado)   filtro.estado   = estado;
    if (doctorId) filtro.doctorId = doctorId;
    // Un paciente solo ve sus propias citas
    if (req.pacienteScope) filtro.pacienteId = req.pacienteScope;
    if (fecha) {
      const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0);
      const fin    = new Date(fecha); fin.setHours(23, 59, 59, 999);
      filtro.fechaHora = { $gte: inicio, $lte: fin };
    }

    const total = await Cita.countDocuments(filtro);
    const citas = await Cita.find(filtro)
      .populate(populateCita)
      .skip(skip).limit(limit).sort({ fechaHora: 1 });

    res.json({ total, pagina: page, totalPaginas: Math.ceil(total / limit), citas });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve una cita por ID con populate profundo (paciente, doctor, especialidad).
 * Un paciente solo puede ver su propia cita.
 * @route GET /api/citas/:id
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { cita } | 403 ajena | 404 no encontrada.
 */
exports.obtener = async (req, res, next) => {
  try {
    const cita = await Cita.findById(req.params.id).populate(populateCita);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    // Un paciente solo puede ver su propia cita
    if (req.pacienteScope) {
      const pid = String(cita.pacienteId?._id || cita.pacienteId);
      if (pid !== req.pacienteScope)
        return res.status(403).json({ mensaje: 'No autorizado sobre este recurso' });
    }

    res.json({ cita });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una cita. Verifica que existan doctor y paciente, comprueba la
 * disponibilidad del doctor (detección de solapamientos), notifica por Socket.io
 * y envía email de "cita agendada" al paciente.
 * @route POST /api/citas
 * @param {import('express').Request} req - body: { pacienteId, doctorId, fechaHora, motivo, tipo, observaciones }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 { cita } | 404 doctor/paciente | 409 horario ocupado.
 */
exports.crear = async (req, res, next) => {
  try {
    const { pacienteId, doctorId, fechaHora, motivo, tipo, observaciones } = req.body;

    const doctor   = await Doctor.findById(doctorId).populate('usuarioId', 'nombre apellido');
    if (!doctor)   return res.status(404).json({ mensaje: 'Doctor no encontrado' });
    const paciente = await Paciente.findById(pacienteId).populate('usuarioId', 'nombre apellido email');
    if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

    // Verificar disponibilidad del doctor en ese horario.
    // Dos intervalos [aIni,aFin) y [bIni,bFin) se solapan si aIni < bFin && bIni < aFin.
    // Como no guardamos fechaFin, aproximamos la duración de las citas existentes
    // con la del doctor. Buscamos cualquier cita activa que empiece dentro del
    // intervalo (nueva-duración, nueva+duración) y validamos el solape real.
    const fechaCita = new Date(fechaHora);
    const duracion  = doctor.duracionConsulta || 30;
    const fechaFin  = new Date(fechaCita.getTime() + duracion * 60000);
    const ventanaInicio = new Date(fechaCita.getTime() - duracion * 60000);

    const posibles = await Cita.find({
      doctorId,
      estado:    { $nin: ['cancelada', 'no_asistio'] },
      fechaHora: { $gt: ventanaInicio, $lt: fechaFin }
    });

    const haySolape = posibles.some((c) => {
      const ini = new Date(c.fechaHora).getTime();
      const fin = ini + duracion * 60000;
      // solape si: nuevaIni < finExistente && existenteIni < nuevaFin
      return fechaCita.getTime() < fin && ini < fechaFin.getTime();
    });

    if (haySolape)
      return res.status(409).json({ mensaje: 'El doctor ya tiene una cita en ese horario' });

    let cita;
    try {
      cita = await Cita.create({ pacienteId, doctorId, fechaHora, motivo, tipo, observaciones });
    } catch (err) {
      // Índice único {doctorId, fechaHora}: bajo concurrencia atrapa la doble reserva exacta
      if (err.code === 11000)
        return res.status(409).json({ mensaje: 'El doctor ya tiene una cita en ese horario' });
      throw err;
    }

    // Notificar en tiempo real al doctor y admins
    notificaciones.citaCreada(cita);

    // Enviar email al paciente avisando que su cita fue agendada
    try {
      if (paciente.usuarioId?.email) {
        await enviarCitaAgendada({
          pacienteNombre: `${paciente.usuarioId.nombre} ${paciente.usuarioId.apellido}`,
          pacienteEmail:  paciente.usuarioId.email,
          doctorNombre:   doctor.usuarioId ? `Dr. ${doctor.usuarioId.nombre} ${doctor.usuarioId.apellido}` : 'Profesional',
          fechaHora,
          motivo
        });
      }
    } catch (emailError) {
      logger.error(`Error enviando email de cita agendada: ${emailError.message}`);
    }

    res.status(201).json({ mensaje: 'Cita creada', cita });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza los datos básicos de una cita (fecha/hora, motivo, tipo, observaciones).
 * @route PUT /api/citas/:id
 * @param {import('express').Request} req - params: { id }; body parcial.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { cita } | 404 no encontrada.
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { fechaHora, motivo, tipo, observaciones } = req.body;
    const cita = await Cita.findByIdAndUpdate(
      req.params.id, { fechaHora, motivo, tipo, observaciones }, { returnDocument: 'after' }
    );
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json({ mensaje: 'Cita actualizada', cita });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado de una cita (confirmada, cancelada, completada, etc.).
 * Envía email de confirmación o de cancelación según corresponda y notifica
 * por Socket.io.
 * @route PUT /api/citas/:id/estado
 * @param {import('express').Request} req - body: { estado, motivoCancelacion, canceladoPor }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { cita } | 404 no encontrada.
 */
exports.cambiarEstado = async (req, res, next) => {
  try {
    const { estado, motivoCancelacion, canceladoPor } = req.body;

    const cita = await Cita.findByIdAndUpdate(
      req.params.id, { estado, motivoCancelacion, canceladoPor }, { returnDocument: 'after' }
    ).populate(populateCita);

    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    // Enviar email de confirmación al cambiar a estado 'confirmada'
    if (estado === 'confirmada') {
      try {
        const pacienteUser = cita.pacienteId.usuarioId;
        const doctorUser   = cita.doctorId.usuarioId;
        await enviarConfirmacionCita({
          pacienteNombre: `${pacienteUser.nombre} ${pacienteUser.apellido}`,
          pacienteEmail:  pacienteUser.email,
          doctorNombre:   `Dr. ${doctorUser.nombre} ${doctorUser.apellido}`,
          fechaHora:      cita.fechaHora,
          motivo:         cita.motivo
        });
      } catch (emailError) {
        logger.error(`Error enviando email de confirmación: ${emailError.message}`);
      }
    }

    // Enviar email al paciente cuando la cita se cancela
    if (estado === 'cancelada') {
      try {
        const pacienteUser = cita.pacienteId.usuarioId;
        const doctorUser   = cita.doctorId?.usuarioId;
        await enviarCancelacionCita({
          pacienteNombre:    `${pacienteUser.nombre} ${pacienteUser.apellido}`,
          pacienteEmail:     pacienteUser.email,
          doctorNombre:      doctorUser ? `Dr. ${doctorUser.nombre} ${doctorUser.apellido}` : 'Profesional',
          fechaHora:         cita.fechaHora,
          motivoCancelacion: cita.motivoCancelacion
        });
      } catch (emailError) {
        logger.error(`Error enviando email de cancelación: ${emailError.message}`);
      }
    }

    // Notificar cambio de estado al doctor y paciente
    notificaciones.citaActualizada(cita);

    res.json({ mensaje: `Cita ${estado}`, cita });
  } catch (error) {
    next(error);
  }
};

/**
 * Genera los bloques (slots) de atención del doctor para una fecha, según sus
 * horarios, y marca cuáles están ocupados por citas activas.
 * @route GET /api/citas/disponibilidad/:doctorId
 * @param {import('express').Request} req - params: { doctorId }; query: { fecha }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { fecha, doctorId, slots[] } | 400 falta fecha | 404 doctor.
 */
exports.disponibilidad = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: 'La fecha es requerida' });

    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    const dias      = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = dias[new Date(fecha).getDay()];
    const horario   = doctor.horarios.find(h => h.dia === diaSemana && h.activo);

    if (!horario)
      return res.json({ disponible: false, mensaje: `El doctor no atiende los ${diaSemana}` });

    const duracion      = doctor.duracionConsulta || 30;
    const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
    const [hFin, mFin] = horario.horaFin.split(':').map(Number);

    const slots   = [];
    let current   = new Date(fecha); current.setHours(hIni, mIni, 0, 0);
    const fin     = new Date(fecha); fin.setHours(hFin, mFin, 0, 0);
    while (current < fin) {
      slots.push(new Date(current));
      current = new Date(current.getTime() + duracion * 60000);
    }

    const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha); finDia.setHours(23, 59, 59, 999);

    const citasDelDia = await Cita.find({
      doctorId:  req.params.doctorId,
      estado:    { $nin: ['cancelada', 'no_asistio'] },
      fechaHora: { $gte: inicio, $lte: finDia }
    });

    const ocupados    = citasDelDia.map(c => new Date(c.fechaHora).getTime());
    const disponibles = slots.map(slot => ({
      hora:       slot.toTimeString().slice(0, 5),
      fechaHora:  slot,
      disponible: !ocupados.includes(slot.getTime())
    }));

    res.json({ fecha, doctorId: req.params.doctorId, slots: disponibles });
  } catch (error) {
    next(error);
  }
};
