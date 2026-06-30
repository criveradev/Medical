// ═══════════════════════════════════════════════════════════════
// src/services/recordatorios.service.js — Cron de recordatorios
// ═══════════════════════════════════════════════════════════════

const cron   = require('node-cron');
const Cita   = require('../models/Cita');
const logger = require('../config/logger');
const { enviarRecordatorioCita } = require('./email.service');

/**
 * Inicia el cron diario (09:00) que busca las citas pendientes/confirmadas del
 * día siguiente y envía un email recordatorio a cada paciente.
 * @returns {void}
 */
const iniciarRecordatorios = () => {
  // Ejecutar todos los días a las 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Ejecutando cron de recordatorios...');

    try {
      // Calcular rango de mañana (00:00 a 23:59)
      const manana    = new Date();
      manana.setDate(manana.getDate() + 1);
      manana.setHours(0, 0, 0, 0);

      const finManana = new Date(manana);
      finManana.setHours(23, 59, 59, 999);

      // Buscar citas de mañana que estén pendientes o confirmadas
      const citas = await Cita.find({
        fechaHora: { $gte: manana, $lte: finManana },
        estado:    { $in: ['pendiente', 'confirmada'] }
      })
      .populate({
        path:     'pacienteId',
        populate: { path: 'usuarioId', select: 'nombre apellido email' }
      })
      .populate({
        path:     'doctorId',
        populate: { path: 'usuarioId', select: 'nombre apellido' }
      });

      logger.info(`Recordatorios: ${citas.length} citas encontradas para mañana`);

      // Enviar email a cada paciente
      for (const cita of citas) {
        try {
          const pacienteUser = cita.pacienteId.usuarioId;
          const doctorUser   = cita.doctorId.usuarioId;

          await enviarRecordatorioCita({
            pacienteNombre: `${pacienteUser.nombre} ${pacienteUser.apellido}`,
            pacienteEmail:  pacienteUser.email,
            doctorNombre:   `Dr. ${doctorUser.nombre} ${doctorUser.apellido}`,
            fechaHora:      cita.fechaHora,
            motivo:         cita.motivo
          });

          logger.info(`Recordatorio enviado a ${pacienteUser.email}`);
        } catch (error) {
          logger.error(`Error enviando recordatorio: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Error en cron recordatorios: ${error.message}`);
    }
  });

  logger.info('Cron de recordatorios iniciado — se ejecuta todos los días a las 9:00 AM');
};

module.exports = iniciarRecordatorios;
