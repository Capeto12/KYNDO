# KYNDO - Backlog de Tareas
> Actualizado: 2026-02-21
> Tomar tareas de arriba hacia abajo. Marcar con [x] cuando esté hecha.

---

## PRIORIDAD ALTA — Bloquea el juego

### [x] BATTLE-01: Integrar Battle/Kombate al frontend
**Archivo**: `frontend/battle.html` (crear), `frontend/js/battle-controller.js` (existe)
**Tarea**: Crear `frontend/battle.html` que cargue `battle-controller.js`, `battle-engine.js`, `battle-ui.js`.
El motor ya existe pero no hay página HTML que lo muestre.
Agregar link al battle desde `index.html` (home).

### [x] BATTLE-02: Conectar battle-engine con cartas reales
**Archivo**: `frontend/js/battle-engine.js`, `frontend/js/battle-controller.js`
**Tarea**: El engine usa cartas hardcoded. Debe cargar cartas desde `../birds/pack-1.json`
filtrando solo las que tienen `tags.includes("kombat")`.
Stats ATK/DEF deben derivarse del índice de la carta (ya hay lógica en Pairs: `10 + (oid % 9)`).

### [x] DECK-01: Arreglar página "Mis Cartas" (deck.html)
**Archivo**: `frontend/deck.html`
**Tarea**: Verificar que carga y muestra las 40 cartas de `birds/pack-1.json`.
Debe mostrar imagen, nombre, tags (pares/kombat), stats ATK/DEF.
Actualmente puede estar mostrando datos vacíos o dando error.

---

## PRIORIDAD MEDIA — Mejora la experiencia

### [x] PAIRS-01: Mostrar imagen de la carta en el tablero (no solo al hacer click)
**Archivo**: `frontend/index.html` (script inline, función `startRun`)
**Tarea**: Actualmente las cartas en el tablero muestran solo el reverso (sin imagen).
Al hacer click se revela. Mejorar: cuando está `revealed`, mostrar thumbnail pequeño de la imagen.
Usar `cardData.image_url` con prefijo `../`.

### [x] PAIRS-02: Animación de volteo de carta (CSS flip)
**Archivo**: `frontend/styles.css`
**Tarea**: Agregar efecto CSS 3D flip cuando una carta pasa de `hidden` a `revealed`.
Estructura: `.card` con `transform-style: preserve-3d`, `.card-front` y `.card-back`.

### [x] PAIRS-03: Sonidos básicos
**Archivo**: `frontend/index.html` o nuevo `frontend/js/sounds.js`
**Tarea**: Agregar sonido al hacer match (éxito) y al fallar (error).
Usar Web Audio API para generar tonos simples sin archivos externos.

### [x] ADMIN-01: Importar cartas desde birds/pack-1.json al backend via admin
**Archivo**: `admin/index.html`
**Tarea**: Agregar botón en admin "Importar Pack de Aves" que llame a
`POST /api/admin/cards` con los datos de `birds/pack-1.json`.
Actualmente la DB tiene las cartas pero sin tags (`tags: []`).
El import debe actualizar los tags también.

### [x] BACKEND-01: Endpoint para actualizar tags de cartas existentes
**Archivo**: `backend/src/routes/adminCards.ts`
**Tarea**: Agregar `PATCH /api/admin/cards/:cardId/tags` que reciba `{ tags: string[] }`
y actualice el campo tags de la carta en la DB.

---

## PRIORIDAD BAJA — Pulido y extras

### [x] UI-01: Home page (index.html) con links a todos los juegos
**Archivo**: `index.html` (raíz)
**Tarea**: El home actual es básico. Agregar cards visuales para:
- Pairs (memoria) → `frontend/index.html`
- Kombate (battle) → `frontend/battle.html`
- Mis Cartas → `frontend/deck.html`
Cada card debe mostrar imagen de preview y descripción corta.

### [x] UI-02: Header consistente en todas las páginas
**Archivos**: `frontend/index.html`, `frontend/deck.html`, `frontend/battle.html`
**Tarea**: El header con logo "Kindo" debe ser idéntico en todas las páginas.
Extraer como HTML reutilizable o copiar el bloque del Pairs.

### [x] BACKEND-02: Endpoint de búsqueda por tags
**Archivo**: `backend/src/routes/search.ts`
**Tarea**: Agregar soporte para `GET /api/search?tags=pares` o `?tags=kombat`
que filtre cartas por tag. Útil para que el frontend cargue solo cartas del juego correcto.

### [x] PAIRS-04: Guardar historial de partidas en localStorage
**Archivo**: `frontend/index.html` (script inline)
**Tarea**: Al terminar cada partida, guardar en localStorage:
`{ date, grade, pairs, attempts, score, passed }`.
Mostrar historial en un botón "Ver mis partidas".

### [x] INFRA-01: Script de seed para poblar la DB con birds/pack-1.json
**Archivo**: `backend/seeds/seed_birds.ts` (crear)
**Tarea**: Script que lea `../birds/pack-1.json` y haga upsert de todas las cartas
en la DB incluyendo tags. Correr con `npm run seed:birds`.

### [x] INFRA-02: Limpiar migración duplicada en Prisma
**Archivo**: `backend/prisma/migrations/`
**Tarea**: Hay dos migraciones que crean las mismas tablas (`20260130155912_` y `20260131_init`).
Ambas ya están marcadas como aplicadas. Eliminar `20260131_init` de la carpeta
y de la tabla `_prisma_migrations` para que `prisma migrate dev` funcione limpio.
```sql
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260131_init';
```
Luego borrar la carpeta `prisma/migrations/20260131_init/`.

---

## COMPLETADAS
- [x] Resolver conflictos de merge en index.html, frontend/index.html, battle-ui.js
- [x] Arreglar encoding UTF-16 en frontend/index.html y frontend/styles.css
- [x] Conectar Pairs con datos reales de birds/pack-1.json
- [x] Agregar campo tags a birds/pack-1.json (40 cartas)
- [x] Agregar campo tags al schema Prisma (Card model)
- [x] Crear .vscode/settings.json para prevenir UTF-16
- [x] Restaurar admin/index.html desde git history
- [x] Confirmar backend corriendo en puerto 4001
- [x] Crear CLAUDE.md con contexto del proyecto
- [x] CSS 3D flip animation en Pairs (card-inner/card-back-face/card-front-face)
- [x] Sonidos Web Audio API para match y error en Pairs
- [x] Historial de partidas en localStorage + modal "Ver mis partidas"
- [x] Botón "Importar Pack de Aves" en admin panel
- [x] POST /api/admin/cards y PATCH /api/admin/cards/:cardId/tags en backend
- [x] Home page con visual game cards y previews de imágenes
