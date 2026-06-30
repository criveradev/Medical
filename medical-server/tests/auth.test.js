// ═══════════════════════════════════════════════════════════════
// tests/auth.test.js — Tests de autenticación
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
process.env.MONGO_URI = 'mongodb://localhost:27017/medical_test';


const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Role = require('../src/models/Role');

// Datos de prueba
const rolAdmin = {
    nombre: 'administrador',
    descripcion: 'Acceso total',
    permisos: []
};

const usuarioAdmin = {
    nombre: 'Admin',
    apellido: 'Test',
    email: 'admin@test.com',
    password: 'Admin1234'
};

let adminRole;
let accessToken;

// Crear rol y usuario antes de los tests
beforeEach(async () => {
    adminRole = await Role.create(rolAdmin);
    await User.create({ ...usuarioAdmin, roleId: adminRole._id });
});

// ─── Tests de Login ───────────────────────────────────────────
describe('POST /api/auth/login', () => {
    test('✅ Login exitoso con credenciales correctas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email, password: usuarioAdmin.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.usuario.email).toBe(usuarioAdmin.email);
        expect(res.body.usuario.rol).toBe('administrador');

        accessToken = res.body.accessToken;
    });

    test('❌ Login fallido con password incorrecta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email, password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.mensaje).toBe('Credenciales inválidas');
    });

    test('❌ Login fallido con email inexistente', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@test.com', password: 'Admin1234' });

        expect(res.status).toBe(401);
        expect(res.body.mensaje).toBe('Credenciales inválidas');
    });

    test('❌ Login fallido sin email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'Admin1234' });

        expect(res.status).toBe(400);
    });

    test('❌ Login fallido sin password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email });

        expect(res.status).toBe(400);
    });
});

// ─── Tests de Perfil ──────────────────────────────────────────
describe('GET /api/auth/perfil', () => {
    test('✅ Obtener perfil con token válido', async () => {
        // Primero hacer login
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email, password: usuarioAdmin.password });

        const token = login.body.accessToken;

        const res = await request(app)
            .get('/api/auth/perfil')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.usuario.email).toBe(usuarioAdmin.email);
    });

    test('❌ Obtener perfil sin token', async () => {
        const res = await request(app)
            .get('/api/auth/perfil');

        expect(res.status).toBe(401);
    });

    test('❌ Obtener perfil con token inválido', async () => {
        const res = await request(app)
            .get('/api/auth/perfil')
            .set('Authorization', 'Bearer tokeninvalido');

        expect(res.status).toBe(401);
    });
});

// ─── Tests de Refresh Token ───────────────────────────────────
describe('POST /api/auth/refresh', () => {
    test('✅ Renovar token con refresh token válido', async () => {
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email, password: usuarioAdmin.password });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: login.body.refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });

    test('❌ Renovar token con refresh token inválido', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'tokeninvalido' });

        expect(res.status).toBe(401);
    });
});

// ─── Tests de Logout ──────────────────────────────────────────
describe('POST /api/auth/logout', () => {
    test('✅ Cerrar sesión correctamente', async () => {
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: usuarioAdmin.email, password: usuarioAdmin.password });

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${login.body.accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Sesión cerrada correctamente');
    });
});