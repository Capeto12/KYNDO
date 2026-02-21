# ✅ Estado del Backend - Respuesta a la Pregunta

## 🎯 Pregunta Original

> "¿Ya está funcionando el backend? ¿Ya puedo ver dónde pongo las bases de datos y las imágenes de las cartas?"

## ✅ Respuesta

**SÍ, el backend ya está completamente funcional y listo para usar.**

### ¿Qué está disponible?

#### ✅ Backend API (100% Funcional)
- ✅ Servidor Express + TypeScript
- ✅ Endpoints públicos y admin
- ✅ Base de datos PostgreSQL
- ✅ Cola de trabajos con Redis
- ✅ Sistema de migraciones Prisma
- ✅ Seed con datos de ejemplo
- ✅ Worker para thumbnails
- ✅ Scripts de utilidades
- ✅ Docker Compose configurado
- ✅ Documentación completa

#### 📍 Ubicaciones Clave

### **Base de Datos**
```
📦 PostgreSQL (Docker Container)
📍 Configuración: backend/.env
📝 Esquema: backend/prisma/schema.prisma
🔧 Iniciar: cd backend && docker compose up -d
```

### **Imágenes de Cartas**
```
📂 Ubicación: content/[pack-name]/img/
📝 Ejemplo: content/birds/img/guacamaya-roja.webp
📋 Metadata: backend/seeds/pack-1.json
```

## 📖 Documentación Completa

### Guías Principales (¡NUEVO! 📌)

1. **[📍 DONDE_PONER_DB_E_IMAGENES.md](./DONDE_PONER_DB_E_IMAGENES.md)**
   - Guía completa en español
   - Explica exactamente dónde colocar bases de datos e imágenes
   - Paso a paso para agregar nuevas cartas
   - Ejemplos prácticos
   - FAQ y troubleshooting

2. **[📊 DIAGRAMA_ESTRUCTURA.md](./DIAGRAMA_ESTRUCTURA.md)**
   - Diagramas visuales de la arquitectura
   - Flujo de datos carta → BD → API → Frontend
   - Estructura de directorios detallada
   - Comparativa de tipos de storage

### Guías Existentes

3. **[backend/COMO_INICIAR.md](./backend/COMO_INICIAR.md)**
   - Cómo iniciar el backend
   - Comandos útiles
   - Endpoints disponibles

4. **[backend/QUICKSTART.md](./backend/QUICKSTART.md)**
   - Quick start en inglés
   - Setup en 5 minutos

5. **[backend/README_BACKEND.md](./backend/README_BACKEND.md)**
   - Documentación técnica completa
   - Deploy a producción

## 🚀 Inicio Rápido (3 pasos)

### 1. Levantar el Backend

```bash
cd backend
./iniciar-backend.sh
```

Este script automáticamente:
- ✅ Verifica Docker
- ✅ Crea `.env` si no existe
- ✅ Instala dependencias npm
- ✅ Inicia PostgreSQL y Redis
- ✅ Ejecuta migraciones
- ✅ Carga datos de ejemplo
- ✅ Inicia el servidor

### 2. Verificar que funciona

Abre en tu navegador:
```
http://localhost:3000/health
http://localhost:3000/api/cards/guacamaya-roja/presentation
```

O usa curl:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/cards/guacamaya-roja/presentation | jq .
```

### 3. Ver los datos

```bash
# Explorar la base de datos visualmente
npx prisma studio
# Se abre en http://localhost:5555

# Ver las imágenes disponibles
ls -lh content/birds/img/
```

## 📂 Estructura de Directorios

```
kyndo/
│
├── 🗄️ BASE DE DATOS (PostgreSQL via Docker)
│   └── backend/
│       ├── docker-compose.yml    ← Define PostgreSQL + Redis
│       ├── .env                  ← DATABASE_URL aquí
│       └── prisma/
│           └── schema.prisma     ← Estructura de tablas
│
├── 🖼️ IMÁGENES DE CARTAS
│   └── content/
│       └── birds/
│           └── img/              ← 📍 COLOCAR IMÁGENES AQUÍ
│               ├── guacamaya-roja.webp
│               ├── condor-andino.webp
│               └── ... (más aves)
│
└── 🚀 BACKEND API
    └── backend/
        ├── src/                  ← Código fuente
        ├── seeds/                ← Datos de ejemplo
        └── uploads/              ← Uploads futuros (crear si no existe)
```

## 🔍 Ejemplos Prácticos

### Ver una carta en la base de datos

```bash
# 1. Abrir Prisma Studio
npx prisma studio

