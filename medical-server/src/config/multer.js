// ═══════════════════════════════════════════════════════════════
// src/config/multer.js — Subida de archivos con Cloudinary
// ═══════════════════════════════════════════════════════════════

const multer               = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary }       = require('./cloudinary');

/**
 * Filtro de Multer: acepta solo PDF, JPG y PNG (resultados médicos).
 * @param {import('express').Request} req
 * @param {Express.Multer.File} file - Archivo entrante.
 * @param {function(Error|null, boolean): void} cb - Callback (error, aceptado).
 * @returns {void}
 */
const fileFilter = (req, file, cb) => {
  const permitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, JPG y PNG'), false);
  }
};

// ── Storage para resultados médicos (PDF + imágenes) ──────────
const storageResultados = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'medical-app/resultados',
    resource_type: 'auto',               // detecta PDF e imagen automáticamente
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    transformation: [{ quality: 'auto' }]
  }
});

// ── Storage para fotos de perfil (solo imágenes) ──────────────
const storageAvatares = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'medical-app/avatares',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// ── Instancias de Multer ──────────────────────────────────────
const uploadResultado = multer({
  storage:    storageResultados,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }   // 5 MB
});

const uploadAvatar = multer({
  storage: storageAvatares,
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }   // 2 MB
});

module.exports = { uploadResultado, uploadAvatar };
