<div align="center">

# 🏥 Medical

**Sistema de gestión de citas médicas**
Aplicacion web para agendar citas medicas en línea, portal por rol
(administración, recepción, doctor y paciente), historial clínico, resultados de
exámenes, pagos con comprobante y notificaciones en tiempo real.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

🔗 **[Ver demo en vivo](https://medical.criveradev.cl/)** &nbsp;·&nbsp;
📡 **[API](https://api.medical.criveradev.cl/health)** &nbsp;·&nbsp;
📖 **[Documentación Swagger](https://api.medical.criveradev.cl/api/docs/)** &nbsp;·&nbsp;
🐛 **[Reportar bug](https://github.com/criveradev/Medical/issues)**

<br/>

> ⚠️ El backend está en Render (plan gratuito): se suspende tras inactividad, así
> que la **primera petición puede tardar ~30 segundos** mientras el servidor despierta.
>
> Acceso de prueba: **admin@medical.com** / **Admin1234**

</div>

---

## 📋 Tabla de contenidos

- [Sobre el proyecto](#-sobre-el-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Primeros pasos](#-primeros-pasos)
- [Variables de entorno](#-variables-de-entorno)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Roles y permisos](#-roles-y-permisos)
- [Tests](#-tests)
- [Despliegue](#-despliegue)
- [Roadmap](#-roadmap)
- [Autor](#-autor)
- [Licencia](#-licencia)

---

## 🎯 Sobre el proyecto

**Medical** es un sistema full-stack de gestión de citas médicas desarrollado como
proyecto de portafolio. El objetivo fue construir una aplicación realista de extremo
a extremo: una API REST segura con control de acceso por rol, modelado relacional con
MongoDB, autenticación con tokens de acceso y refresco, notificaciones en tiempo real
y una interfaz reactiva por perfil de usuario.

Cubre los conceptos que aparecen en cualquier sistema profesional: autenticación y
autorización granular, CRUD completo de varios recursos relacionados, subida de archivos
a CDN, generación de documentos (recetas, comprobantes y reportes en PDF/Excel), caché,
envío de correos y trabajo programado (recordatorios automáticos).

El repositorio es un **monorepo** con dos paquetes: **`medical-server`** (la API) y
**`medical-client`** (la interfaz web).

---

## ✨ Funcionalidades

### 🔐 Autenticación y seguridad
- Inicio de sesión con tokens de acceso y refresco (rotación de refresh token)
- Refresh tokens hasheados en base de datos (SHA-256) y revocables al cerrar sesión
- Contraseñas encriptadas con bcrypt
- Control de acceso por rol y acción (RBAC) sobre cada módulo
- Aislamiento a nivel de objeto: un paciente solo accede a sus propios datos (anti-IDOR)
- Sanitización contra XSS e inyección NoSQL, Helmet, CORS y rate limiting
- Monitoreo de errores con Sentry y logs con Winston

### 📅 Citas
- Agenda de citas con verificación de disponibilidad real del doctor
- Prevención de solapamiento de horarios
- Estados de cita (pendiente, confirmada, completada, cancelada, no asistió)
- Edición y cancelación de citas
- Correo automático al agendar y recordatorio el día previo (cron)

### 👥 Pacientes y doctores
- Registro de pacientes (RUT chileno con formato automático, RUT como contraseña inicial)
- Gestión de doctores con matrícula automática y editable, especialidad y horarios
- Foto de perfil para cualquier usuario (subida a Cloudinary con redimensionado en cliente)

### 📋 Clínico
- Historial clínico por atención (al registrarlo, la cita se marca como completada)
- Recetas médicas descargables en PDF con formato de receta chilena
- Resultados de exámenes con archivo adjunto, descargables por el paciente

### 💳 Pagos
- Registro de pagos por cita (una cita = un pago) con varios métodos
- Total recaudado y filtros por estado y fecha
- Comprobante de pago descargable como respaldo

### 📊 Reportes
- Reporte estadístico por doctor y reporte general de administración
- Exportación a PDF y Excel
- Dashboard con gráficos por rol (recaudación, citas por estado y por mes)

### 🔔 Experiencia de usuario
- Notificaciones en tiempo real con Socket.io (autenticadas, por sala/rol)
- Toasts de feedback, estados de carga y estados vacíos
- Portal adaptado al rol: cada usuario ve solo lo que le corresponde
- Interfaz responsiva con Tailwind CSS

---

## 🛠 Stack tecnológico

### Backend (`medical-server`)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 20.x | Entorno de ejecución |
| Express | 5.x | Framework HTTP |
| MongoDB + Mongoose | 9.x | Base de datos NoSQL y ODM |
| Redis (ioredis) | 5.x | Caché con degradación graceful |
| JSON Web Token | 9.x | Autenticación (access + refresh) |
| bcryptjs | 3.x | Hash de contraseñas |
| Socket.io | 4.x | Notificaciones en tiempo real |
| Multer + Cloudinary | 2.x | Subida de archivos a CDN |
| Nodemailer | 8.x | Envío de correos |
| node-cron | 4.x | Recordatorios programados |
| PDFKit + ExcelJS | — | Generación de reportes PDF/Excel |
| express-validator | 7.x | Validación de entrada |
| Helmet · CORS · rate-limit · sanitize | — | Seguridad |
| Sentry · Winston · Morgan | — | Observabilidad y logs |
| Swagger (swagger-jsdoc) | — | Documentación de la API |
| Jest + Supertest | 30.x | Tests |

### Frontend (`medical-client`)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.x | Librería de interfaz |
| Vite | 6.x | Bundler y servidor de desarrollo |
| Tailwind CSS | 4.x | Estilos utilitarios (plugin de Vite) |
| React Router DOM | 6.x | Navegación SPA |
| Recharts | 2.x | Gráficos del dashboard |
| lucide-react | — | Iconos |
| socket.io-client | 4.x | Notificaciones en tiempo real |
| react-phone-number-input | 3.x | Campo de teléfono internacional |

### Infraestructura

| Servicio | Uso |
|---------|-----|
| MongoDB | Base de datos (local o Atlas) |
| Redis | Caché (opcional; si no está, degrada sin romper) |
| Cloudinary | Almacenamiento de imágenes y archivos |
| Docker Compose | Backend + MongoDB + Redis en contenedores |

---

## 🏗 Arquitectura

```
┌─────────────────────┐         ┌──────────────────────┐
│                     │  HTTP   │                      │
│  Frontend (React)   │────────▶│   Backend (Express)  │
│  medical.criveradev │◀────────│ api.medical.crivera  │
│         .cl         │  JSON   │      dev.cl          │
│                     │◀═══════▶│ WebSocket (Socket.io)│
└─────────────────────┘  WS     └──────────┬───────────┘
                                           │
                  ┌────────────┬───────────┼────────────┬────────────┐
                  ▼            ▼           ▼            ▼            ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ MongoDB  │ │  Redis   │ │Cloudinary│ │  Brevo   │ │  Sentry  │
            │ (datos)  │ │ (caché)  │ │(archivos)│ │ (email)  │ │ (errores)│
            └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

> Ambos dominios (`medical.criveradev.cl` y `api.medical.criveradev.cl`) son
> subdominios propios gestionados en **Cloudflare DNS**, que apuntan respectivamente
> a Vercel y Render mediante registros CNAME.

### Arquitectura del backend por capas

```
Petición HTTP
     │
     ▼
┌──────────────┐
│   ROUTES     │  Define URLs y conecta con controladores
├──────────────┤
│ MIDDLEWARE   │  JWT auth · RBAC · scope paciente · validación · uploads · errores
├──────────────┤
│ CONTROLLERS  │  Lógica de negocio por recurso
├──────────────┤
│  SERVICES    │  Caché · notificaciones · correos · recordatorios · exportar
├──────────────┤
│   MODELS     │  Esquemas Mongoose (User, Role, Paciente, Doctor, Cita…)
├──────────────┤
│   MONGODB    │  Persistencia
└──────────────┘
```

---

## 📁 Estructura del proyecto

```
Medical/
│
├── medical-server/                  # API REST (Express)
│   ├── src/
│   │   ├── config/                  # env, db, redis, cloudinary, multer, logger, swagger, sentry, email
│   │   ├── models/                  # User, Role, Paciente, Doctor, Cita, Historial, Pago, Resultado, Departamento, Especialidad
│   │   ├── controllers/             # Lógica por recurso (auth, citas, pacientes, doctores, pagos, reportes…)
│   │   ├── routes/                  # Definición de endpoints + validaciones (Swagger en JSDoc)
│   │   ├── middleware/              # auth (JWT/RBAC/scope), validar, sanitizar, xss, errores, morgan
│   │   ├── services/                # cache, notificaciones (Socket.io), email, recordatorios (cron), exportar (PDF/Excel)
│   │   ├── seed/                    # roles.seed.js · admin.seed.js
│   │   └── app.js                   # App Express (middlewares, rutas, Swagger)
│   ├── tests/                       # Jest + Supertest
│   ├── Dockerfile
│   ├── docker-compose.yml           # backend + mongo + redis
│   ├── .env.example
│   └── package.json
│
├── medical-client/                  # Interfaz web (React + Vite)
│   ├── src/
│   │   ├── lib/                      # api (fetch + refresh token), format, roles, receta, voucher
│   │   ├── hooks/                    # useFetch, useMiFicha, useMiDoctor
│   │   ├── context/                  # AuthContext, NotificationsContext (Socket.io), ToastContext
│   │   ├── components/               # Navbar, Footer, ui (primitivos), portal/ (Layout, ProtectedRoute, NotificationBell)
│   │   ├── pages/                    # Home, Login y portal/ por rol (admin, doctor, paciente)
│   │   ├── data/                     # Contenido de marketing de la landing
│   │   ├── App.jsx                   # Rutas (público + portal protegido)
│   │   └── main.jsx
│   ├── vite.config.js               # Proxy /api y /socket.io → :3000
│   └── package.json
│
├── LICENSE
└── README.md
```

> Cada paquete tiene además su propio README con detalle específico. El backend
> incluye documentación interactiva completa en Swagger (`/api/docs`).

---

## 🚀 Primeros pasos

### Requisitos previos

- **Node.js** v20 o superior — [Descargar](https://nodejs.org/)
- **npm** v10 o superior (incluido con Node)
- **MongoDB** en local, o una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
- Cuenta en [Cloudinary](https://cloudinary.com/) (gratuita) para subir archivos
- _(Opcional)_ **Redis** para caché · **Docker** para levantar todo en contenedores

### 1. Clonar el repositorio

```bash
git clone https://github.com/criveradev/Medical.git
cd Medical
```

### 2. Instalar dependencias

```bash
# Backend
cd medical-server && npm install

# Frontend
cd ../medical-client && npm install
```

### 3. Configurar variables de entorno

```bash
# Backend
cp medical-server/.env.example medical-server/.env
```

Edita `medical-server/.env` con tus credenciales (ver sección
[Variables de entorno](#-variables-de-entorno)).

### 4. Sembrar datos iniciales (roles y admin)

```bash
cd medical-server
npm run seed:roles    # Crea los roles del sistema
npm run seed:admin    # Crea el usuario administrador inicial
```

Credenciales por defecto del administrador:

```
Email:    admin@medical.com
Password: Admin1234
```

> 🔒 Cambia esta contraseña tras el primer inicio de sesión.

### 5. Ejecutar en desarrollo

Abre **dos terminales**:

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd medical-server && npm run dev

# Terminal 2 — Frontend (http://localhost:4200)
cd medical-client && npm run dev
```

El frontend hace proxy de `/api` y `/socket.io` al backend, así que no hay
problemas de CORS en desarrollo.

### 6. Verificar

Abre `http://localhost:4200`, inicia sesión con el admin y prueba el portal.
La documentación de la API queda en `http://localhost:3000/api/docs`.

### Alternativa: Docker

Levanta backend + MongoDB + Redis con un solo comando:

```bash
cd medical-server
docker compose up -d        # backend :3000 · mongo :27017 · redis :6379
```

Luego ejecuta los seeds dentro del contenedor y levanta el frontend aparte con
`npm run dev`.

---

## 🔐 Variables de entorno

### Backend — `medical-server/.env`

```env
# Servidor
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:4200

# Base de datos — MongoDB
MONGO_URI=mongodb://localhost:27017/medical_db

# Redis — caché opcional (si no está, la app degrada a MongoDB sin errores).
# Opción A: una sola URL (proveedores gestionados; rediss:// activa TLS solo).
REDIS_URL=
# Opción B: host/puerto por separado (Redis local).
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT — genera secretos con:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=cadena_aleatoria_minimo_32_caracteres
JWT_REFRESH_SECRET=otra_cadena_aleatoria_distinta
JWT_EXPIRES=8h

# Email (SMTP) — para recordatorios y avisos. En desarrollo local sirve iCloud/Gmail.
EMAIL_HOST=smtp.mail.me.com
EMAIL_PORT=587
EMAIL_USER=tu_correo
EMAIL_PASS=tu_password_de_aplicacion
EMAIL_FROM=                 # remitente verificado (opcional; si no, usa EMAIL_USER)

# Email vía API HTTP (puerto 443) — OBLIGATORIO en hosts que bloquean SMTP
# (Render free, Railway). Si se define, el envío usa la API de Brevo en vez de SMTP.
BREVO_API_KEY=

# Cloudinary — cloudinary.com → Dashboard → API Keys
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Sentry — monitoreo de errores (opcional)
SENTRY_DSN=tu_dsn_de_sentry
```

> ⚠️ **Nunca subas archivos `.env` a GitHub.** Están incluidos en `.gitignore`.
> En modo test el envío de correos se desactiva automáticamente.

---

## 🔌 Endpoints de la API

URL base en producción: `https://api.medical.criveradev.cl/api` · Documentación interactiva: `/api/docs`

> En desarrollo local: `http://localhost:3000/api`

### 🔑 Autenticación y usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/auth/login` | Iniciar sesión | — |
| `POST` | `/auth/refresh` | Renovar access token | — |
| `POST` | `/auth/logout` | Cerrar sesión (revoca refresh) | ✅ |
| `GET` | `/auth/perfil` | Mi perfil | ✅ |
| `PUT` | `/auth/perfil/foto` | Subir foto de perfil | ✅ |
| `PUT` | `/auth/cambiar-password` | Cambiar contraseña | ✅ |
| `POST` | `/auth/usuarios` | Crear usuario | 🛡 |
| `GET` | `/auth/usuarios` | Listar usuarios | 🛡 |
| `PUT` | `/auth/usuarios/:id` | Editar usuario | 🛡 |
| `DELETE` | `/auth/usuarios/:id` | Eliminar usuario | 🛡 |

### 📅 Citas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/citas` | Listar citas (con filtros) | 🛡 |
| `GET` | `/citas/:id` | Ver una cita | 🛡 |
| `GET` | `/citas/disponibilidad/:doctorId` | Horarios disponibles | 🛡 |
| `POST` | `/citas` | Agendar cita | 🛡 |
| `PUT` | `/citas/:id` | Editar cita | 🛡 |
| `PUT` | `/citas/:id/estado` | Cambiar estado | 🛡 |

### 👤 Pacientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/pacientes/mi-ficha` | Mi ficha (paciente) | ✅ |
| `GET` | `/pacientes` | Listar pacientes | 🛡 |
| `GET` | `/pacientes/:id` | Ver paciente | 🛡 |
| `POST` | `/pacientes` | Crear paciente | 🛡 |
| `PUT` | `/pacientes/:id` | Editar paciente | 🛡 |
| `PUT` | `/pacientes/:id/foto` | Subir foto | 🛡 |
| `DELETE` | `/pacientes/:id` | Eliminar paciente | 🛡 |

### 🩺 Doctores

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/doctores/mi-perfil` | Mi perfil (doctor) | ✅ |
| `GET` | `/doctores/siguiente-matricula` | Matrícula sugerida | 🛡 |
| `GET` | `/doctores` | Listar doctores | 🛡 |
| `GET` | `/doctores/:id` | Ver doctor | 🛡 |
| `GET` | `/doctores/disponibilidad/:doctorId` | Disponibilidad | 🛡 |
| `POST` | `/doctores` | Crear doctor | 🛡 |
| `PUT` | `/doctores/:id` | Editar doctor | 🛡 |
| `PUT` | `/doctores/:id/horarios` | Editar horarios | 🛡 |
| `PUT` | `/doctores/:id/foto` | Subir foto | 🛡 |

### 📋 Historial · 🧪 Resultados

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/historial/paciente/:pacienteId` | Historial de un paciente | 🛡 |
| `GET` | `/historial/:id` | Ver registro | 🛡 |
| `POST` | `/historial` | Registrar atención (receta) | 🛡 |
| `PUT` | `/historial/:id` | Editar registro | 🛡 |
| `GET` | `/resultados/paciente/:pacienteId` | Resultados de un paciente | 🛡 |
| `GET` | `/resultados/:id` | Ver resultado | 🛡 |
| `POST` | `/resultados` | Subir resultado (archivo) | 🛡 |
| `PUT` | `/resultados/:id` | Editar resultado | 🛡 |
| `DELETE` | `/resultados/:id` | Eliminar resultado | 🛡 |

### 💳 Pagos · 📊 Reportes · 🏢 Catálogos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/pagos` | Listar pagos (filtros + total) | 🛡 |
| `GET` | `/pagos/:id` | Ver pago | 🛡 |
| `POST` | `/pagos` | Registrar pago | 🛡 |
| `PUT` | `/pagos/:id` | Editar pago | 🛡 |
| `PUT` | `/pagos/:id/anular` | Anular pago | 🛡 |
| `GET` | `/reportes/doctor/:doctorId` | Reporte por doctor | 🛡 |
| `GET` | `/reportes/doctor/:doctorId/pdf` | Reporte PDF | 🛡 |
| `GET` | `/reportes/doctor/:doctorId/excel` | Reporte Excel | 🛡 |
| `GET` | `/reportes/admin` | Reporte general | 🛡 |
| `GET` | `/departamentos` · `/especialidades` | Catálogos (+ CRUD) | 🛡 |

> **Auth:** `—` público · `✅` requiere sesión · `🛡` requiere sesión + permiso de rol (RBAC).

### Autenticación en peticiones protegidas

```http
Authorization: Bearer <tu_access_token>
```

### Códigos de respuesta

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Creado |
| `400` | Datos inválidos |
| `401` | Sin token o token inválido/expirado |
| `403` | Sin permiso sobre el recurso |
| `404` | Recurso no encontrado |
| `409` | Conflicto (duplicado / solapamiento) |
| `429` | Demasiadas peticiones (rate limit) |
| `500` | Error interno del servidor |

---

## 👮 Roles y permisos

El acceso se controla por **rol** y **acción** sobre cada módulo (RBAC), y además
con aislamiento a nivel de objeto para el paciente.

| Rol | Acceso principal |
|-----|------------------|
| **Administrador** | Acceso total: usuarios, doctores, catálogos y reportes |
| **Recepcionista** | Agenda, pacientes y pagos |
| **Enfermero** | Apoyo clínico según permisos asignados |
| **Doctor** | Su agenda, registrar atenciones/recetas y subir resultados |
| **Paciente** | Solo sus propias citas, historial, resultados y pagos |

---

## 🧪 Tests

El backend incluye una suite de tests de integración con **Jest + Supertest**.

```bash
cd medical-server
npm test               # Ejecuta toda la suite
npm run test:watch     # Modo watch
npm run test:coverage  # Con reporte de cobertura
```

> Estado actual: **13 suites · 170 tests** en verde. En entorno de test el envío
> de correos se desactiva automáticamente para que la suite sea rápida y aislada.

---

## 🚢 Despliegue

El proyecto está desplegado con servicios de plan gratuito, sobre un **dominio propio**
gestionado en Cloudflare:

| Pieza | Servicio | Notas |
|-------|----------|-------|
| Frontend | **Vercel** | sitio estático (Vite) · `medical.criveradev.cl` |
| Backend / API | **Render** | Web Service Node · `api.medical.criveradev.cl` |
| DNS / Dominio | **Cloudflare** | registros CNAME hacia Vercel y Render |
| Base de datos | **MongoDB Atlas** | clúster M0 |
| Caché | **Upstash** (Redis) | vía `REDIS_URL` (TLS) |
| Archivos | **Cloudinary** | imágenes y documentos |
| Email | **Brevo** (API HTTP) | dominio propio autenticado (SPF + DKIM + DMARC) |
| Errores | **Sentry** | opcional |

El backend ya usa `process.env.PORT` y limita el CORS a `CLIENT_URL`, así que el
despliegue es básicamente configurar variables de entorno.

> El frontend usa `VITE_API_URL` para apuntar al backend: déjala **vacía** en
> desarrollo (proxy de Vite) y ponla con la URL del backend en producción.

### 1. Subir el repositorio a GitHub

```bash
git init && git add . && git commit -m "deploy inicial"
git branch -M main
git remote add origin https://github.com/criveradev/Medical.git
git push -u origin main
```

> Verifica que los `.env` **no** se suban (deben estar en `.gitignore`).

### 2. Base de datos — MongoDB Atlas

1. Crea un clúster gratuito (M0) en [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. En **Network Access** permite el acceso desde cualquier IP (`0.0.0.0/0`), porque
   las IP de Render gratis son dinámicas.
3. En **Database Access** crea un usuario y copia la cadena de conexión
   (`mongodb+srv://...`); será tu `MONGO_URI`.

### 3. Backend — Render

Crea un **Web Service** en [render.com](https://render.com) apuntando al repo:

| Campo | Valor |
|-------|-------|
| Root Directory | `medical-server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Agrega las variables de entorno (ver [Variables de entorno](#-variables-de-entorno)),
con `MONGO_URI` de Atlas y `CLIENT_URL` = `https://medical.criveradev.cl` (paso 4 y 5).
`SENTRY_DSN` y `REDIS_*` son opcionales. Tras el primer deploy, **siembra los datos**
(roles y admin). El plan gratuito de Render no incluye *Shell*, así que usa una de
estas dos vías:

- **Local:** desde tu máquina, apuntando a la base de Atlas de producción:
  ```bash
  cd medical-server
  MONGO_URI="<tu cadena de Atlas>" npm run seed:roles
  MONGO_URI="<tu cadena de Atlas>" npm run seed:admin
  ```
- **Desde el propio Render:** cambia temporalmente el *Start Command* a
  `npm run seed:roles && npm run seed:admin && npm start`, deja que redespliegue
  una vez, y luego devuélvelo a `npm start`. Los seeds son idempotentes.

### 4. Frontend — Vercel

Importa el repo en [vercel.com](https://vercel.com):

| Campo | Valor |
|-------|-------|
| Root Directory | `medical-client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Agrega la variable de entorno `VITE_API_URL` con la URL pública del backend
(sin barra final), por ejemplo `https://api.medical.criveradev.cl`.
El `vercel.json` incluido se encarga del fallback de rutas de React Router.

### 5. Dominio propio — Cloudflare

El proyecto usa subdominios propios en vez de las URLs `.vercel.app` / `.onrender.com`:

1. En **Vercel** → proyecto → Settings → Domains → agrega `medical.criveradev.cl`.
   Si tu zona DNS ya está en Cloudflare, Vercel puede autorizar y crear el registro
   CNAME automáticamente (integración oficial); si no, agrégalo a mano:
   ```
   CNAME   medical   cname.vercel-dns.com   (Proxy: Solo DNS / DNS only)
   ```
2. En **Render** → servicio backend → Settings → Custom Domains → agrega
   `api.medical.criveradev.cl` y copia el valor CNAME que entrega Render. Agrégalo
   en Cloudflare:
   ```
   CNAME   api.medical   <valor entregado por Render>   (Proxy: Solo DNS / DNS only)
   ```
3. Deja el proxy de Cloudflare en **"Solo DNS"** (nube gris) hasta que ambos dominios
   queden verificados y con SSL emitido en sus respectivos paneles.
4. **No toques** los registros existentes de la raíz (`@`, `www`) ni los de Brevo
   (`brevo1._domainkey`, `brevo2._domainkey`, TXT de verificación, `_dmarc`) — son
   independientes y no se ven afectados por agregar estos subdominios.

### 6. Conectar ambos

En Render, asegúrate de que `CLIENT_URL` quede exactamente como
`https://medical.criveradev.cl` (con `https://`, sin slash final) → esto resuelve
el CORS tanto de Express como de Socket.io para el nuevo dominio.

> ⚠️ **Error común:** si `CLIENT_URL` queda sin el prefijo `https://` (por ejemplo
> `medical.criveradev.cl` a secas), el backend rechaza el origen con un error
> `403` / *CORS no exitoso*, porque la comparación de origen es por texto exacto.

### 7. Caché — Redis (Upstash)

Crea una base Redis gratuita en [upstash.com](https://upstash.com), copia la URL
de la pestaña **TCP** (empieza con `rediss://`, con TLS) y agrégala en Render:

```
REDIS_URL=rediss://default:TU_PASSWORD@xxxx.upstash.io:6379
```

Es opcional: sin `REDIS_URL`, la app funciona consultando MongoDB directamente.

### 8. Email — Brevo por API HTTP (importante)

> ⚠️ **Render (plan gratuito) bloquea la salida SMTP** (puertos 25/465/587), así
> que iCloud/Gmail/Brevo-SMTP dan *Connection timeout*. La solución es enviar por
> la **API HTTP de Brevo** (puerto 443), que el código usa automáticamente cuando
> existe `BREVO_API_KEY`.

1. Crea cuenta en [brevo.com](https://www.brevo.com) y **autentica tu dominio**
   (SPF + DKIM) o verifica un remitente; define ese correo en `EMAIL_FROM`.
2. En Brevo → **SMTP y API → API Keys** → genera una clave (`xkeysib-...`).
3. En Brevo → **Security → Authorized IPs**: **desactiva la restricción** (las IP
   de Render free son dinámicas; si no, el envío falla con 401).
4. En Render agrega:
   ```
   BREVO_API_KEY=xkeysib-...
   EMAIL_FROM=noreply@tudominio.com
   ```

> ⚠️ **Plan gratuito de Render:** el servicio se suspende tras un rato de
> inactividad (la primera petición puede tardar ~30 s) y, al estar dormido, el
> recordatorio por cron de las 09:00 puede no dispararse. Para cron confiable usa
> un plan de pago o un host sin suspensión (Fly.io, VPS).

### Alternativa: Docker (local o VPS)

El `medical-server` incluye **Dockerfile** y **docker-compose.yml** (backend +
MongoDB + Redis):

```bash
cd medical-server
docker compose up -d --build
```

---

## 🗺 Roadmap

### Actual ✅
- [x] Autenticación con access + refresh token (hasheado y revocable)
- [x] RBAC por módulo/acción + aislamiento de datos del paciente
- [x] CRUD de citas con disponibilidad y anti-solapamiento
- [x] Pacientes y doctores (matrícula automática/editable, horarios, fotos)
- [x] Historial clínico + recetas en PDF
- [x] Resultados de exámenes con archivos en Cloudinary
- [x] Pagos con comprobante descargable
- [x] Reportes con gráficos y exportación PDF/Excel
- [x] Notificaciones en tiempo real (Socket.io) y correos
- [x] Recordatorios automáticos (cron) y caché con Redis
- [x] Seguridad: Helmet, CORS, rate limiting, sanitización, Sentry
- [x] Tests (Jest + Supertest), Swagger y Docker

### Próximamente
- [ ] Pago en línea integrado (pasarela)
- [ ] Búsqueda y filtros avanzados en listados
- [ ] Modo oscuro
- [ ] Tests end-to-end del frontend

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver [`LICENSE`](./LICENSE) para más información.

---

## 👨‍💻 Autor

<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://res.cloudinary.com/djgmiody1/image/upload/v1782698757/logo-dark_qddsa3.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://res.cloudinary.com/djgmiody1/image/upload/v1782698757/logo-light_wilpp4.svg">
    <img
      alt="criveradev"
      src="https://res.cloudinary.com/djgmiody1/image/upload/v1782698757/logo-light_wilpp4.svg"
      width="300">
  </picture>
</p>
