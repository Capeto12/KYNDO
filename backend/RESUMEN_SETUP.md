# 🎮 KYNDO Backend - Resumen de Configuración

## ✅ Estado: Backend Completamente Funcional

El backend de KYNDO ha sido configurado exitosamente y está corriendo en tu entorno.

## 🚀 Qué se ha configurado

### 1. Base de Datos PostgreSQL
- ✅ Contenedor Docker corriendo en puerto 5432
- ✅ Base de datos `kyndo` creada
- ✅ Esquema de tablas migrado (cards, presentation_rules, audit_logs, etc.)
- ✅ 5 cartas de ejemplo cargadas:
  - Guacamaya Roja (común)
  - Cóndor Andino (raro)
  - Colibrí (común)
  - Tucán (épico)
  - Búho (raro)

### 2. Redis
- ✅ Contenedor Docker corriendo en puerto 6379
- ✅ Listo para cola de trabajos en segundo plano

### 3. API REST
- ✅ Servidor Express corriendo en puerto 3000
- ✅ TypeScript con auto-reload (ts-node-dev)
- ✅ Todos los endpoints funcionando

### 4. Documentación y Scripts
- ✅ Script automatizado de inicio (`iniciar-backend.sh`)
- ✅ Guía completa en español (`COMO_INICIAR.md`)
- ✅ Guía rápida en inglés (`BACKEND_START.md`)

## 📍 URLs Disponibles

### Endpoints Públicos
```
http://localhost:3000/health
http://localhost:3000/api/cards/guacamaya-roja/presentation
http://localhost:3000/api/cards/condor-andino/presentation
http://localhost:3000/api/cards/colibri/presentation
http://localhost:3000/api/cards/tucan/presentation
http://localhost:3000/api/cards/buho/presentation
```

### Endpoints Admin
Requieren header `x-admin-key: dev-admin-key-change-in-production`

```
PATCH http://localhost:3000/api/admin/cards/:id
GET http://localhost:3000/api/admin/queue/stats
```

## 🔧 Cómo usar el backend

### Opción 1: Script Automático (Recomendado)

La forma más fácil es usar el script de inicio:

```bash
cd backend
./iniciar-backend.sh
```

Este script verificará todo automáticamente y levantará el backend completo.

### Opción 2: Manual

Si quieres más control:

```bash
cd backend

# Iniciar servicios Docker
docker compose up -d

# Esperar 10 segundos para que PostgreSQL esté listo
sleep 10

# Iniciar el servidor
npm run dev
```

### Para detener el backend:

```bash
# 1. Presiona Ctrl+C en la terminal del servidor
# 2. Detén los servicios Docker:
docker compose down
```

## 🧪 Prueba del Backend

### Test básico con curl:

```bash
# Health check
curl http://localhost:3000/health

# Obtener una carta
curl http://localhost:3000/api/cards/guacamaya-roja/presentation

# Con formato (requiere jq)
curl http://localhost:3000/api/cards/guacamaya-roja/presentation | jq .
```

### Test en el navegador:

Abre estas URLs en tu navegador:
- http://localhost:3000/health
- http://localhost:3000/api/cards/guacamaya-roja/presentation

## 📦 Estructura de la Base de Datos

### Tabla: cards
Contiene toda la información de las cartas del juego.

Campos principales:
- `id`: ID único (UUID)
- `cardId`: Identificador legible (ej: "guacamaya-roja")
- `title`: Nombre de la carta
- `description`: Descripción
- `imageUrl`: Ruta a la imagen
- `rarity`: Rareza (common, rare, epic, legendary)
- `packId`: Pack al que pertenece

### Tabla: presentation_rules
Define cómo se presenta cada rareza en el UI.

Campos:
- `rarity`: Nivel de rareza
- `frameColor`: Color del marco
- `glowEffect`: Si tiene efecto de brillo
- `badgeIcon`: Icono de la insignia
- `sortOrder`: Orden de clasificación

### Tabla: audit_logs
Registra todos los cambios en el sistema.

## 🔑 Seguridad

### Clave Admin (Desarrollo)
```
Header: x-admin-key
Value: dev-admin-key-change-in-production
```

