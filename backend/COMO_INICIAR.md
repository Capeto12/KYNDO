# 🚀 Cómo Iniciar el Backend de KYNDO

## Inicio Rápido (Recomendado)

La forma más fácil de iniciar el backend es usar el script automático:

```bash
cd backend
./iniciar-backend.sh
```

Este script hará **automáticamente**:
- ✅ Verificar Docker
- ✅ Crear archivo `.env` si no existe
- ✅ Instalar dependencias npm
- ✅ Iniciar PostgreSQL y Redis
- ✅ Configurar la base de datos
- ✅ Cargar datos de ejemplo
- ✅ Iniciar el servidor API

## URLs Importantes

Una vez iniciado el backend:

- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api
- **Ejemplo de carta**: http://localhost:3000/api/cards/guacamaya-roja/presentation

## Detener el Backend

Para detener el servidor:

1. Presiona `Ctrl+C` en la terminal donde corre el servidor
2. Detén los servicios Docker:
   ```bash
   docker compose down
   ```

## Iniciar Worker (Opcional)

Para procesar tareas en segundo plano (regeneración de thumbnails):

```bash
# En otra terminal
cd backend
npm run worker
```

## Endpoints Disponibles

### Públicos

```bash
# Verificar estado del servidor
curl http://localhost:3000/health

# Obtener una carta con reglas de presentación
curl http://localhost:3000/api/cards/guacamaya-roja/presentation
```

### Admin (requiere autenticación)

Para usar endpoints admin, incluye el header `x-admin-key`:

```bash
# Actualizar una carta
curl -X PATCH http://localhost:3000/api/admin/cards/CARD_ID \
  -H "x-admin-key: dev-admin-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"rarity": "epic"}'

# Ver estadísticas de la cola
curl http://localhost:3000/api/admin/queue/stats \
  -H "x-admin-key: dev-admin-key-change-in-production"
```

## Configuración

El archivo `.env` contiene la configuración. Valores por defecto para desarrollo local:

```env
DATABASE_URL="postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
ADMIN_KEY="dev-admin-key-change-in-production"
```

⚠️ **IMPORTANTE**: Cambia `ADMIN_KEY` antes de desplegar a producción.

## Inicio Manual (Paso a Paso)

Si prefieres ejecutar cada paso manualmente:

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Entorno
```bash
cp .env.example .env
# Editar .env si es necesario
```

### 3. Iniciar Servicios Docker
```bash
docker compose up -d
```

### 4. Configurar Base de Datos
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 5. Iniciar Servidor
```bash
npm run dev
```

## Comandos Útiles

```bash
# Ver estado de servicios Docker
docker compose ps

# Ver logs de PostgreSQL
docker compose logs postgres

# Ver logs de Redis
docker compose logs redis

# Reiniciar servicios
docker compose restart

# Explorar base de datos visualmente
npx prisma studio

# Exportar base de datos a JSON
npm run export:json

# Backup de base de datos
./scripts/backup_db.sh
```

## Problemas Comunes

### "Port 3000 already in use"
```bash
# Cambiar puerto en .env
PORT=3001
```

### "Cannot connect to database"
```bash
# Verificar servicios Docker
docker compose ps

# Reiniciar servicios
docker compose restart
```

### "Prisma Client not found"
```bash
npm run prisma:generate
```

### Docker no está corriendo
```bash
# Iniciar Docker Desktop (Windows/Mac)
# O en Linux:
sudo systemctl start docker
```

## Arquitectura

El backend incluye:

- **API REST** (Express + TypeScript)
- **Base de datos** (PostgreSQL con Prisma ORM)
- **Cola de trabajos** (Bull + Redis)
- **Worker** (procesamiento de thumbnails)

## Documentación Adicional

- [README_BACKEND.md](./README_BACKEND.md) - Documentación técnica completa
- [README_MIGRATIONS.md](./README_MIGRATIONS.md) - Flujo de migraciones
- [QUICKSTART.md](./QUICKSTART.md) - Guía rápida en inglés

## Deploy a Producción

Ver [README_BACKEND.md](./README_BACKEND.md) para instrucciones de deploy a:
- Railway
- Heroku
- DigitalOcean
- Otros servicios cloud

---

**¿Necesitas ayuda?** Abre un issue en el repositorio.
