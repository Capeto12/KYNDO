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

---

## Decisiones de Diseño del Juego (Feb 2026)

### Contenido — Base de datos de aves
- Hay una base de datos de ~12,000 aves colombianas siendo construida en Google Drive.
- Estado actual: ~1,600 aves completadas.
- Cada ave tendrá: 3-4 imágenes, grabación de sonido, y datos biológicos completos:
  - Nombre común y científico
  - Hábitat y rangos de vuelo
  - Altura en centímetros
  - Familia, orden, especie (y "grupo familiar" — pendiente de reorganizar en Drive)
- **`birds/pack-1.json` es solo un demo placeholder de 40 cartas.** No es la fuente de verdad final.
- Los stats ATK/DEF finales vendrán de los datos reales de la base de datos.

### Mecánica — Igualdad de cartas (REGLA FUNDAMENTAL)
- **Todos los jugadores usan exactamente las mismas cartas con exactamente los mismos stats.**
- Ni la IA ni ningún jugador puede modificar los puntos de una carta.
- Los stats son una característica intrínseca de cada ave (derivada de sus datos reales).
- Esto garantiza que el juego sea de habilidad, no de colección privilegiada.

### Mecánica — Pairs (Memoria)
- Tamaño de carta en móvil: ~30px de ancho, 10 cartas por fila en pantalla normal de celular.
- Espaciado suficiente para que el dedo no active la carta adyacente por error.
- Grados 1–5 con número de pares: 10, 15, 21, 28, 36.
- Factor de intentos máximos: totalPairs × 2.2

### Mecánica — Kombate/Battle (Pendiente de desarrollo)
- Formato: sets de 8 juegos, cada juego tiene hasta 5 rondas.
- Fase de pre-batalla (estrategia): el jugador puede preparar su mazo/estrategia antes de empezar.
  - Esta fase NO está bien desarrollada aún — es prioridad de diseño.
- El resultado depende de las decisiones de orden de carta, no de stats modificados.

### Mecánica — Sistema de incentivos y premios (Pendiente de diseño)
- Cada modo de juego debe tener recompensas claras al terminar una partida o set.
- Ideas iniciales (en rewards.js): cartas de recompensa, packs de sobres, puntos de experiencia.
- El sistema completo aún debe diseñarse y documentarse aquí al definirlo.

### Nota sobre BATTLE-03
- La tarea BATTLE-03 (agregar stats ATK/DEF a pack-1.json) está **CANCELADA**.
- Razón: pack-1.json es un demo. Los stats reales vendrán de la DB de 12,000 aves.
- Cuando llegue el contenido real, battle-controller.js deberá leer `card.atk` y `card.def` directamente.

---

## Arquitectura Backend — Evolución Planificada

### Autenticación — Google OAuth2
- El jugador inicia sesión con su cuenta Google (OAuth2 via Google Identity).
- En el primer login: se le asigna automáticamente su colección inicial de cartas.
- Las sesiones se manejan con JWT (secreto ya configurado en `.env`).
- Cada jugador tiene sus propios datos en la DB (colección, nivel, historial).

### Importación de contenido — Batch de aves
- El backend debe recibir los datos de las ~12,000 aves en batches (lotes).
- Cada batch incluye:
  - Metadata: nombre común, nombre científico, hábitat, rangos de vuelo, altura (cm), familia, orden, especie, grupo familiar
  - Media: 3-4 URLs de imágenes por ave, URL de grabación de sonido
- El endpoint debe manejar upsert (crear o actualizar por `cardId`).
- Debe incluir validación y reporte de errores por lote (cuántas creadas, cuántas actualizadas, cuántas fallaron).
- El importador puede ser llamado desde el admin panel o por script CLI.

### Estado del juego — Persistencia en backend
- Actualmente el progreso se guarda en localStorage (frontend).
- Evolución: sincronizar con backend para que el jugador no pierda progreso al cambiar dispositivo.
- El backend debe saber:
  - Grado actual en Pairs (1-5)
  - Historial de partidas (Pairs + Kombate)
  - Cartas en colección y mazos
  - Nivel de actividad: última vez activo, partidas jugadas esta semana

### Monitoreo de jugadores (Admin)
- El admin debe poder ver:
  - Jugadores registrados y su estado (activo/inactivo)
  - Nivel/grado actual por jugador
  - Cuántas cartas tiene cada jugador
  - Última sesión activa
- Esto permite balancear el juego y detectar problemas de UX.

### Modelo de datos a agregar/actualizar en Prisma
```prisma
model User {
  id          String   @id @default(cuid())
  googleId    String   @unique
  email       String   @unique
  displayName String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  lastActiveAt DateTime?
  pairsGrade  Int      @default(1)
  // relaciones: UserCard[], GameHistory[]
}
model UserCard {
  userId    String
  cardId    String
  count     Int    @default(1)  // copias en colección
  @@id([userId, cardId])
}
```
