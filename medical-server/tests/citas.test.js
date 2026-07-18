// ═══════════════════════════════════════════════════════════════
// tests/citas.test.js — Tests de citas médicas
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
process.env.MONGO_URI = 'mongodb://localhost:27017/medical_test';

const request = require('supertest');
const app = require('../src/app');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Paciente = require('../src/models/Paciente');
const Especialidad = require('../src/models/Especialidad');
const Departamento = require('../src/models/Departamento');

// Datos de prueba
const roles = [
    { nombre: 'administrador', descripcion: 'Acceso total', permisos: [] },
    {
        nombre: 'doctor', descripcion: 'Doctor', permisos: [
            { module: 'pacientes', actions: ['leer'] },
            { module: 'calendario', actions: ['leer'] },
            { module: 'historial', actions: ['crear', 'leer', 'editar'] },
            { module: 'reportes', actions: ['leer'] }
        ]
    },
    {
        nombre: 'paciente', descripcion: 'Paciente', permisos: [
            { module: 'citas', actions: ['leer'] },
            { module: 'historial', actions: ['leer'] }
        ]
    }
];

const usuarioAdmin = {
    nombre: 'Admin', apellido: 'Test',
    email: 'admin@test.com', password: 'Admin1234'
};

const usuarioDoctor = {
    nombre: 'Carlos', apellido: 'González',
    email: 'doctor@test.com', password: 'Doctor1234'
};

const pacienteData = {
    nombre: 'Juan', apellido: 'Pérez',
    email: 'juan@test.com', telefono: '+56911111111',
    rut: '12345678-9', fechaNacimiento: '1990-05-15',
    genero: 'masculino', prevision: 'fonasa'
};

let token;
let doctorId;
let pacienteId;

beforeEach(async () => {
    // Crear roles
    const rolesCreados = await Role.insertMany(roles);
    const adminRole = rolesCreados.find(r => r.nombre === 'administrador');
    const doctorRole = rolesCreados.find(r => r.nombre === 'doctor');

    // Crear usuario admin
    await User.create({ ...usuarioAdmin, roleId: adminRole._id });

    // Login admin
    const login = await request(app)
        .post('/api/auth/login')
        .send({ email: usuarioAdmin.email, password: usuarioAdmin.password });
    token = login.body.accessToken;

    // Crear usuario doctor
    const userDoctor = await User.create({
        ...usuarioDoctor, roleId: doctorRole._id
    });

    // Crear departamento y especialidad
    const dep = await Departamento.create({ nombre: 'Medicina General' });
    const esp = await Especialidad.create({
        nombre: 'Medicina Familiar', departamentoId: dep._id
    });

    // Crear perfil doctor con horarios
    const doctor = await Doctor.create({
        usuarioId: userDoctor._id,
        especialidadId: esp._id,
        matricula: 'MED-001',
        duracionConsulta: 30,
        horarios: [
            { dia: 'lunes', horaInicio: '08:00', horaFin: '17:00' },
            { dia: 'martes', horaInicio: '08:00', horaFin: '17:00' },
            { dia: 'miercoles', horaInicio: '08:00', horaFin: '17:00' },
            { dia: 'jueves', horaInicio: '08:00', horaFin: '17:00' },
            { dia: 'viernes', horaInicio: '08:00', horaFin: '17:00' }
        ]
    });
    doctorId = doctor._id.toString();

    // Crear paciente
    const pacienteRole = rolesCreados.find(r => r.nombre === 'paciente');
    const userPaciente = await User.create({
        nombre: 'Juan', apellido: 'Pérez',
        email: 'juan@test.com', password: '12345678-9',
        roleId: pacienteRole._id
    });

    const paciente = await Paciente.create({
        usuarioId: userPaciente._id,
        rut: '12345678-9',
        fechaNacimiento: '1990-05-15',
        genero: 'masculino',
        prevision: 'fonasa'
    });
    pacienteId = paciente._id.toString();
});

