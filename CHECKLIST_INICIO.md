# ✅ Checklist Rápido: Iniciar KYNDO Backend

## 🎯 Objetivo
Levantar el backend de KYNDO y verificar que la base de datos y las imágenes están configuradas correctamente.

---

## 📋 Pre-requisitos

Asegúrate de tener instalado:

- [ ] Node.js >= 18.0.0
  ```bash
  node --version
  ```

- [ ] npm >= 9.0.0
  ```bash
  npm --version
  ```

- [ ] Docker Desktop
  ```bash
  docker --version
  ```

---

## 🚀 Pasos de Inicio

### 1. Clonar el Repositorio (si no lo has hecho)
```bash
git clone https://github.com/Capeto12/KYNDO.git
cd KYNDO
```

### 2. Iniciar el Backend (Método Automático)
```bash
cd backend
./iniciar-backend.sh
```

**Este script hace todo automáticamente:**
- ✅ Verifica Docker
- ✅ Crea `.env` desde `.env.example`
- ✅ Instala dependencias npm
- ✅ Inicia PostgreSQL y Redis (Docker)
- ✅ Ejecuta migraciones de base de datos
- ✅ Carga datos de ejemplo
- ✅ Inicia el servidor en http://localhost:3000

### 3. Verificar que Funciona

#### ✅ Checkpoint 1: Health Check
```bash
curl http://localhost:3000/health
```
**Debe devolver:** `{"status":"ok"}`

#### ✅ Checkpoint 2: API de Cartas
```bash
curl http://localhost:3000/api/cards/guacamaya-roja/presentation
```
**Debe devolver:** JSON con los datos de la carta

#### ✅ Checkpoint 3: Prisma Studio
```bash
npx prisma studio
```
**Debe abrir:** http://localhost:5555
**Debes ver:** Tablas `cards`, `presentation_rules`, `assets`, `audit_logs`

#### ✅ Checkpoint 4: Verificar Imágenes
```bash
ls -lh content/birds/img/
```
**Debes ver:** Archivos `.webp` de las cartas

---

## 📂 ¿Dónde están las cosas?

### 🗄️ Base de Datos

| ¿Qué? | ¿Dónde? |
|-------|---------|
| **Servicio** | Docker container (PostgreSQL) |
| **Puerto** | localhost:5432 |
| **Usuario** | kyndo |
| **Password** | kyndo_dev_password |
| **Nombre BD** | kyndo |
| **Config** | `backend/.env` |
| **Esquema** | `backend/prisma/schema.prisma` |
| **Explorar** | `npx prisma studio` |

### 🖼️ Imágenes de Cartas

| ¿Qué? | ¿Dónde? |
|-------|---------|
| **Imágenes principales** | `content/birds/img/*.webp` |
| **Metadata** | `backend/seeds/pack-1.json` |
| **Uploads futuros** | `backend/uploads/` (crear si no existe) |
| **Thumbnails** | `backend/uploads/thumbnails/` |

---

## 🔧 Comandos Útiles

### Base de Datos

```bash
# Ver servicios Docker
docker compose ps

# Ver logs de PostgreSQL
docker compose logs postgres

# Explorar datos visualmente
npx prisma studio

# Recargar datos de ejemplo
npm run seed

# Backup de BD
./scripts/backup_db.sh
```

### Backend API

```bash
# Iniciar servidor (desarrollo)
npm run dev

# Iniciar worker (procesamiento de thumbnails)
npm run worker

# Ver todas las cartas
curl http://localhost:3000/api/cards

# Ver una carta específica
curl http://localhost:3000/api/cards/guacamaya-roja/presentation
```

### Imágenes

```bash
# Listar imágenes disponibles
ls -lh content/birds/img/

# Ver tamaño total
du -sh content/birds/img/

# Buscar imágenes en todo el proyecto
find . -name "*.webp" -o -name "*.jpg" -o -name "*.png" | grep -v node_modules
```

