# Imagen mínima para el backend
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
RUN npm run build
EXPOSE 4000
CMD ["node","dist/index.js"]
