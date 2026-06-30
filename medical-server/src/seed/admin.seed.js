// ═══════════════════════════════════════════════════════════════
// src/seed/admin.seed.js — Crea el usuario administrador inicial
// Ejecutar: npm run seed:admin
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const User     = require('../models/User');
const Role     = require('../models/Role');
require('dotenv').config();

async function seedAdmin () {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_db';
  await mongoose.connect(uri);
  console.log('MongoDB conectado');

  const role = await Role.findOne({ nombre: 'administrador' });
  if (!role) {
    console.error('❌ Rol administrador no encontrado. Ejecuta primero: npm run seed:roles');
    process.exit(1);
  }

  const existe = await User.findOne({ email: 'admin@medical.com' });
  if (existe) {
    console.log('⚠️  El administrador ya existe');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    nombre:   'Admin',
    apellido: 'Sistema',
    email:    'admin@medical.com',
    password: 'Admin1234',
    roleId:   role._id
  });

  console.log('\n✅ Administrador creado');
  console.log('   Email:    admin@medical.com');
  console.log('   Password: Admin1234');
  console.log('\n⚠️  Cambia la contraseña en producción');

  await mongoose.disconnect();
}

seedAdmin().catch(err => { console.error(err); process.exit(1); });
