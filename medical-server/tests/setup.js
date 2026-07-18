// ═══════════════════════════════════════════════════════════════
// tests/setup.js — Configuración global de Jest
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

// Usar base de datos de TEST separada — nunca la de producción
const MONGO_TEST_URI = 'mongodb://localhost:27017/medical_test';

beforeAll(async () => {
    // Desconectar cualquier conexión existente
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(MONGO_TEST_URI);
});

afterEach(async () => {
    // Limpiar todas las colecciones después de cada test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});