// ─── Tests de Crear Cita ──────────────────────────────────────
describe('POST /api/citas', () => {
    test('✅ Crear cita correctamente', async () => {
        const res = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pacienteId,
                doctorId,
                fechaHora: '2026-06-10T09:00:00',
                motivo: 'Control general',
                tipo: 'primera_vez'
            });

        expect(res.status).toBe(201);
        expect(res.body.cita.estado).toBe('pendiente');
        expect(res.body.cita.motivo).toBe('Control general');
    });

    test('❌ Crear cita sin campos requeridos', async () => {
        const res = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send({ motivo: 'Sin doctor ni paciente' });

        expect(res.status).toBe(400);
    });

    test('❌ Crear cita con doctor inexistente', async () => {
        const res = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pacienteId,
                doctorId: '6a1e3b9c23f7382925d313fa',
                fechaHora: '2026-06-10T09:00:00',
                motivo: 'Control general',
                tipo: 'primera_vez'
            });

        expect(res.status).toBe(404);
    });

    test('❌ Crear cita en horario ocupado', async () => {
        const citaData = {
            pacienteId,
            doctorId,
            fechaHora: '2026-06-10T09:00:00',
            motivo: 'Control general',
            tipo: 'primera_vez'
        };

        await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send(citaData);

        const res = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send(citaData);

        expect(res.status).toBe(409);
    });

    test('❌ Crear cita sin token', async () => {
        const res = await request(app)
            .post('/api/citas')
            .send({ pacienteId, doctorId, fechaHora: '2026-06-10T09:00:00', motivo: 'Test', tipo: 'control' });

        expect(res.status).toBe(401);
    });
});

// ─── Tests de Listar ─────────────────────────────────────────
describe('GET /api/citas', () => {
    test('✅ Listar citas con token válido', async () => {
        const res = await request(app)
            .get('/api/citas')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('citas');
    });

    test('✅ Filtrar citas por estado', async () => {
        const res = await request(app)
            .get('/api/citas?estado=pendiente')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('citas');
    });

    test('❌ Listar citas sin token', async () => {
        const res = await request(app)
            .get('/api/citas');

        expect(res.status).toBe(401);
    });
});

// ─── Tests de Disponibilidad ──────────────────────────────────
describe('GET /api/citas/disponibilidad/:doctorId', () => {
    test('✅ Ver disponibilidad del doctor', async () => {
        const res = await request(app)
            .get(`/api/citas/disponibilidad/${doctorId}?fecha=2026-06-09`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('slots');
        expect(res.body.slots.length).toBeGreaterThan(0);
    });

    test('✅ Doctor no atiende ese día', async () => {
        // 2026-06-07 es domingo
        const res = await request(app)
            .get(`/api/citas/disponibilidad/${doctorId}?fecha=2026-06-07`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.disponible).toBe(false);
    });

    test('❌ Ver disponibilidad sin fecha', async () => {
        const res = await request(app)
            .get(`/api/citas/disponibilidad/${doctorId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});

// ─── Tests de Cambiar Estado ──────────────────────────────────
describe('PUT /api/citas/:id/estado', () => {
    test('✅ Cambiar estado a confirmada', async () => {
        const cita = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pacienteId,
                doctorId,
                fechaHora: '2026-06-10T09:00:00',
                motivo: 'Control general',
                tipo: 'primera_vez'
            });

        const res = await request(app)
            .put(`/api/citas/${cita.body.cita._id}/estado`)
            .set('Authorization', `Bearer ${token}`)
            .send({ estado: 'confirmada' });

        expect(res.status).toBe(200);
        expect(res.body.cita.estado).toBe('confirmada');
    });

    test('❌ Cambiar estado con valor inválido', async () => {
        const cita = await request(app)
            .post('/api/citas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pacienteId,
                doctorId,
                fechaHora: '2026-06-10T10:00:00',
                motivo: 'Control general',
                tipo: 'control'
            });

        const res = await request(app)
            .put(`/api/citas/${cita.body.cita._id}/estado`)
            .set('Authorization', `Bearer ${token}`)
            .send({ estado: 'estado-invalido' });

        expect(res.status).toBe(400);
    });
});