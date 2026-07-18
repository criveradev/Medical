/**
 * @swagger
 * tags:
 *   name: Resultados
 *   description: Resultados y exámenes médicos
 */

/**
 * @swagger
 * /api/v1/resultados/paciente/{pacienteId}:
 *   get:
 *     summary: Listar resultados de un paciente
 *     tags: [Resultados]
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de resultados del paciente
 */

/**
 * @swagger
 * /api/v1/resultados/{id}:
 *   get:
 *     summary: Obtener resultado por ID
 *     tags: [Resultados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del resultado
 *       404:
 *         description: No encontrado
 *   put:
 *     summary: Actualizar resultado
 *     tags: [Resultados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado actualizado
 *   delete:
 *     summary: Eliminar resultado
 *     tags: [Resultados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado eliminado
 */

/**
 * @swagger
 * /api/v1/resultados:
 *   post:
 *     summary: Registrar resultado médico con archivo
 *     tags: [Resultados]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [pacienteId, citaId, doctorId, tipo, nombre]
 *             properties:
 *               pacienteId:
 *                 type: string
 *               citaId:
 *                 type: string
 *               doctorId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [examen_sangre, radiografia, ecografia, electrocardiograma, otro]
 *               nombre:
 *                 type: string
 *                 example: Hemograma completo
 *               descripcion:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resultado registrado — el archivo se sube a Cloudinary y se retorna la URL segura
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 resultado:
 *                   type: object
 *                   properties:
 *                     archivo:
 *                       type: string
 *                       example: "https://res.cloudinary.com/tu_cloud/raw/upload/medical-app/resultados/xyz.pdf"
 *       404:
 *         description: Cita no encontrada
 */

const router = require('express').Router();
const { listarPorPaciente, obtener, crear, actualizar, eliminar } = require('../../controllers/v1/resultados.controller');
const { authenticate, authorize, scopePaciente } = require('../../middleware/auth');
const { uploadResultado } = require('../../config/multer');

router.get('/paciente/:pacienteId', authenticate, authorize('resultados', 'leer'), scopePaciente, listarPorPaciente);
router.get('/:id', authenticate, authorize('resultados', 'leer'), scopePaciente, obtener);
router.post('/', authenticate, authorize('resultados', 'crear'), uploadResultado.single('archivo'), crear);
router.put('/:id', authenticate, authorize('resultados', 'editar'), actualizar);
router.delete('/:id', authenticate, authorize('resultados', 'eliminar'), eliminar);

module.exports = router;