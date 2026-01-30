# 📍 ¿Dónde pongo las Bases de Datos y las Imágenes de las Cartas?

## ✅ Respuesta Rápida

**Sí, el backend ya está funcionando** y listo para usar. Esta guía te explica exactamente dónde se configuran las bases de datos y dónde colocar las imágenes de las cartas.

---

## 🗄️ Base de Datos

### Ubicación: PostgreSQL via Docker

La base de datos **NO se coloca como un archivo** en tu proyecto. En su lugar, corre como un servicio Docker.

#### Configuración actual:

```
📦 Docker Container: postgres:15-alpine
📍 Puerto: localhost:5432
🔑 Usuario: kyndo
🔐 Password: kyndo_dev_password
📊 Nombre BD: kyndo
```

#### Archivos de configuración:

1. **`backend/docker-compose.yml`** - Define el servicio PostgreSQL y Redis
2. **`backend/.env`** - Variables de entorno (crear desde `.env.example`)
3. **`backend/prisma/schema.prisma`** - Esquema de la base de datos

### ¿Cómo funciona?

```bash
# 1. Levantar la base de datos (Docker)
cd backend
docker compose up -d

# 2. Crear las tablas (migraciones automáticas)
npm run prisma:migrate

# 3. Cargar datos de ejemplo
npm run seed
```

### ¿Dónde se guardan los datos?

Los datos de PostgreSQL se guardan en un **volumen Docker persistente** llamado `postgres_data`.

```
Docker Volume: postgres_data
Ubicación física: /var/lib/docker/volumes/backend_postgres_data/
```

Esto significa que:
- ✅ Los datos persisten aunque detengas Docker
- ✅ No necesitas manejar archivos de base de datos manualmente
- ✅ Puedes hacer backups con comandos de Docker

### Acceso a la Base de Datos

#### Opción 1: Prisma Studio (Visual)
```bash
cd backend
npx prisma studio
# Abre http://localhost:5555
```

#### Opción 2: Cliente PostgreSQL
```bash
psql "postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo?schema=public"
```

#### Opción 3: Herramientas GUI
- **DBeaver** (gratis, multiplataforma)
- **pgAdmin** (oficial de PostgreSQL)
- **TablePlus** (macOS/Windows)

Configura la conexión con:
```
Host: localhost
Port: 5432
Database: kyndo
User: kyndo
Password: kyndo_dev_password
Schema: public
```

---

## 🖼️ Imágenes de las Cartas

### Ubicación Principal: `/content/`

Las imágenes de las cartas se colocan en la carpeta `content/` en la raíz del proyecto.

#### Estructura recomendada:

```
kyndo/
├── content/
│   ├── birds/                     # Pack de aves
│   │   ├── img/                   # Imágenes de las cartas
│   │   │   ├── guacamaya-roja.webp
│   │   │   ├── condor-andino.webp
│   │   │   ├── colibri.webp
│   │   │   ├── tucan.webp
│   │   │   ├── buho.webp
│   │   │   └── ... (más aves)
│   │   └── pack-1.json            # Datos del pack
│   │
│   └── [futuros-packs]/          # Otros dominios
│       └── img/
│
├── backend/
│   └── uploads/                   # Imágenes subidas por admin (futuro)
│       └── thumbnails/            # Miniaturas generadas
```

### Tipos de Imágenes

#### 1. **Imágenes de Contenido** (Content Images)
- **Ubicación**: `/content/[pack-name]/img/`
- **Formato recomendado**: WebP (mejor compresión)
- **Resolución**: 1024x1024px o superior
- **Uso**: Cartas del juego, versión para producción

**Ejemplo**:
```
content/birds/img/guacamaya-roja.webp
```

#### 2. **Imágenes Subidas** (Uploads - Futuro)
- **Ubicación**: `/backend/uploads/`
- **Formato**: Cualquier formato (se convierte automáticamente)
- **Uso**: Subidas por administradores vía API

**Ejemplo**:
```
backend/uploads/custom-bird-123.jpg
```

#### 3. **Miniaturas** (Thumbnails - Generadas automáticamente)
- **Ubicación**: `/backend/uploads/thumbnails/`
- **Formato**: WebP optimizado
- **Resolución**: 320x320px
- **Uso**: Vistas previas rápidas, listados

**Ejemplo**:
```
backend/uploads/thumbnails/guacamaya-roja-thumb.webp
```

### Rutas en la Base de Datos

En la tabla `cards`, las imágenes se referencian así:

```typescript
{
  cardId: "guacamaya-roja",
  title: "Guacamaya Roja",
  imageUrl: "content/birds/img/guacamaya-roja.webp",  // ← Ruta relativa
  thumbnailPath: null  // Se genera automáticamente si usas el worker
}
```

**Importante**: Las rutas son **relativas a la raíz del proyecto**.

---

## 📂 Estructura Completa del Proyecto

