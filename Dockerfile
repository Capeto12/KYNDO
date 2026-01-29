# Imagen mínima para el backend
# Imagen mínima para el backend - etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Imagen final para producción
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 4000
RUN mkdir -p /app/uploads
CMD ["node","dist/index.js"]
