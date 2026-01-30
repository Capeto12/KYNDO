# 📊 Diagrama de Estructura: Bases de Datos e Imágenes

## 🏗️ Vista General del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                    KYNDO - Arquitectura                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   🎮 Frontend   │ ───> │  🚀 Backend API │ ───> │ 🗄️ PostgreSQL   │
│   (HTML/JS)     │      │  (Express/TS)   │      │  (Docker)       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                         │
         │                        │                         │
         └────────────────────────┴─────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  🖼️ Sistema de Archivos  │
                    │  (content/ + uploads/)   │
                    └──────────────────────────┘
```

---

## 📂 Estructura de Directorios Detallada

```
kyndo/
│
├── 🗄️ BASE DE DATOS (PostgreSQL via Docker)
│   └── backend/
│       ├── docker-compose.yml          ← Define PostgreSQL + Redis
│       ├── .env                        ← DATABASE_URL aquí
│       └── prisma/
│           ├── schema.prisma           ← Estructura de tablas
│           └── migrations/             ← Historial de cambios
│
├── 🖼️ IMÁGENES DE CARTAS (Contenido del juego)
│   └── content/
│       └── birds/                      ← Pack de aves
│           ├── img/                    ← 📍 IMÁGENES AQUÍ
│           │   ├── guacamaya-roja.webp
│           │   ├── condor-andino.webp
│           │   ├── colibri.webp
│           │   ├── tucan.webp
│           │   └── ... (más aves)
│           └── pack-1.json             ← Metadata de las cartas
│
├── 📤 UPLOADS (Imágenes subidas por admin - futuro)
│   └── backend/
│       └── uploads/
│           ├── [imagen-subida-1].jpg
│           ├── [imagen-subida-2].png
│           └── thumbnails/             ← Miniaturas generadas
│               ├── [mini-1].webp
│               └── [mini-2].webp
│
├── 🚀 BACKEND API
│   └── backend/
│       ├── src/
│       │   ├── index.ts                ← Servidor Express
│       │   ├── routes/                 ← Endpoints API
│       │   └── worker/                 ← Procesamiento de imágenes
│       └── seeds/
│           ├── pack-1.json             ← Datos de ejemplo
│           └── seed_dev.ts             ← Script de carga
│
└── 🎮 FRONTEND
    └── frontend/
        └── memory/
            └── index.html              ← Juego Memory
```

---

## 🔄 Flujo de Datos: Carta → Base de Datos → API → Frontend

```
PASO 1: Agregar Imagen
─────────────────────────
📁 content/birds/img/
    └── nueva-ave.webp    ← Colocas tu imagen aquí

PASO 2: Definir Metadata
─────────────────────────
📝 backend/seeds/pack-1.json
    {
      "cardId": "nueva-ave",
      "title": "Nueva Ave",
      "imageUrl": "content/birds/img/nueva-ave.webp",  ← Referencia
      "rarity": "rare"
    }

PASO 3: Cargar a la Base de Datos
─────────────────────────────────
💻 Terminal:
    cd backend
    npm run seed    ← Inserta en PostgreSQL

PASO 4: Verificar en la BD
─────────────────────────────
🗄️ PostgreSQL (Docker):
    Tabla: cards
    ┌─────────┬────────────┬────────────────────────────────────┐
    │ cardId  │ title      │ imageUrl                           │
    ├─────────┼────────────┼────────────────────────────────────┤
    │nueva-ave│ Nueva Ave  │content/birds/img/nueva-ave.webp    │
    └─────────┴────────────┴────────────────────────────────────┘

PASO 5: Acceder vía API
─────────────────────────────
🌐 GET /api/cards/nueva-ave/presentation
    {
      "card": {
        "cardId": "nueva-ave",
        "title": "Nueva Ave",
        "imageUrl": "content/birds/img/nueva-ave.webp",
        "rarity": "rare"
      },
      "presentation": {
        "frameColor": "#4169E1",
        "glowEffect": true
      }
    }

PASO 6: Mostrar en el Frontend
─────────────────────────────
🎮 Frontend (JavaScript):
    <img src="${card.imageUrl}" alt="${card.title}">