⚠️ **IMPORTANTE**: Esta clave es solo para desarrollo local. Antes de desplegar a producción:

1. Genera una clave segura:
   ```bash
   openssl rand -base64 32
   ```

2. Actualiza el `.env`:
   ```env
   ADMIN_KEY="tu-clave-super-segura-aquí"
   ```

3. Implementa autenticación real (JWT, OAuth, etc.)

## 🛠️ Comandos Útiles

### Ver logs de los servicios:
```bash
docker compose logs postgres
docker compose logs redis
docker compose logs -f  # Seguir logs en tiempo real
```

### Explorar la base de datos visualmente:
```bash
npx prisma studio
# Abre http://localhost:5555
```

### Reiniciar servicios Docker:
```bash
docker compose restart
```

### Ver estado de servicios:
```bash
docker compose ps
```

### Ejecutar migraciones manualmente:
```bash
npm run prisma:migrate
```

### Recargar datos de ejemplo:
```bash
npm run seed
```

## 📁 Archivos Importantes

### Configuración
- `backend/.env` - Variables de entorno (NO versionar)
- `backend/.env.example` - Plantilla de configuración
- `backend/docker-compose.yml` - Definición de servicios Docker

### Base de Datos
- `backend/prisma/schema.prisma` - Esquema de la base de datos
- `backend/prisma/migrations/` - Historial de migraciones
- `backend/seeds/seed_dev.ts` - Datos de ejemplo

### Código
- `backend/src/index.ts` - Entry point del servidor
- `backend/src/routes/` - Definición de endpoints
- `backend/src/worker/` - Worker para tareas en segundo plano

## 🚀 Próximos Pasos

1. **Conectar el Frontend**
   - El frontend puede hacer peticiones a `http://localhost:3000/api`
   - Ver documentación en `/frontend` para integración

2. **Agregar más cartas**
   - Editar `backend/seeds/seed_dev.ts`
   - Ejecutar `npm run seed`

3. **Personalizar reglas de presentación**
   - Usar Prisma Studio o endpoints admin
   - Actualizar colores, efectos, etc.

4. **Implementar Worker**
   - En otra terminal: `npm run worker`
   - Para procesamiento de thumbnails y tareas asíncronas

5. **Deploy a Producción**
   - Ver [README_BACKEND.md](./README_BACKEND.md) para Railway, Heroku, etc.

## ❓ Solución de Problemas

### "Port 3000 already in use"
```bash
# Cambiar puerto en .env
PORT=3001
```

### "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps

# Ver logs
docker compose logs postgres

# Reiniciar
docker compose restart postgres
```

### "Prisma Client not found"
```bash
npm run prisma:generate
```

### Quiero empezar de cero
```bash
# Detener todo
docker compose down

# Eliminar volúmenes (CUIDADO: esto borra la base de datos)
docker compose down -v

# Volver a iniciar
./iniciar-backend.sh
```

## 📚 Documentación Completa

- [COMO_INICIAR.md](./COMO_INICIAR.md) - Guía completa en español
- [README_BACKEND.md](./README_BACKEND.md) - Documentación técnica
- [QUICKSTART.md](./QUICKSTART.md) - Inicio rápido
- [README_MIGRATIONS.md](./README_MIGRATIONS.md) - Flujo de migraciones

## 💡 Tips

- Usa `npx prisma studio` para explorar datos visualmente
- Los logs del worker son útiles para debugging de thumbnails
- Puedes usar Postman o Insomnia para probar endpoints
- El archivo `.env` nunca se versionará (está en .gitignore)

## ✨ Resumen

¡El backend está listo! Puedes:

1. ✅ Levantar el backend con `./iniciar-backend.sh`
2. ✅ Acceder a la API en `http://localhost:3000`
3. ✅ Explorar datos en `http://localhost:5555` (Prisma Studio)
4. ✅ Integrar con el frontend
5. ✅ Desplegar a producción cuando estés listo

---

**¿Necesitas ayuda?** Revisa la documentación o abre un issue en el repositorio.

**¡Feliz desarrollo! 🎮**
