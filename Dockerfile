# Imagen mínima para el backend - etapa de compilación
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Imagen mínima para el backend - etapa de ejecución
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node","dist/index.js"]