---

## ➕ Agregar una Nueva Carta (Ejemplo Completo)

### Paso 1: Preparar la Imagen

```bash
# Coloca tu imagen (recomendado: WebP 1024x1024)
cp /ruta/a/mi-imagen.jpg content/birds/img/aguila-real.webp

# O convierte a WebP (si tienes cwebp)
cwebp -q 90 mi-imagen.jpg -o content/birds/img/aguila-real.webp
```

### Paso 2: Agregar Metadata

Edita `backend/seeds/pack-1.json` y agrega:

```json
{
  "cardId": "aguila-real",
  "title": "Águila Real",
  "description": "Ave rapaz majestuosa de Norteamérica",
  "imageUrl": "content/birds/img/aguila-real.webp",
  "rarity": "epic",
  "packId": "birds",
  "metadata": {
    "scientificName": "Aquila chrysaetos",
    "habitat": "Montañas",
    "diet": "Carnívoro"
  }
}
```

### Paso 3: Recargar Base de Datos

```bash
cd backend
npm run seed
```

### Paso 4: Verificar

```bash
# Ver en la API
curl http://localhost:3000/api/cards/aguila-real/presentation | jq .

# Ver en Prisma Studio
npx prisma studio
# Navega a tabla "cards" y busca "aguila-real"
```

---

## 🐛 Solución de Problemas

### Problema 1: "Port 3000 already in use"

**Solución:**
```bash
# Editar backend/.env y cambiar:
PORT=3001
```

### Problema 2: "Cannot connect to database"

**Solución:**
```bash
# Verificar Docker
docker compose ps

# Si no está corriendo:
docker compose up -d

# Esperar 10 segundos
sleep 10

# Verificar de nuevo
docker compose ps
```

### Problema 3: "Prisma Client not found"

**Solución:**
```bash
cd backend
npm run prisma:generate
```

### Problema 4: Docker no inicia

**Solución:**
- **Windows/Mac:** Abre Docker Desktop
- **Linux:**
  ```bash
  sudo systemctl start docker
  sudo systemctl enable docker
  ```

### Problema 5: ".env not found"

**Solución:**
```bash
cd backend
cp .env.example .env
```

---

## 📚 Documentación Completa

¿Necesitas más detalles? Lee:

| Documento | Para qué sirve |
|-----------|----------------|
| [BACKEND_FUNCIONANDO.md](BACKEND_FUNCIONANDO.md) | Respuesta directa a "¿ya funciona?" |
| [DONDE_PONER_DB_E_IMAGENES.md](DONDE_PONER_DB_E_IMAGENES.md) | Guía completa con ejemplos |
| [DIAGRAMA_ESTRUCTURA.md](DIAGRAMA_ESTRUCTURA.md) | Diagramas visuales |
| [backend/COMO_INICIAR.md](backend/COMO_INICIAR.md) | Inicio paso a paso |
| [backend/README_BACKEND.md](backend/README_BACKEND.md) | Documentación técnica |

---

## ✅ Checklist Final

Antes de cerrar, verifica:

- [ ] `curl http://localhost:3000/health` devuelve `{"status":"ok"}`
- [ ] `curl http://localhost:3000/api/cards/guacamaya-roja/presentation` devuelve JSON
- [ ] `npx prisma studio` abre y muestra tablas con datos
- [ ] `docker compose ps` muestra postgres y redis como "healthy"
- [ ] `ls content/birds/img/` muestra archivos .webp
- [ ] El frontend puede conectarse a la API (si aplica)

---

## 🎉 ¡Listo para Desarrollar!

Si todos los checkpoints pasan, tu entorno está completamente configurado y puedes:

✅ Desarrollar nuevas features  
✅ Agregar más cartas  
✅ Integrar con el frontend  
✅ Desplegar a producción  

**¡A codear! 🚀**

---

**¿Problemas?** Abre un issue en GitHub o consulta la documentación completa.