# 2. Navegar a la tabla "cards"
# 3. Ver la carta "guacamaya-roja"
```

### Agregar una nueva carta

```bash
# 1. Colocar imagen
cp mi-nueva-ave.webp content/birds/img/tucan-toco.webp

# 2. Editar backend/seeds/pack-1.json
# Agregar:
{
  "cardId": "tucan-toco",
  "title": "Tucán Toco",
  "imageUrl": "content/birds/img/tucan-toco.webp",
  "rarity": "rare"
}

# 3. Recargar datos
cd backend
npm run seed

# 4. Verificar
curl http://localhost:3000/api/cards/tucan-toco/presentation
```

### Ver los datos cargados

```bash
# Opción 1: Prisma Studio (visual)
npx prisma studio

# Opción 2: Cliente PostgreSQL
psql "postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo?schema=public"

# Opción 3: curl a la API
curl http://localhost:3000/api/cards/guacamaya-roja/presentation | jq .
```

## 🔧 Configuración de la Base de Datos

### Archivos importantes

1. **`backend/.env`** - Variables de entorno
```env
DATABASE_URL="postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
ADMIN_KEY="dev-admin-key-change-in-production"
UPLOADS_DIR="./uploads"
```

2. **`backend/docker-compose.yml`** - Servicios Docker
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

3. **`backend/prisma/schema.prisma`** - Esquema de tablas
```prisma
model Card {
  id            String   @id @default(cuid())
  cardId        String   @unique
  title         String
  imageUrl      String?
  rarity        String
  ...
}
```

## 🎯 Endpoints Disponibles

### Públicos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Estado del servidor |
| `/api/cards/:cardId/presentation` | GET | Obtener carta con reglas de presentación |

### Admin (requieren header `x-admin-key`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/cards/:id` | PATCH | Actualizar carta |
| `/api/admin/queue/stats` | GET | Estadísticas de la cola |

## 💡 Tips Útiles

### Ver logs de PostgreSQL
```bash
docker compose logs postgres
docker compose logs postgres -f  # Seguir en tiempo real
```

### Reiniciar servicios
```bash
docker compose restart
```

### Backup de la base de datos
```bash
./backend/scripts/backup_db.sh kyndo-backup.sql
```

### Explorar imágenes
```bash
# Ver todas las imágenes
find content -name "*.webp" -o -name "*.jpg" -o -name "*.png"

# Ver tamaño de imágenes
du -sh content/birds/img/*
```

## 🐛 Solución de Problemas

### "Port 3000 already in use"
```bash
# Cambiar puerto en backend/.env
PORT=3001
```

### "Cannot connect to database"
```bash
# Verificar servicios Docker
docker compose ps

# Reiniciar PostgreSQL
docker compose restart postgres
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

## 📚 Recursos Adicionales

### Documentación Principal
- [README.md](./README.md) - Visión general del proyecto
- [backend/COMO_INICIAR.md](./backend/COMO_INICIAR.md) - Guía de inicio
- [backend/README_BACKEND.md](./backend/README_BACKEND.md) - Documentación técnica

### Herramientas Recomendadas
- **Prisma Studio** - Explorar la BD visualmente
- **DBeaver** - Cliente PostgreSQL gratuito
- **Postman** - Probar endpoints
- **Docker Desktop** - Gestionar contenedores

## ✅ Checklist de Verificación

```
✅ Docker está instalado y corriendo
✅ docker compose up -d ejecutado exitosamente
✅ PostgreSQL corriendo en puerto 5432
✅ Redis corriendo en puerto 6379
✅ npm install completado
✅ npm run prisma:migrate ejecutado
✅ npm run seed ejecutado
✅ npm run dev corriendo
✅ http://localhost:3000/health devuelve 200 OK
✅ Puedo acceder a http://localhost:3000/api/cards/guacamaya-roja/presentation
✅ Prisma Studio funciona (npx prisma studio)
✅ Veo las imágenes en content/birds/img/
```

## 🎉 ¡Todo Listo!

El backend está completamente funcional y puedes:
- ✅ Ver dónde colocar las bases de datos (PostgreSQL via Docker)
- ✅ Ver dónde colocar las imágenes de cartas (content/birds/img/)
- ✅ Agregar nuevas cartas
- ✅ Explorar los datos
- ✅ Integrar con el frontend
- ✅ Desplegar a producción

---

**¿Más dudas?** Consulta las guías completas o abre un issue en el repositorio.

**¡A desarrollar! 🚀**
