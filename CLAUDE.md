# KYNDO - Contexto del Proyecto para Claude Code

## Qué es KYNDO
Juego educativo de cartas coleccionables con aves de Colombia. Tiene dos modos de juego:
- **Pairs** (memoria): encontrar pares de cartas iguales
- **Kombate/Battle**: combate por turnos entre cartas con stats ATK/DEF

## Stack Técnico
- **Frontend**: HTML + CSS + JS vanilla (sin framework), archivos en `frontend/`
- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL
- **DB**: PostgreSQL en Docker (`localhost:5432`, user: kyndo, pass: kyndo_dev_password, db: kyndo)
- **Cache**: Redis en Docker (`localhost:6379`)
- **Backend corre en**: `http://localhost:4001`
- **Admin panel**: `admin/index.html` (archivo local, apunta a localhost:4001)

## Estructura clave
```
KYNDO/
├── frontend/
│   ├── index.html          ← Juego Pairs (memoria)
│   ├── styles.css          ← Estilos del juego Pairs
│   ├── game.js             ← Motor viejo (legacy)
│   ├── deck.html           ← Página "Mis Cartas"
│   ├── js/
│   │   ├── battle-controller.js
│   │   ├── battle-engine.js
│   │   ├── battle-ui.js
│   │   ├── game-controller.js
│   │   ├── deck-manager.js
│   │   └── storage.js
│   └── css/styles.css      ← Fuente limpia de estilos
├── admin/
│   └── index.html          ← Panel admin (conectado a backend)
├── birds/
│   ├── pack-1.json         ← 40 cartas de aves colombianas con tags
│   └── img/                ← Imágenes .webp de las aves
├── backend/
│   ├── src/
│   │   ├── index.ts        ← Entry point Express (puerto 4001)
│   │   └── routes/         ← adminCards, auth, packs, search, userCards
│   ├── prisma/schema.prisma
│   └── .env                ← DATABASE_URL local Docker
└── index.html              ← Home page principal
```

## Estado Actual (Feb 2026)
- Pairs: FUNCIONA con imágenes reales de aves
- Backend: CORRIENDO en puerto 4001
- Docker: PostgreSQL + Redis corriendo y healthy
- Admin: FUNCIONA conectado a localhost:4001
- Battle/Kombate: Archivos JS existen pero NO está integrado al frontend

## Reglas importantes
- SIEMPRE escribir archivos en UTF-8 sin BOM (VS Code tenía bug de UTF-16)
- El `.vscode/settings.json` ya tiene `"files.encoding": "utf8"` para prevenir esto
- Las cartas tienen `tags: ["pares", "kombat"]` en birds/pack-1.json
- El backend tiene campo `tags String[]` en el modelo Card de Prisma
- ADMIN_KEY para el backend: `dev-admin-key-change-in-production`
- JWT_SECRET: `kyndo-jwt-secret-change-in-production-min-32-chars`

## Para iniciar el backend (si no está corriendo)
```bash
cd backend && npm run dev
```
Docker ya debe estar corriendo con `docker-compose up -d`

## Backlog de tareas
Ver `BACKLOG.md` para todas las tareas priorizadas.