```
kyndo/
├── content/                        # 🖼️ IMÁGENES DE CARTAS AQUÍ
│   └── birds/
│       ├── img/
│       │   ├── guacamaya-roja.webp
│       │   └── ... (más imágenes)
│       └── pack-1.json
│
├── backend/                        # 🚀 BACKEND API
│   ├── .env                        # ⚙️ Configuración (DATABASE_URL, etc.)
│   ├── docker-compose.yml          # 🐳 PostgreSQL + Redis
│   ├── prisma/
│   │   ├── schema.prisma           # 📊 Esquema de tablas
│   │   └── migrations/             # 📝 Historial de cambios
│   ├── seeds/
│   │   ├── pack-1.json             # 📦 Datos de ejemplo
│   │   └── seed_dev.ts             # 🌱 Script de carga
│   ├── uploads/                    # 📤 Uploads futuros (crear si no existe)
│   │   └── thumbnails/             # 🖼️ Miniaturas generadas
│   └── src/                        # 💻 Código fuente
│
├── frontend/                       # 🎮 Interfaz del juego
│   └── memory/
│       └── index.html              # Juego Memory
│
└── docs/                           # 📖 Documentación
```

---

## 🚀 Guía Paso a Paso: Agregar una Nueva Carta

### 1. Preparar la Imagen

```bash
# Coloca tu imagen en content
cp mi-nueva-ave.jpg content/birds/img/tucan-toco.webp

# O convierte a WebP (mejor compresión)
cwebp -q 90 mi-nueva-ave.jpg -o content/birds/img/tucan-toco.webp
```

**Recomendaciones**:
- Usa WebP para mejor rendimiento
- Resolución mínima: 512x512px
- Resolución recomendada: 1024x1024px
- Mantén proporciones cuadradas (1:1)

### 2. Agregar datos a `pack-1.json`

Edita `content/birds/pack-1.json` o `backend/seeds/pack-1.json`:

```json
{
  "id": "birds",
  "name": "Pack de Aves",
  "cards": [
    {
      "cardId": "tucan-toco",
      "title": "Tucán Toco",
      "description": "El tucán más grande de Sudamérica",
      "imageUrl": "content/birds/img/tucan-toco.webp",
      "rarity": "rare",
      "packId": "birds",
      "metadata": {
        "scientificName": "Ramphastos toco",
        "habitat": "Bosques tropicales",
        "diet": "Omnívoro"
      }
    }
  ]
}
```

**Importante**: Verifica que el JSON sea válido antes de continuar:
```bash
# Validar JSON
cat backend/seeds/pack-1.json | jq . > /dev/null && echo "✅ JSON válido" || echo "❌ JSON inválido"
```

### 3. Recargar la base de datos

```bash
cd backend
npm run seed
```

Esto insertará la nueva carta en PostgreSQL.

### 4. Verificar

```bash
# Con curl (todas las plataformas)
curl http://localhost:3000/api/cards/tucan-toco/presentation | jq .

# O abrir en el navegador (macOS)
open http://localhost:3000/api/cards/tucan-toco/presentation

# O abrir en el navegador (Linux)
xdg-open http://localhost:3000/api/cards/tucan-toco/presentation

# O abrir en el navegador (Windows)
start http://localhost:3000/api/cards/tucan-toco/presentation
```

---

## 🔧 Configuración Avanzada

### Cambiar la ubicación de uploads

Edita `backend/.env`:

```env
# Ubicación actual (por defecto)
UPLOADS_DIR="./uploads"
THUMBNAILS_DIR="./uploads/thumbnails"

# Ubicación personalizada
UPLOADS_DIR="/home/usuario/kyndo-assets"
THUMBNAILS_DIR="/home/usuario/kyndo-assets/thumbnails"
```

### Usar un servicio externo (S3, Cloudinary, etc.)

El backend está preparado para futuras integraciones con:
- Amazon S3
- Google Cloud Storage
- Cloudinary
- Imgix

Actualmente usa el sistema de archivos local, pero el código está estructurado para migrar fácilmente.

---

## 🌐 URLs de Producción

En producción, las imágenes se sirven así:

### Desarrollo Local
```
http://localhost:3000/uploads/guacamaya-roja.webp
```

### Producción (con CDN)
```
https://cdn.kyndo.app/content/birds/img/guacamaya-roja.webp
```

Configura el CDN en `backend/.env`:
```env
CDN_URL="https://cdn.kyndo.app"
```

---

## 📊 Resumen de Tablas en la Base de Datos

### Tabla `cards`
Almacena información de cada carta:
- `id` (UUID) - ID interno
- `cardId` (string) - ID legible (ej: "guacamaya-roja")
- `title` (string) - Nombre de la carta
- `description` (string) - Descripción
- `imageUrl` (string) - Ruta a la imagen
- `thumbnailPath` (string) - Ruta a la miniatura
- `rarity` (string) - Rareza (common, rare, epic, legendary)
- `packId` (string) - Pack al que pertenece

