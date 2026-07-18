# ═══════════════════════════════════════════════════════════════
# Dockerfile — Imagen del backend
# Sistema de citas médicas — MEAN Stack
# ═══════════════════════════════════════════════════════════════

# Usar imagen oficial de Node.js LTS
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear carpetas necesarias
RUN mkdir -p logs uploads/resultados

# Exponer puerto
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]