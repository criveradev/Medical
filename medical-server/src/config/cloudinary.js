// ═══════════════════════════════════════════════════════════════
// src/config/cloudinary.js — Configuración de Cloudinary
// Almacenamiento de archivos en la nube
// ═══════════════════════════════════════════════════════════════

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'medical-app/resultados', // carpeta en Cloudinary
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
        resource_type: 'auto', // detecta automáticamente si es imagen o PDF
        transformation: [{ quality: 'auto' }] // optimización automática
    }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
    const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF, JPG y PNG'), false);
    }
};

// Instancia de Multer con Cloudinary
const uploadCloud = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

module.exports = { uploadCloud, cloudinary };