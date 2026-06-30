// ═══════════════════════════════════════════════════════════════
// src/controllers/pacientes.controller.js
// ═══════════════════════════════════════════════════════════════

const Paciente = require('../models/Paciente');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Lista pacientes activos con paginación y búsqueda (nombre, apellido, email o RUT).
 * @route GET /api/pacientes
 * @param {import('express').Request} req - query: { page, limit, buscar }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { total, pagina, totalPaginas, porPagina, pacientes }.
 */
exports.listar = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const buscar = req.query.buscar;

    let filtro = { activo: true };

    // Búsqueda por nombre, apellido, email o RUT
    if (buscar) {
      const usuarios = await User.find({
        $or: [
          { nombre: { $regex: buscar, $options: 'i' } },
          { apellido: { $regex: buscar, $options: 'i' } },
          { email: { $regex: buscar, $options: 'i' } }
        ]
      }).select('_id');

      const ids = usuarios.map(u => u._id);
      filtro.$or = [
        { usuarioId: { $in: ids } },
        { rut: { $regex: buscar, $options: 'i' } }
      ];
    }

    const total = await Paciente.countDocuments(filtro);
    const pacientes = await Paciente.find(filtro)
      .populate('usuarioId', 'nombre apellido email telefono')
      .skip(skip).limit(limit).sort({ createdAt: -1 });

    res.json({ total, pagina: page, totalPaginas: Math.ceil(total / limit), porPagina: limit, pacientes });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve un paciente por ID con los datos de su usuario.
 * @route GET /api/pacientes/:id
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { paciente } | 404 no encontrado.
 */
exports.obtener = async (req, res, next) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
      .populate('usuarioId', 'nombre apellido email telefono');
    if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    res.json({ paciente });
  } catch (error) {
    next(error); // ← pasar el error al middleware para que Sentry lo capture
  }
};

/**
 * Devuelve la ficha del paciente autenticado (sin requerir permiso de módulo).
 * @route GET /api/pacientes/mi-ficha
 * @param {import('express').Request} req - req.user inyectado por authenticate.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { paciente } | 404 si no tiene ficha asociada.
 */
exports.miFicha = async (req, res, next) => {
  try {
    const paciente = await Paciente.findOne({ usuarioId: req.user._id })
      .populate('usuarioId', 'nombre apellido email telefono');
    if (!paciente) return res.status(404).json({ mensaje: 'No tienes una ficha de paciente asociada' });
    res.json({ paciente });
  } catch (error) {
    next(error);
  }
};

/**
 * Registra un paciente: crea su usuario (rol paciente) y su ficha clínica.
 * El RUT se guarda formateado; la contraseña inicial es el RUT sin puntos ni guion.
 * @route POST /api/pacientes
 * @param {import('express').Request} req - body: { nombre, apellido, email, telefono, rut, fechaNacimiento, genero, direccion, prevision, contactoEmergencia }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 { paciente } | 409 RUT/email duplicado.
 */
exports.crear = async (req, res, next) => {
  try {
    const { nombre, apellido, email, telefono, rut, fechaNacimiento, genero, direccion, prevision, contactoEmergencia } = req.body;

    // Crear usuario con rol paciente.
    // Se guarda el RUT formateado, pero la contraseña inicial es el RUT
    // "limpio" (sin puntos ni guion) para que sea más fácil de teclear.
    const role = await Role.findOne({ nombre: 'paciente' });
    if (!role) return res.status(400).json({ mensaje: 'Rol paciente no encontrado, ejecuta el seed de roles' });

    const rutLimpio = String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();

    const user = await User.create({ nombre, apellido, email, password: rutLimpio, roleId: role._id, telefono });
    const paciente = await Paciente.create({ usuarioId: user._id, rut, fechaNacimiento, genero, direccion, prevision, contactoEmergencia });

    res.status(201).json({
      mensaje: 'Paciente registrado',
      paciente,
      nota: 'La contraseña inicial es el RUT sin puntos ni guion'
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ mensaje: 'El RUT o email ya está registrado' });
    next(error);
  }
};

/**
 * Actualiza datos del usuario (nombre, apellido, teléfono) y de la ficha
 * (dirección, previsión, contacto de emergencia) del paciente.
 * @route PUT /api/pacientes/:id
 * @param {import('express').Request} req - params: { id }; body parcial.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { paciente } | 404 no encontrado.
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { nombre, apellido, telefono, direccion, prevision, contactoEmergencia } = req.body;
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

    await User.findByIdAndUpdate(paciente.usuarioId, { nombre, apellido, telefono });
    const actualizado = await Paciente.findByIdAndUpdate(
      req.params.id, { direccion, prevision, contactoEmergencia }, { returnDocument: 'after' }
    ).populate('usuarioId', 'nombre apellido email telefono');

    res.json({ mensaje: 'Paciente actualizado', paciente: actualizado });
  } catch (error) {
    next(error);
  }
};

/**
 * Desactiva (soft delete) un paciente: marca activo=false.
 * @route DELETE /api/pacientes/:id
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 desactivado | 404 no encontrado.
 */
exports.eliminar = async (req, res, next) => {
  try {
    const paciente = await Paciente.findByIdAndUpdate(req.params.id, { activo: false }, { returnDocument: 'after' });
    if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente desactivado' });
  } catch (error) {
    next(error);
  }
};

/**
 * Sube/actualiza la foto del paciente (Multer → Cloudinary, URL en req.file.path).
 * @route PUT /api/pacientes/:id/foto
 * @param {import('express').Request} req - params: { id }; req.file con la imagen.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { foto, paciente } | 400 sin archivo | 404 no encontrado.
 */
exports.subirFoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'No se recibió ningún archivo' });

    // req.file.path contiene la URL segura de Cloudinary
    const paciente = await Paciente.findByIdAndUpdate(
      req.params.id,
      { foto: req.file.path },
      { returnDocument: 'after' }
    ).populate('usuarioId', 'nombre apellido email telefono');

    if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

    res.json({ mensaje: 'Foto actualizada', foto: paciente.foto, paciente });
  } catch (error) {
    next(error);
  }
};
