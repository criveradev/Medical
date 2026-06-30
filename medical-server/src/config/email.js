// ═══════════════════════════════════════════════════════════════
// src/config/email.js — Configuración de Nodemailer
// ═══════════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');
const logger     = require('./logger');

let transporter;

if (process.env.NODE_ENV === 'test') {
  // En tests no se envía correo real: transporte simulado para no depender de
  // SMTP (que sería lento o fallaría) y para no enviar correos durante las pruebas.
  transporter = {
    sendMail: async () => ({ messageId: 'test' }),
    verify:   () => {}
  };
} else if (process.env.BREVO_API_KEY) {
  // En producción con API HTTP de Brevo (ver email.service.js) NO se usa SMTP:
  // se evita crear el transporte y el verify() para no provocar timeouts en
  // hosts que bloquean los puertos SMTP (Render free, Railway…).
  logger.info('Email vía API HTTP de Brevo (sin SMTP)');
  transporter = {
    sendMail: async () => ({ messageId: 'brevo-api' }),
    verify:   () => {}
  };
} else {
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verificar conexión al arrancar el servidor
  transporter.verify((error) => {
    if (error) {
      logger.warn(`Error conexión email: ${error.message}`);
    } else {
      logger.info('Servidor de email listo');
    }
  });
}

module.exports = transporter;
