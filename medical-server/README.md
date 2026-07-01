<div align="center">

# 🏥 Medical · API

**Backend REST del sistema de citas médicas — `medical-server`**

Citas, historial clínico, recetas, resultados, pagos y reportes, con autenticación
JWT, control de acceso por rol (RBAC) y autorización a nivel de objeto.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](#-referencia-de-endpoints)
[![Jest](https://img.shields.io/badge/Tests-170%20passing-C21325?style=for-the-badge&logo=jest&logoColor=white)](#-tests)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-docker)

<br/>

📡 **[API](https://api.medical.criveradev.cl/health)** &nbsp;·&nbsp;
📖 **[Documentación Swagger](https://api.medical.criveradev.cl/api/docs/)** &nbsp;·&nbsp;
📦 **[README del monorepo](../README.md)**

</div>

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Inicio rápido](#-inicio-rápido)
- [Docker](#-docker)
- [Variables de entorno](#-variables-de-entorno)
- [Modelo de datos](#-modelo-de-datos)
- [Autenticación, roles y permisos](#-autenticación-roles-y-permisos)
- [Referencia de endpoints](#-referencia-de-endpoints)
- [Seguridad](#-seguridad)
- [Tiempo real (Socket.io)](#-tiempo-real-socketio)
- [Caché Redis](#-caché-redis)
- [Archivos (Cloudinary)](#-archivos-cloudinary)
- [Reportes y exportación](#-reportes-y-exportación)
- [Tareas programadas (cron)](#-tareas-programadas-cron)
- [Notificaciones por correo](#-notificaciones-por-correo)
- [Manejo de errores y logs](#-manejo-de-errores-y-logs)
- [Tests](#-tests)
- [Scripts](#-scripts)
- [Hardening de seguridad reciente](#-hardening-de-seguridad-reciente)
- [Funcionalidades recientes](#-funcionalidades-recientes)

---

## ✨ Características

- 🔐 **Autenticación JWT** — access + refresh con rotación; el refresh se guarda hasheado (SHA-256).
- 👥 **RBAC + scoping por objeto** — permisos por rol y, para pacientes, acceso solo a sus propios datos.
- 📅 **Agenda inteligente** — disponibilidad por horarios del doctor y detección de solapamientos.
- 🧾 **Clínico completo** — historial, recetas descargables, resultados (archivos en Cloudinary) y pagos con comprobante.
- 📧 **Correos transaccionales** — agendar, confirmar, cancelar, recordar y nuevo resultado.
- 🔔 **Tiempo real** — notificaciones por Socket.io (con handshake autenticado).
- 📊 **Reportes** — métricas por doctor y globales, con exportación a PDF y Excel.
- ⚡ **Caché Redis** — con degradación *graceful* si Redis no está disponible.
- 📚 **Swagger** en `/api/docs` y ✅ **suite de 170 tests** (Jest + Supertest).

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Caché | Redis + ioredis |
| Tiempo real | Socket.io |
| Archivos | Cloudinary + Multer |
| Auth | JWT (access + refresh token con rotación) |
| Seguridad | Helmet, CORS, Rate Limiting, sanitización XSS y NoSQL, RBAC + scoping por objeto |
| Logs | Winston + Morgan |
| Errores | Sentry |
| Docs | Swagger UI (OpenAPI 3.0) |
| Tests | Jest + Supertest |
| Contenedores | Docker + Docker Compose |

---

## 📁 Estructura del proyecto

```
medical-server/
├── server.js                   # Punto de entrada (HTTP + Socket.io + MongoDB)
├── instrument.js               # Inicialización de Sentry (carga primero)
├── Dockerfile                  # Imagen del backend (node:20-alpine)
├── docker-compose.yml          # backend + mongo + redis
├── src/
│   ├── app.js                  # Configuración de Express y middlewares
│   ├── config/
│   │   ├── cloudinary.js       # Conexión a Cloudinary
│   │   ├── email.js            # Configuración de Nodemailer
│   │   ├── env.js              # Validación de variables de entorno requeridas
│   │   ├── logger.js           # Winston (logs estructurados)
│   │   ├── multer.js           # Upload a Cloudinary (resultados + avatares)
│   │   ├── redis.js            # Conexión a Redis con degradación graceful
│   │   ├── sentry.js           # Exporta instancia de Sentry
│   │   └── swagger.js          # Spec OpenAPI 3.0
│   ├── controllers/            # Lógica de negocio por módulo
│   ├── middleware/
│   │   ├── auth.js             # authenticate + authorize + scopePaciente
│   │   ├── errores.js          # Manejador centralizado de errores
│   │   ├── morgan.js           # Logger HTTP
│   │   ├── sanitizar.js        # Anti inyección NoSQL (body + query)
│   │   ├── validar.js          # Captura de errores de express-validator
│   │   ├── xss.js              # Sanitización XSS
│   │   └── validaciones/       # Reglas por módulo (auth, citas, pacientes, pagos, historial)
│   ├── models/                 # Esquemas Mongoose (10 entidades)
│   ├── routes/                 # Swagger JSDoc + Express Router
│   ├── seed/
│   │   ├── roles.seed.js       # 5 roles del sistema
│   │   └── admin.seed.js       # Usuario administrador inicial
│   └── services/
│       ├── cache.service.js          # Abstracción Redis (get/set/del/TTL)
│       ├── email.service.js          # Emails transaccionales
│       ├── exportar.service.js       # PDF (pdfkit) + Excel (exceljs)
│       ├── notificaciones.service.js # Socket.io
│       └── recordatorios.service.js  # Cron jobs
└── tests/                      # Jest + Supertest (12 suites, incl. idor.test.js)
```

---

## 🚀 Inicio rápido

### Requisitos

- Node.js 20+
- MongoDB 7+
- Redis 7+ (opcional — el caché degrada a MongoDB si no está disponible)

### Instalación

```bash
cd medical-server
npm install
cp .env.example .env
# Completar .env con tus credenciales
```

### Seed inicial

```bash
npm run seed:roles   # Crea los 5 roles del sistema
npm run seed:admin   # Crea el usuario admin inicial (admin@medical.com / Admin1234)
```

### Ejecutar

```bash
npm run dev    # Desarrollo (nodemon + hot reload)
npm start      # Producción (NODE_ENV=production)
```

La API queda en `http://localhost:3000` y la documentación interactiva en `http://localhost:3000/api/docs`.

---

## 🐳 Docker

El `docker-compose.yml` orquesta **tres servicios**: `backend`, `mongo` y `redis`, con volúmenes persistentes (`mongo_data`, `redis_data`, `uploads`, `logs`).

```bash
cd medical-server

# Construir y levantar todo el stack
docker compose up -d --build

# Cargar datos iniciales dentro del contenedor
docker compose exec backend npm run seed:roles
docker compose exec backend npm run seed:admin

# Estado y logs
docker compose ps
docker compose logs -f backend
```

| Servicio | Imagen | Puerto | Volumen |
|---|---|---|---|
| backend | build local (`Dockerfile`) | 3000 | `uploads`, `logs` |
| mongo | `mongo:7` | 27017 | `mongo_data` |
| redis | `redis:7-alpine` | 6379 | `redis_data` |

Dentro de Docker el backend usa `MONGO_URI=mongodb://mongo:27017/medical_db` (fijado en el compose); el `.env` con `localhost` se mantiene para correr la app o los tests fuera de Docker. Para usar MongoDB Atlas, reemplaza esa línea por tu cadena `mongodb+srv://...`.

Comandos útiles:

```bash
docker compose stop      # detener sin borrar
docker compose down      # eliminar contenedores (conserva volúmenes)
docker compose down -v   # eliminar también los volúmenes (borra datos)
```

---

## 🌐 Variables de entorno

Al arrancar, `src/config/env.js` valida que existan **todas** las variables requeridas; si falta alguna, el proceso termina con código de error.

Hay un `.env.example` listo para copiar (`cp .env.example .env`). Variables principales:

```env
# Servidor
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:4200          # frontend permitido por CORS

# MongoDB
MONGO_URI=mongodb://localhost:27017/medical_db

# Redis (opcional) — usa REDIS_URL (proveedor gestionado, rediss:// = TLS) o host/puerto
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=clave_muy_larga_y_segura
JWT_REFRESH_SECRET=otra_clave_diferente
JWT_EXPIRES=8h

# Email (iCloud · App-Specific Password; también sirve Gmail) — para DESARROLLO local
EMAIL_HOST=smtp.mail.me.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@icloud.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=                 # remitente verificado (opcional; si no, usa EMAIL_USER)

# Email vía API HTTP (puerto 443) — para hosts que bloquean SMTP (Render free, Railway).
# Si se define, el envío usa la API de Brevo en vez de SMTP (ignora EMAIL_HOST/PORT/USER/PASS).
BREVO_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_key
CLOUDINARY_API_SECRET=tu_secret

# Sentry (opcional)
SENTRY_DSN=https://...
```

> **Requeridas** (bloquean el arranque si faltan): `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES`, `CLIENT_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
>
> **Opcionales:** `SENTRY_DSN` (sin él, Sentry queda inactivo), `REDIS_URL`/`REDIS_*` (sin Redis, el caché degrada a MongoDB), `EMAIL_FROM` y `BREVO_API_KEY` (envío por API HTTP en hosts con SMTP bloqueado).
>
> **Opcionales** para ajustar el rate limiting (útiles en desarrollo tras el proxy): `RATE_LIMIT_MAX` (límite general/15 min) y `LOGIN_RATE_MAX` (intentos de login/15 min). Sin definirlas, valen 100/5 en producción y 1000/100 en desarrollo. En el `docker-compose.yml` vienen holgadas para dev.

---

## 🗂 Modelo de datos

Diez entidades. Las referencias se resuelven con `populate` de Mongoose.

```
Departamento 1──N Especialidad 1──N Doctor ──1 User
                                       │
User ──1 Paciente                      │
   │        │                          │
   │        └──────────N Cita N────────┘
   │                      │
   │            ┌─────────┼──────────┬───────────┐
   │         Historial   Pago    Resultado   (notificaciones)
   │          (1:1 cita) (1:1 cita)
   └──1 Role (permisos por módulo)
```

| Entidad | Campos clave | Notas |
|---|---|---|
| **User** | nombre, apellido, email (único), password (hash bcrypt, `select:false`), roleId, telefono, activo, refreshToken (hash, `select:false`) | Base de todo usuario del sistema (staff y pacientes) |
| **Role** | nombre (enum), permisos[`{module, actions[]}`], activo | `administrador` tiene acceso total sin revisar permisos |
| **Paciente** | usuarioId (único), rut (único), fechaNacimiento, genero, prevision, contactoEmergencia, foto, activo | Ficha clínica ligada a un User |
| **Doctor** | usuarioId (único), especialidadId, matricula (única), duracionConsulta, horarios[`{dia, horaInicio, horaFin, activo}`], foto, activo | Agenda y duración de consulta |
| **Departamento** | nombre (único), descripcion, activo | — |
| **Especialidad** | nombre, descripcion, departamentoId, activo | Pertenece a un departamento |
| **Cita** | pacienteId, doctorId, fechaHora, motivo, estado (enum), tipo (enum), observaciones, datos de cancelación | Índices: `{doctorId, fechaHora}`, `{pacienteId, fechaHora}`, `{estado}` |
| **Historial** | pacienteId, citaId (único), doctorId, diagnostico, tratamiento, receta, observaciones, proximaCita | 1 por cita; al crearlo la cita pasa a `completada` |
| **Pago** | citaId (único), pacienteId, monto, estado (enum), metodo (enum), comprobante, fechaPago | 1 pago por cita |
| **Resultado** | pacienteId, citaId, doctorId, tipo (enum), nombre, descripcion, archivo (Cloudinary), observaciones, fecha | Archivo se borra de Cloudinary al eliminar |

**Estados de Cita:** `pendiente` → `confirmada` → `completada`, o `cancelada` / `no_asistio`.
**Tipos de Cita:** `primera_vez`, `control`, `urgencia`.
**Estados de Pago:** `pendiente`, `pagado`, `anulado`. **Métodos:** `efectivo`, `tarjeta`, `transferencia`, `fonasa`, `isapre`.

---

## 🔐 Autenticación, roles y permisos

### Doble token JWT

- **accessToken** — vida corta (`JWT_EXPIRES`, por defecto 8h). Se envía en cada request.
- **refreshToken** — vida larga (7 días). Se guarda **hasheado (SHA-256)** en la BD para poder invalidarlo en logout y detectar reutilización. En `/refresh` se rota (se emite uno nuevo).

```http
Authorization: Bearer <accessToken>
```

Flujo: `login` → tokens · `refresh` → nuevos tokens · `logout` / `cambiar-password` → invalida el refresh token.

### Control de acceso (RBAC)

Cada ruta protegida pasa por `authenticate` (verifica el JWT y carga `req.user`/`req.role`) y por `authorize(modulo, accion)` (verifica el permiso del rol). El `administrador` siempre tiene acceso total.

**Matriz de permisos** (definida en `src/seed/roles.seed.js`):

| Módulo | administrador | recepcionista | enfermero | doctor | paciente |
|---|---|---|---|---|---|
| usuarios | total | — | — | — | — |
| pacientes | total | crear, leer, editar | crear, leer, editar | leer | — |
| citas | total | crear, leer, editar | — | leer¹ | leer² |
| calendario | total | — | leer | leer | — |
| historial | total | leer | leer | crear, leer, editar | leer² |
| resultados | total | — | crear, leer | crear, leer, editar | leer² |
| pagos | total | crear, leer, editar | — | — | leer² |
| reportes | total | — | — | leer | — |
| departamentos | total | — | — | — | — |
| especialidades | total | — | — | — | — |
| doctores | total | leer | — | — | — |

> ¹ El **doctor** tiene `citas:leer` para ver su agenda; la interfaz filtra por su propio `doctorId`.
>
> ² **Autorización a nivel de objeto:** el rol `paciente` solo accede a **sus propios** datos. El middleware `scopePaciente` fuerza que cualquier `pacienteId` solicitado coincida con el del usuario autenticado y filtra los listados; un acceso a datos ajenos devuelve `403`.

---

## 📡 Referencia de endpoints

Base URL: `http://localhost:3000`. Todas las rutas (salvo `login` y `refresh`) requieren `Authorization: Bearer <token>`. La columna **Permiso** indica `modulo:accion` exigido.

### Auth · `/api/auth`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/login` | público | Login — retorna accessToken + refreshToken + usuario |
| POST | `/refresh` | público | Renueva el access token (rota el refresh) |
| POST | `/logout` | autenticado | Invalida el refresh token |
| GET | `/perfil` | autenticado | Perfil del usuario autenticado |
| PUT | `/perfil/foto` | autenticado | Sube/actualiza la foto de perfil (Cloudinary) |
| PUT | `/cambiar-password` | autenticado | Cambia la contraseña (mín. 8, con letra y número) |
| GET | `/usuarios` | usuarios:leer | Lista el staff |
| POST | `/usuarios` | usuarios:crear | Crea un usuario |
| PUT | `/usuarios/:id` | usuarios:editar | Actualiza un usuario |
| DELETE | `/usuarios/:id` | usuarios:eliminar | Desactiva (soft delete) un usuario |

### Departamentos · `/api/departamentos`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | departamentos:leer |
| POST | `/` | departamentos:crear |
| PUT | `/:id` | departamentos:editar |
| DELETE | `/:id` | departamentos:eliminar |

### Especialidades · `/api/especialidades`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | especialidades:leer |
| GET | `/departamento/:departamentoId` | especialidades:leer |
| POST | `/` | especialidades:crear |
| PUT | `/:id` | especialidades:editar |
| DELETE | `/:id` | especialidades:eliminar |

### Doctores · `/api/doctores`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/` | doctores:leer | Lista paginada con filtro `?especialidadId=` (caché 5 min) |
| GET | `/mi-perfil` | autenticado | Perfil del doctor autenticado (para su agenda) |
| GET | `/siguiente-matricula` | doctores:crear | Previsualiza la próxima matrícula (`MED-####`) |
| GET | `/:id` | doctores:leer | Detalle |
| GET | `/disponibilidad/:doctorId?fecha=` | citas:leer | Slots libres en una fecha |
| POST | `/` | doctores:crear | Alta de doctor (matrícula automática si no se envía) |
| PUT | `/:id` | doctores:editar | Actualizar |
| PUT | `/:id/horarios` | doctores:editar | Actualizar horarios de atención |
| PUT | `/:id/foto` | doctores:editar | Foto de perfil → Cloudinary |

### Pacientes · `/api/pacientes`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/mi-ficha` | autenticado | Ficha del paciente autenticado |
| GET | `/?page=&limit=&buscar=` | pacientes:leer | Lista paginada con búsqueda |
| GET | `/:id` | pacientes:leer | Detalle |
| POST | `/` | pacientes:crear | Registro (valida rut, email, etc.) |
| PUT | `/:id` | pacientes:editar | Actualizar |
| DELETE | `/:id` | pacientes:eliminar | Desactivar |
| PUT | `/:id/foto` | pacientes:editar | Foto de perfil → Cloudinary |

### Citas · `/api/citas`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/?page=&limit=&estado=&doctorId=&fecha=` | citas:leer | Lista paginada (scoping de paciente) |
| GET | `/:id` | citas:leer | Detalle (scoping de paciente) |
| GET | `/disponibilidad/:doctorId?fecha=` | citas:leer | Slots disponibles del doctor |
| POST | `/` | citas:crear | Crear cita (verifica solapamiento) |
| PUT | `/:id` | citas:editar | Reprogramar / editar |
| PUT | `/:id/estado` | citas:editar | Cambiar estado (confirmada envía email) |

### Historial · `/api/historial`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/paciente/:pacienteId` | historial:leer | Historial del paciente (scoping) |
| GET | `/:id` | historial:leer | Registro por ID (scoping) |
| POST | `/` | historial:crear | Crear registro (marca la cita `completada`) |
| PUT | `/:id` | historial:editar | Actualizar registro |

### Pagos · `/api/pagos`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/?estado=&pacienteId=&desde=&hasta=` | pagos:leer | Lista + total recaudado (scoping) |
| GET | `/:id` | pagos:leer | Detalle (scoping) |
| POST | `/` | pagos:crear | Registrar pago (1 por cita) |
| PUT | `/:id` | pagos:editar | Actualizar pago |
| PUT | `/:id/anular` | pagos:editar | Anular pago |

### Resultados · `/api/resultados`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/paciente/:pacienteId` | resultados:leer | Resultados del paciente (scoping) |
| GET | `/:id` | resultados:leer | Detalle (scoping) |
| POST | `/` | resultados:crear | Registrar resultado + archivo (multipart) |
| PUT | `/:id` | resultados:editar | Actualizar |
| DELETE | `/:id` | resultados:eliminar | Eliminar (borra el archivo de Cloudinary) |

### Reportes · `/api/reportes`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/doctor/:doctorId?desde=&hasta=` | reportes:leer | Estadísticas del doctor (JSON) |
| GET | `/doctor/:doctorId/pdf` | reportes:leer | Reporte del doctor en PDF |
| GET | `/doctor/:doctorId/excel` | reportes:leer | Reporte del doctor en Excel |
| GET | `/admin?desde=&hasta=` | reportes:leer | Reporte general del sistema |

### Documentación interactiva

```
http://localhost:3000/api/docs
```

---

## 🛡 Seguridad

Defensa en capas configurada en `src/app.js`:

| Mecanismo | Detalle |
|---|---|
| **Helmet** | Cabeceras de seguridad HTTP (CSP, HSTS, etc.). |
| **CORS** | Solo el origen de `CLIENT_URL` (más `localhost:4200`); permite requests sin origen (Postman/curl). |
| **Rate limiting** | General: 100 req/15 min en producción. Login: 5 intentos/15 min (anti fuerza bruta). |
| **Sanitización NoSQL** | `middleware/sanitizar.js` elimina claves con `$` de `body` y `query` (compatible con el `req.query` de solo lectura de Express 5). |
| **Sanitización XSS** | `middleware/xss.js` limpia el HTML de los strings del body (excluye `/api/docs`). |
| **Contraseñas** | bcrypt (12 rondas). Política: mínimo 8 caracteres con al menos una letra y un número. El hash nunca se devuelve (`select:false` + `toJSON`). |
| **Refresh tokens** | Guardados hasheados (SHA-256), rotados en cada `/refresh`, invalidados en logout y al cambiar contraseña. |
| **RBAC + scoping** | `authorize(modulo, accion)` por rol y `scopePaciente` a nivel de objeto para el rol paciente. |
| **Candado anti-escalada** | Un usuario no puede cambiar su propio rol ni autodesactivarse. |
| **Archivos protegidos** | `/uploads` (fallback local) requiere autenticación. |
| **Sentry** | `sendDefaultPii: false` — no envía datos personales/clínicos a un tercero. |

---

## ⚡ Tiempo real (Socket.io)

El cliente se une a salas por rol o por identificador y recibe eventos en vivo.

```js
const socket = io('http://localhost:3000');

socket.emit('join', 'administrador');
socket.emit('join', `doctor:${doctorId}`);
socket.emit('join', `paciente:${pacienteId}`);

socket.on('cita:nueva',       (data) => {});  // → admins y doctor asignado
socket.on('cita:actualizada', (data) => {});  // → admins, doctor y paciente
socket.on('pago:nuevo',       (data) => {});  // → admins
socket.on('resultado:nuevo',  (data) => {});  // → paciente
socket.on('historial:nuevo',  (data) => {});  // → paciente
```

---

## 🗄️ Caché Redis

Degradación *graceful*: si Redis no está disponible, el servidor consulta MongoDB directamente sin errores.

```
[CACHE MISS] departamentos:todos → consultando MongoDB
[CACHE HIT]  departamentos:todos
```

| Clave | TTL | Se invalida al... |
|---|---|---|
| `departamentos:todos` | 30 min | escribir en departamentos |
| `especialidades:todas` | 30 min | escribir en especialidades |
| `especialidades:dep:{id}` | 30 min | escribir en especialidades |
| `doctores:lista:{page}:{limit}:{filtro}` | 5 min | escribir en doctores |

---

## 📤 Archivos (Cloudinary)

| Módulo | Carpeta | Límite |
|---|---|---|
| Resultados médicos | `medical-app/resultados` | PDF/JPG/PNG — 5 MB |
| Fotos de perfil | `medical-app/avatares` | JPG/PNG/WebP — 2 MB — 400×400 |

Al eliminar un resultado, el archivo se borra automáticamente de Cloudinary.

---

## 📊 Reportes y exportación

- **Reporte de doctor** (`/api/reportes/doctor/:id`): atenciones completadas, pacientes únicos y desglose por estado en un rango de fechas (`desde`/`hasta`), vía agregaciones de MongoDB. Exportable a **PDF** (pdfkit) y **Excel** (exceljs).
- **Reporte de admin** (`/api/reportes/admin`): métricas generales del sistema en un rango de fechas.

---

## ⏰ Tareas programadas (cron)

`src/services/recordatorios.service.js` usa `node-cron`: todos los días a las **09:00** busca las citas del día siguiente en estado `pendiente`/`confirmada` y envía un email de recordatorio al paciente.

---

## 📧 Notificaciones por correo

`src/services/email.service.js` (Nodemailer + SMTP) envía correos automáticos al paciente. Los envíos son tolerantes a fallos: si el SMTP falla, se registra en logs sin interrumpir la operación.

| Evento | Disparador | Asunto |
|---|---|---|
| Cita agendada | `POST /api/citas` | 📅 Cita médica agendada |
| Cita confirmada | `PUT /api/citas/:id/estado` → `confirmada` | ✅ Cita médica confirmada |
| Cita cancelada | `PUT /api/citas/:id/estado` → `cancelada` | ❌ Cita médica cancelada |
| Recordatorio | cron diario 09:00 (citas del día siguiente) | ⏰ Recordatorio de cita médica |
| Nuevo resultado | `POST /api/resultados` | 🧪 Nuevo resultado médico disponible |

> **Local (SMTP):** por defecto **iCloud** (`smtp.mail.me.com:587`, STARTTLS) con una *app-specific password*; también sirve Gmail (`smtp.gmail.com:587` + App Password). Al arrancar, el log muestra `Servidor de email listo` si la conexión es correcta.
>
> **Producción (API HTTP):** muchos hosts (Render free, Railway) **bloquean la salida SMTP** (puertos 25/465/587 → *Connection timeout*). Por eso, si defines `BREVO_API_KEY`, el envío usa la **API HTTP de Brevo** (puerto 443) en lugar de SMTP, y el log muestra `Email vía API HTTP de Brevo (sin SMTP)`. El remitente es `EMAIL_FROM`. Nota: si Brevo tiene activadas las *Authorized IPs*, desactívalas (las IP de hosts gratuitos son dinámicas) o el envío fallará con `401`.

---

## 🧯 Manejo de errores y logs

- **Errores centralizados** (`middleware/errores.js`): traduce errores de Mongoose (`ValidationError`, `CastError`, duplicado `11000`), JWT (inválido/expirado) y CORS a respuestas JSON con el código HTTP correcto, y los reporta a Sentry.
- **Logs** con Winston: `logs/error.log` (solo errores), `logs/combined.log` (todo) y consola con colores. Las peticiones HTTP se registran con Morgan integrado a Winston.

---

## 🧪 Tests

```bash
npm test                # Ejecuta todas las suites
npm run test:watch      # Modo watch
npm run test:coverage   # Con reporte de cobertura
```

- Usa una base separada `mongodb://localhost:27017/medical_test` y limpia las colecciones entre cada test. Redis queda deshabilitado en `NODE_ENV=test`.
- 12 suites por módulo, incluida **`idor.test.js`** que verifica la autorización a nivel de objeto: un paciente recibe `403` al intentar leer datos de otro y `200` con los propios (historial, resultados, pagos y citas).
- Con el stack Docker arriba puedes correr los tests desde tu máquina (el contenedor Mongo expone el `27017`).

---

## 📋 Scripts

```bash
npm run dev           # Desarrollo (nodemon)
npm start             # Producción
npm test              # Tests
npm run test:coverage # Cobertura
npm run seed:roles    # Seed de roles
npm run seed:admin    # Seed del admin
```

---

## 🔒 Hardening de seguridad reciente

Mejoras aplicadas tras una auditoría del backend:

1. **IDOR cerrado** — middleware `scopePaciente`: el rol paciente solo accede a sus propios datos (citas, historial, pagos, resultados). Cubierto por `tests/idor.test.js`.
2. **Sentry sin PII** — `sendDefaultPii: false`.
3. **Refresh tokens hasheados** (SHA-256) y `select:false` en `password`/`refreshToken`.
4. **Solapamiento de citas correcto** — la verificación compara intervalos completos, detectando citas previas que se solapan.
5. **Índices** en `Cita`, `Pago`, `Historial`, `Resultado`.
6. **Validación** ampliada (pagos, historial) y **política de contraseñas** más fuerte.
7. **Candado anti-escalada** de rol y saneo de campos en la actualización de usuarios.
8. **Sanitización NoSQL** ahora también sobre `req.query`; **`/uploads`** protegido tras autenticación.

---

## 🆕 Funcionalidades recientes

- **Foto de perfil por usuario** — campo `foto` en `User` y endpoint `PUT /api/auth/perfil/foto` (Cloudinary, cualquier rol).
- **Endpoints "míos"** — `GET /api/pacientes/mi-ficha` y `GET /api/doctores/mi-perfil` para que paciente y doctor obtengan sus propios datos sin permisos de módulo.
- **Matrícula del doctor** automática (`MED-####`) y previsualizable (`GET /api/doctores/siguiente-matricula`), editable al crear/actualizar.
- **Login tolerante** — el email se normaliza (minúsculas/espacios). En pacientes, el RUT se guarda formateado pero la **contraseña inicial es el RUT sin puntos ni guion**.
- **Correos transaccionales** ampliados: agendar, confirmar, cancelar, recordar y nuevo resultado (ver sección Notificaciones por Correo).
- **Permisos ajustados** — `recepcionista` con `doctores:leer` (para agendar) y `doctor` con `citas:leer` (para su agenda).
- **Rate limiting configurable** por `RATE_LIMIT_MAX` / `LOGIN_RATE_MAX`.

---

## 🗺️ Flujo de una cita (end-to-end)

```
Crear Departamento → Crear Especialidad → Crear Usuario Doctor → Crear Doctor
→ Crear Paciente → Crear Cita → Confirmar Cita (email + Socket.io)
→ Registrar Historial (la cita pasa a 'completada') → Registrar Pago
→ Exportar Reporte PDF/Excel
```

---

<div align="center">

**Medical · API** — parte del monorepo **[Medical](../README.md)** · Licencia MIT

Documentación interactiva siempre disponible en `/api/docs`

</div>