```

---

## 🗄️ Diagrama de Base de Datos PostgreSQL

```
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database: kyndo                 │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│      📦 Tabla: cards         │
├──────────────────────────────┤
│ id (UUID)                    │  ← ID interno
│ cardId (string)              │  ← "guacamaya-roja"
│ title (string)               │  ← "Guacamaya Roja"
│ description (string)         │  ← Descripción
│ imageUrl (string)            │  ← "content/birds/img/..."
│ thumbnailPath (string)       │  ← Miniatura (opcional)
│ rarity (string)              │  ← "common", "rare", etc.
│ packId (string)              │  ← "birds"
│ metadata (JSON)              │  ← Datos extra
│ createdAt (DateTime)         │
│ updatedAt (DateTime)         │
└──────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────┐
│    📝 Tabla: audit_logs      │
├──────────────────────────────┤
│ id (UUID)                    │
│ cardId (string FK)           │  ← Relacionado con cards
│ action (string)              │  ← "update_rarity", etc.
│ performedBy (string)         │  ← "admin", "system"
│ changes (JSON)               │  ← Detalles del cambio
│ createdAt (DateTime)         │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🎨 Tabla: presentation_rules │
├──────────────────────────────┤
│ id (UUID)                    │
│ rarity (string UNIQUE)       │  ← "common", "rare", etc.
│ frameColor (string)          │  ← "#FFD700"
│ glowEffect (boolean)         │  ← true/false
│ badgeIcon (string)           │  ← "⭐"
│ sortOrder (int)              │  ← Orden de rareza
│ metadata (JSON)              │
└──────────────────────────────┘

┌──────────────────────────────┐
│    📁 Tabla: assets          │
├──────────────────────────────┤
│ id (UUID)                    │
│ assetKey (string UNIQUE)     │  ← "thumbnails/ave-1.webp"
│ assetType (string)           │  ← "thumbnail", "image"
│ filePath (string)            │  ← Ruta física
│ fileSize (int)               │  ← Tamaño en bytes
│ mimeType (string)            │  ← "image/webp"
│ generatedBy (string)         │  ← "sharp", "manual"
│ createdAt (DateTime)         │
└──────────────────────────────┘
```

---

## 🖼️ Diagrama de Almacenamiento de Imágenes

```
┌─────────────────────────────────────────────────────────────┐
│                  Sistema de Archivos                         │
└─────────────────────────────────────────────────────────────┘

📂 content/                         ← Contenido versionado (Git)
   └── birds/
       └── img/
           ├── guacamaya-roja.webp      [1024x1024, 180 KB]
           ├── condor-andino.webp       [1024x1024, 165 KB]
           ├── colibri.webp             [1024x1024, 142 KB]
           └── ...

📂 backend/uploads/                 ← Uploads dinámicos (NO en Git)
   ├── custom-bird-1.jpg            [2048x2048, 850 KB]
   ├── custom-bird-2.png            [1500x1500, 420 KB]
   └── thumbnails/
       ├── custom-bird-1-thumb.webp  [320x320, 18 KB]  ← Generado
       └── custom-bird-2-thumb.webp  [320x320, 15 KB]  ← Generado

📊 Comparación:

content/           ✓ Versionado en Git
                   ✓ Optimizado manualmente
                   ✓ Listo para producción
                   ✓ WebP 1024x1024
                   ─ No editable por admin

backend/uploads/   ✗ NO en Git (.gitignore)
                   ✓ Subidas vía API
                   ✓ Thumbnails automáticos
                   ✓ Cualquier formato
                   ─ Requiere CDN en producción
```

---

## 🔐 Conexión Frontend ↔ Backend ↔ Database

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

👤 Usuario                  🌐 Frontend              🚀 Backend
   │                           │                        │
   │ 1. Abre el juego          │                        │
   │ ─────────────────────────>│                        │
   │                           │                        │
   │                           │ 2. GET /api/cards/...  │
   │                           │ ─────────────────────>│
   │                           │                        │
   │                           │                        │ 🗄️ PostgreSQL
   │                           │                        │      │
   │                           │          3. SELECT *   │      │
   │                           │          FROM cards    │      │
   │                           │          WHERE cardId  │      │
   │                           │<───────────────────────┼──────┘
   │                           │                        │
   │                           │ 4. Devuelve JSON       │
   │                           │<─────────────────────  │
   │                           │                        │
   │  5. Muestra carta         │                        │
   │<──────────────────────────│                        │
   │  (con imagen de content/) │                        │
   │                           │                        │
   │ 6. Ve la imagen           │                        │
   │    📷                      │                        │
   │    content/birds/img/     │                        │
   │    guacamaya-roja.webp    │                        │
```

---

## 🔄 Ciclo de Vida de una Imagen