### Tabla `presentation_rules`
Define estilos por rareza:
- `rarity` (string) - Nivel de rareza
- `frameColor` (string) - Color del marco (#hex)
- `glowEffect` (boolean) - Si tiene brillo
- `badgeIcon` (string) - Icono de insignia

### Tabla `assets`
Registra archivos subidos:
- `assetKey` (string) - Identificador único
- `assetType` (string) - Tipo (thumbnail, image, icon)
- `filePath` (string) - Ruta del archivo
- `fileSize` (int) - Tamaño en bytes

### Tabla `audit_logs`
Auditoría de cambios:
- `action` (string) - Acción realizada
- `performedBy` (string) - Quién lo hizo
- `changes` (JSON) - Detalles del cambio

---

## 🛠️ Comandos Útiles

### Base de Datos

```bash
# Iniciar PostgreSQL
cd backend && docker compose up -d postgres

# Ver estado
docker compose ps

# Explorar visualmente
npx prisma studio

# Hacer backup
./scripts/backup_db.sh kyndo-backup-$(date +%Y%m%d).sql

# Exportar a JSON
npm run export:json -- --output ./migration-data
```

### Imágenes

```bash
# Ver imágenes disponibles
ls -lh content/birds/img/

# Verificar tamaño de imágenes
du -sh content/birds/img/*

# Convertir JPG a WebP (requiere cwebp)
shopt -s nullglob  # Evita errores si no hay archivos .jpg
for img in content/birds/img/*.jpg; do
  [ -f "$img" ] || continue
  cwebp -q 90 "$img" -o "${img%.jpg}.webp"
done

# Generar miniaturas manualmente (requiere ImageMagick)
convert content/birds/img/guacamaya-roja.webp \
  -resize 320x320 \
  backend/uploads/thumbnails/guacamaya-roja-thumb.webp
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar SQLite en lugar de PostgreSQL?

No recomendado para producción, pero posible para desarrollo:

```env
# En backend/.env
DATABASE_URL="file:./dev.db"
```

Luego ejecuta migraciones normalmente.

### ¿Dónde están los datos después de hacer `npm run seed`?

Los datos están en el volumen Docker `postgres_data`. Para verlos:

```bash
npx prisma studio
# O
psql "postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo?schema=public"
\dt  -- Listar tablas
SELECT * FROM cards;
```

### ¿Cómo limpio la base de datos y empiezo de cero?

```bash
cd backend

# Opción 1: Reset con Prisma (desarrollo)
npx prisma migrate reset

# Opción 2: Destruir volumen Docker (más radical)
docker compose down -v
docker compose up -d
npm run prisma:migrate
npm run seed
```

### ¿Las imágenes se suben a la base de datos?

**No**. La base de datos solo guarda **rutas** (strings) a las imágenes. Las imágenes están en el sistema de archivos.

```
Base de datos:  "content/birds/img/guacamaya-roja.webp"
Archivo real:   /home/runner/work/KYNDO/KYNDO/content/birds/img/guacamaya-roja.webp
```

### ¿Puedo tener múltiples packs de cartas?

Sí, crea más carpetas:

```
content/
├── birds/
│   └── img/
├── wildlife/
│   └── img/
├── transport/
│   └── img/
└── countries/
    └── img/
```

Y actualiza `packId` en los datos de cada carta.

---

## 🔗 Documentación Relacionada

- [COMO_INICIAR.md](backend/COMO_INICIAR.md) - Guía completa de inicio
- [QUICKSTART.md](backend/QUICKSTART.md) - Inicio rápido
- [README_BACKEND.md](backend/README_BACKEND.md) - Documentación técnica
- [README.md](README.md) - Visión general del proyecto

---

## 📝 Resumen Visual

```
┌─────────────────────────────────────────────────┐
│  📦 BASES DE DATOS                              │
├─────────────────────────────────────────────────┤
│  ✅ PostgreSQL (Docker)                         │
│     • Puerto: 5432                              │
│     • Usuario: kyndo                            │
│     • Password: kyndo_dev_password              │
│     • Database: kyndo                           │
│                                                 │
│  📍 Archivos de configuración:                  │
│     • backend/docker-compose.yml                │
│     • backend/.env                              │
│     • backend/prisma/schema.prisma              │
│                                                 │
│  🔧 Comandos:                                   │
│     docker compose up -d      → Iniciar         │
│     npm run prisma:migrate    → Crear tablas    │
│     npm run seed              → Cargar datos    │
│     npx prisma studio         → Ver datos       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🖼️ IMÁGENES DE CARTAS                          │
├─────────────────────────────────────────────────┤
│  📂 Ubicación principal:                        │
│     content/[pack-name]/img/                    │
│                                                 │
│  📝 Ejemplo:                                    │
│     content/birds/img/guacamaya-roja.webp       │
│     content/birds/img/condor-andino.webp        │
│                                                 │
│  ⚙️ Formato recomendado:                        │
│     • WebP (mejor compresión)                   │
│     • 1024x1024px (cuadradas)                   │
│     • Nombres: minúsculas-con-guiones           │
│                                                 │
│  📍 Referencia en BD:                           │
│     imageUrl: "content/birds/img/ave.webp"      │
└─────────────────────────────────────────────────┘
```

---

**¿Más preguntas?** Abre un issue en el repositorio o revisa la documentación completa.

**¡A jugar! 🎮**
