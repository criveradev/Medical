<div align="center">

# 🏥 Medical — Frontend (`medical-client`)

**Interfaz web del sistema de citas médicas Medical**

Web pública de la clínica y portal autenticado por rol (administración, recepción,
doctor y paciente). Construida con **React + Vite + Tailwind CSS v4** y consume el
backend `medical-server`.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Router](https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)

</div>

> 📖 Documentación general del proyecto (arquitectura completa, API, despliegue) en el
> [README raíz](../README.md).

---

## 📋 Tabla de contenidos

- [Stack](#-stack)
- [Puesta en marcha](#-puesta-en-marcha)
- [Variables y proxy](#-variables-y-proxy)
- [Estructura](#-estructura)
- [Rutas](#-rutas)
- [Arquitectura de la app](#-arquitectura-de-la-app)
- [El portal por rol](#-el-portal-por-rol)
- [Autenticación y sesión](#-autenticación-y-sesión)
- [Tiempo real y documentos](#-tiempo-real-y-documentos)
- [Sistema de diseño](#-sistema-de-diseño)
- [Componentes de UI](#-componentes-de-ui)
- [Notas técnicas](#-notas-técnicas)

---

## 🛠 Stack

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.x | Librería de interfaz |
| Vite | 6.x | Dev server y build |
| Tailwind CSS | 4.x | Estilos utilitarios (`@tailwindcss/vite`) |
| React Router DOM | 6.x | Navegación SPA + rutas anidadas |
| Recharts | 2.x | Gráficos del dashboard |
| socket.io-client | 4.x | Notificaciones en tiempo real |
| react-phone-number-input | 3.x | Campo de teléfono internacional |
| lucide-react | — | Iconos |

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 20+
- El backend `medical-server` corriendo en `http://localhost:3000` (local o Docker)

```bash
cd medical-client
npm install
npm run dev
```

La app queda en **`http://localhost:4200`**.

Para probar el login usa el admin sembrado en el backend:
**admin@medical.com / Admin1234**.

### Scripts

```bash
npm run dev       # servidor de desarrollo (puerto 4200)
npm run build     # build de producción → dist/
npm run preview   # sirve el build de producción
```

---

## 🔌 Variables y proxy

No requiere archivo `.env`: en desarrollo, las llamadas son **same-origin** gracias
al proxy de Vite, que reenvía `/api` y `/socket.io` al backend en `:3000` (evitando
CORS). El puerto **4200** ya está permitido por el CORS del backend.

```js
// vite.config.js
server: {
  port: 4200,
  proxy: {
    '/api':       { target: 'http://localhost:3000', changeOrigin: true },
    '/socket.io': { target: 'http://localhost:3000', ws: true },
  },
}
```

> En producción, sirve el `dist/` detrás del mismo dominio que la API (o configura
> un reverse proxy equivalente) para mantener las rutas `/api` y `/socket.io`.

---

## 📁 Estructura

```
medical-client/
├── index.html
├── vite.config.js              # plugins + proxy /api y /socket.io → :3000
├── public/
└── src/
    ├── main.jsx                # punto de entrada (Router + Providers)
    ├── App.jsx                 # árbol de rutas (público + portal protegido)
    ├── index.css               # Tailwind v4 + tema "azul clínico"
    │
    ├── lib/                    # utilidades sin estado
    │   ├── api.js              # cliente fetch (JWT + refresh automático + upload)
    │   ├── format.js           # fechas, RUT, moneda CLP, etiquetas/colores de estado
    │   ├── roles.js            # ítems del menú del portal según rol
    │   ├── receta.js           # receta médica imprimible/PDF
    │   └── voucher.js          # comprobante de pago imprimible/PDF
    │
    ├── hooks/
    │   ├── useFetch.js         # GET con loading/error/reload
    │   ├── useMiFicha.js       # ficha del paciente autenticado (pacienteId)
    │   └── useMiDoctor.js      # perfil del doctor autenticado (doctorId)
    │
    ├── context/
    │   ├── AuthContext.jsx           # sesión: login/logout/actualizarFoto + tokens
    │   ├── NotificationsContext.jsx  # Socket.io en tiempo real (por rol)
    │   └── ToastContext.jsx          # notificaciones tipo toast
    │
    ├── components/
    │   ├── Navbar.jsx, Footer.jsx    # landing pública
    │   ├── ui.jsx                    # primitivos de UI compartidos
    │   └── portal/
    │       ├── PortalLayout.jsx      # layout del portal (sidebar por rol + header)
    │       ├── ProtectedRoute.jsx    # guard: redirige a /login sin sesión
    │       └── NotificationBell.jsx  # campana de notificaciones
    │
    ├── data/clinic.js          # contenido de marketing de la landing
    │
    └── pages/
        ├── Home.jsx, Login.jsx                  # público
        └── portal/
            ├── Dashboard, Citas, Pacientes, Doctores,
            │   Especialidades, Departamentos, Usuarios, Pagos, Perfil
            ├── doctor/         # MiAgenda, SubirResultado
            └── paciente/       # MisCitas, MiHistorial, MisResultados, MisPagos
```

---

## 🧭 Rutas

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | `Home` | Público |
| `/login` | `Login` | Público |
| `/portal` | `Dashboard` | Autenticado (dashboard según rol) |
| `/portal/perfil` | `Perfil` | Cualquier usuario |
| `/portal/citas` | `Citas` | Admin · Recepción |
| `/portal/pacientes` | `Pacientes` | Admin · Recepción |
| `/portal/pagos` | `Pagos` | Admin · Recepción |
| `/portal/doctores` | `Doctores` | Admin |
| `/portal/especialidades` | `Especialidades` | Admin |
| `/portal/departamentos` | `Departamentos` | Admin |
| `/portal/usuarios` | `Usuarios` | Admin |
| `/portal/mi-agenda` | `MiAgenda` | Doctor |
| `/portal/subir-resultado` | `SubirResultado` | Doctor |
| `/portal/mis-citas` | `MisCitas` | Paciente |
| `/portal/mi-historial` | `MiHistorial` | Paciente |
| `/portal/mis-resultados` | `MisResultados` | Paciente |
| `/portal/mis-pagos` | `MisPagos` | Paciente |

Todas las rutas bajo `/portal` están envueltas en `ProtectedRoute` + `PortalLayout`.
El menú lateral solo muestra los ítems permitidos para el rol (ver `lib/roles.js`).

---

## 🏗 Arquitectura de la app

La app se monta con tres _providers_ anidados (ver `main.jsx`):

```
BrowserRouter
└── ToastProvider            # toasts globales (success / error / info)
    └── AuthProvider         # sesión y tokens (persistida en localStorage)
        └── NotificationsProvider   # socket autenticado → notificaciones en vivo
            └── App          # rutas
```

Separación de responsabilidades:

- **`lib/`** — lógica pura sin estado (cliente HTTP, formateadores, generación de PDF).
- **`hooks/`** — acceso a datos reutilizable (`useFetch` y derivados por rol).
- **`context/`** — estado global transversal (sesión, notificaciones, toasts).
- **`components/`** — piezas de UI reutilizables (landing + primitivos + portal).
- **`pages/`** — vistas conectadas a la API, una por ruta.

---

## 🔑 El portal por rol

Tras iniciar sesión se entra al portal, con un menú lateral que se adapta al **rol**:

- **Administrador** — dashboard con métricas y gráficos (`/api/reportes/admin`) y
  gestión de citas, pacientes, doctores, especialidades, departamentos y usuarios.
- **Recepción** — accesos rápidos, citas (con disponibilidad en vivo), pacientes y
  pagos con comprobante descargable.
- **Doctor** — su agenda del día, registro de atenciones y recetas, subida de
  resultados, y mini-panel con sus estadísticas (`/api/reportes/doctor/:id`).
- **Paciente** — sus citas, historial clínico (con receta descargable), resultados
  de exámenes y pagos.

---

## 🔐 Autenticación y sesión

- La sesión se guarda en `localStorage`: `accessToken`, `refreshToken` y `user`.
- `lib/api.js` añade `Authorization: Bearer <accessToken>` a cada petición.
- **Refresh transparente:** si una petición devuelve `401`, el cliente intenta
  renovar el token con el `refreshToken` y reintenta la petición una vez. Si la
  renovación falla, limpia la sesión y redirige a `/login`.
- `ProtectedRoute` bloquea las rutas del portal sin sesión (recordando la ruta de origen).

---

## 🔔 Tiempo real y documentos

- **Notificaciones:** `NotificationsContext` abre un socket autenticado con el token.
  El backend une el cliente a la sala correcta según su rol y emite avisos de citas,
  pagos, resultados e historial. La campana (`NotificationBell`) muestra el contador
  de no leídas y el panel de notificaciones.
- **Recetas y comprobantes:** se generan en el navegador como documentos
  imprimibles/descargables en PDF abriendo una ventana de impresión
  (`lib/receta.js` y `lib/voucher.js`), con formato de receta y de comprobante chilenos.

---

## 🎨 Sistema de diseño

Tema definido con Tailwind v4 vía `@theme` en `index.css`:

- **Tipografía:** Inter (`--font-sans`).
- **Paleta "azul clínico":** `brand-50` … `brand-900` (primario).
- **Acento "verde salud":** `accent-500`, `accent-600`.
- Estilos a medida para el campo de teléfono internacional, integrados al look de la app.

Usa estas escalas con las clases utilitarias de Tailwind, p. ej. `bg-brand-600`,
`text-brand-700`, `ring-brand-100`.

---

## 🧱 Componentes de UI

`components/ui.jsx` expone los primitivos reutilizables del portal:

| Componente | Propósito |
|-----------|-----------|
| `Spinner` | Indicador de carga con etiqueta |
| `PageHeader` | Encabezado de página (título, subtítulo, acciones) |
| `Card` | Contenedor con borde y fondo |
| `Btn` | Botón con variantes `primary` / `ghost` / `danger` |
| `Badge` | Etiqueta de estado con color |
| `Empty` | Estado vacío con icono |
| `ErrorMsg` | Mensaje de error en recuadro |
| `PasswordInput` | Campo de contraseña con mostrar/ocultar |
| `Telefono` | Teléfono internacional (por defecto Chile) |
| `Field` | Campo de formulario con etiqueta y ayuda |
| `Modal` | Diálogo modal con overlay |
| `inputCls` | Clase base reutilizable para inputs/selects/textarea |

---

## 📝 Notas técnicas

- La landing usa contenido curado (`data/clinic.js`) y no expone la API de
  administración; el portal consume los endpoints autenticados del backend.
- Todo el código está comentado con **JSDoc** (componentes, hooks, contextos y libs).
- No se usan librerías de estado externas: la sesión y las notificaciones viven en
  React Context; los datos de cada vista se cargan con `useFetch`.
