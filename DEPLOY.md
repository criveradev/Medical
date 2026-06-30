# Despliegue — Medical

Frontend en **Vercel**, backend en **Render**. Dominio: `criveradev.cl`.

## Backend — Render (`medical-server`)

| Ajuste | Valor |
|---|---|
| Root Directory | `medical-server` |
| Build Command | `npm install` |
| Start Command | `npm start` (ejecuta `node server.js`) |
| Custom domain | `api.medical.criveradev.cl` |

Variables de entorno:

```
NODE_ENV=production
API_URL=https://api.medical.criveradev.cl
CLIENT_URL=https://medical.criveradev.cl
MONGO_URI=<tu cadena de MongoDB Atlas>
JWT_SECRET=<cadena larga y aleatoria>
JWT_REFRESH_SECRET=<otra distinta>
JWT_EXPIRES=8h
CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_API_SECRET=<...>
SENTRY_DSN=<tu DSN de Sentry>
BREVO_API_KEY=<tu API key de Brevo>
EMAIL_FROM=<correo verificado en Brevo>
```

> ⚠️ **Correo en Render free:** el plan gratuito **bloquea SMTP**. Define
> `BREVO_API_KEY` para enviar vía la API HTTP de Brevo (puerto 443). Sin esto,
> no salen correos (recuperación de contraseña, recordatorios, etc.).
>
> Redis es **opcional**: si no defines `REDIS_*`, el sistema degrada a MongoDB.
>
> `CLIENT_URL` admite varios dominios separados por coma; el CORS REST y el de
> Socket.io comparten la misma lógica (`src/config/cors.js`).

## Frontend — Vercel (`medical-client`)

| Ajuste | Valor |
|---|---|
| Root Directory | `medical-client` |
| Framework | Vite |
| Custom domain | `medical.criveradev.cl` |

Variable de entorno:

```
VITE_API_URL=https://api.medical.criveradev.cl
```

> ⚠️ **SIN `/api` al final.** El cliente ya añade `/api` y `/socket.io` en cada
> llamada. Esta misma URL la usa Socket.io para las notificaciones en tiempo
> real. Vite incrusta la variable en el build → cualquier cambio requiere
> **redeploy**.

## DNS (Cloudflare)

Crea los registros de `medical.criveradev.cl` (→ Vercel) y
`api.medical.criveradev.cl` (→ Render) según las instrucciones de cada panel.

## Checklist de orden

1. Desplegar backend en Render con todas las env vars y verificar
   `https://api.medical.criveradev.cl/api/docs` (Swagger) y `/health`.
2. Sembrar roles y admin si aplica: `npm run seed:roles` y `npm run seed:admin`.
3. Poner `VITE_API_URL` en Vercel y desplegar frontend.
4. Añadir custom domains en ambos y crear los DNS en Cloudflare.
5. Probar login, subida de archivos (Cloudinary), correo (Brevo) y
   notificaciones en tiempo real (Socket.io).