```
1️⃣ Creación
   ┌─────────────────────────────────┐
   │ Designer crea imagen            │
   │ • Photoshop / Figma             │
   │ • Replicate AI / Leonardo.ai    │
   │ • Manual photography            │
   └─────────────────────────────────┘
                │
                ▼
2️⃣ Optimización
   ┌─────────────────────────────────┐
   │ Convertir a WebP                │
   │ $ cwebp -q 90 input.jpg \       │
   │     -o output.webp              │
   │ • Tamaño: 1024x1024             │
   └─────────────────────────────────┘
                │
                ▼
3️⃣ Colocar en content/
   ┌─────────────────────────────────┐
   │ content/birds/img/              │
   │ └── mi-ave.webp                 │
   └─────────────────────────────────┘
                │
                ▼
4️⃣ Registrar en pack-1.json
   ┌─────────────────────────────────┐
   │ {                               │
   │   "cardId": "mi-ave",           │
   │   "imageUrl": "content/..."     │
   │ }                               │
   └─────────────────────────────────┘
                │
                ▼
5️⃣ Cargar a la base de datos
   ┌─────────────────────────────────┐
   │ $ npm run seed                  │
   │ → PostgreSQL: INSERT INTO cards │
   └─────────────────────────────────┘
                │
                ▼
6️⃣ Disponible en API
   ┌─────────────────────────────────┐
   │ GET /api/cards/mi-ave           │
   │ → 200 OK { card: {...} }        │
   └─────────────────────────────────┘
                │
                ▼
7️⃣ Se muestra en el juego
   ┌─────────────────────────────────┐
   │ Frontend renderiza              │
   │ <img src="content/...">         │
   └─────────────────────────────────┘
```

---

## 📊 Tabla Comparativa: Tipos de Storage

| Característica       | `content/`          | `backend/uploads/` | PostgreSQL        |
|---------------------|---------------------|--------------------|-------------------|
| **Tipo**            | Archivos estáticos  | Archivos dinámicos | Base de datos     |
| **Versionado Git**  | ✅ Sí               | ❌ No              | ❌ No (datos)     |
| **Editable por API**| ❌ No               | ✅ Sí              | ✅ Sí             |
| **Qué se guarda**   | Imágenes WebP       | Uploads crudos     | Metadata + rutas  |
| **Tamaño típico**   | ~150 KB/imagen      | Variable           | ~1 KB/registro    |
| **Backup**          | Git push            | Filesystem backup  | pg_dump           |
| **Escalabilidad**   | ✅ CDN-ready        | ⚠️ Requiere S3     | ✅ Alta           |
| **Uso**             | Contenido curado    | Admin uploads      | Datos relacionales|

---

## 🚀 Checklist de Setup

```
✅ PASO 1: Base de Datos
   cd backend
   docker compose up -d postgres redis
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed

✅ PASO 2: Verificar PostgreSQL
   docker compose ps
   npx prisma studio  # http://localhost:5555

✅ PASO 3: Imágenes de Contenido
   ls -lh content/birds/img/
   # Deben existir las imágenes .webp

✅ PASO 4: Iniciar Backend
   cd backend
   npm run dev  # http://localhost:3000

✅ PASO 5: Probar API
   curl http://localhost:3000/health
   curl http://localhost:3000/api/cards/guacamaya-roja/presentation

✅ PASO 6: Abrir Frontend
   open frontend/memory/index.html
   # O usar Live Server en VS Code
```

---

## 📚 Referencias Rápidas

### Variables de Entorno Clave

```env
# Base de datos
DATABASE_URL="postgresql://kyndo:kyndo_dev_password@localhost:5432/kyndo"

# Almacenamiento
UPLOADS_DIR="./uploads"
THUMBNAILS_DIR="./uploads/thumbnails"

# API
PORT=3000
ADMIN_KEY="dev-admin-key-change-in-production"
```

### Comandos Esenciales

```bash
# Base de datos
docker compose up -d              # Iniciar PostgreSQL
npx prisma studio                 # Explorar datos
npm run seed                      # Cargar datos

# Imágenes
ls -lh content/birds/img/         # Ver imágenes
du -sh content/birds/img/*        # Tamaños

# Backend
npm run dev                       # Iniciar servidor
npm run worker                    # Procesar thumbnails
```

---

**Ver también:**
- [DONDE_PONER_DB_E_IMAGENES.md](./DONDE_PONER_DB_E_IMAGENES.md) - Guía completa
- [backend/COMO_INICIAR.md](./backend/COMO_INICIAR.md) - Instrucciones de inicio

**¿Dudas?** Abre un issue en el repositorio.
