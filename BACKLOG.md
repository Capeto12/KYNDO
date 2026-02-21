# KYNDO - Backlog de Tareas
> Actualizado: 2026-02-21
> Tomar tareas de arriba hacia abajo. Marcar con [x] cuando esté hecha.
>
> **Asignaciones:**
> - 🤖 **Antigravity** — ejecuta el código (Claude Code)
> - 👤 **Carlos** — decide diseño, balance, o requiere acción manual

---

## PRIORIDAD ALTA — Datos y bugs reales

### [ ] BATTLE-03: Agregar stats ATK/DEF explícitos a pack-1.json
**Archivo**: `birds/pack-1.json`
**Asignado**: 🤖 Antigravity
**Tarea**: Actualmente los stats de combate se generan proceduralmente en `battle-controller.js`
con un hash del `cardId`. Esto es frágil y no permite balancear el juego.
Agregar campos reales a cada carta:
```json
{ "id": "guacamaya-roja", "title": "...", "atk": 72, "def": 58 }
```
Distribuir stats coherentes con el tamaño/agresividad real del ave:
- Águila/Halcón → ATK alto (75-90), DEF media (45-60)
- Tucán/Guacamaya → ATK media (55-70), DEF alta (65-80)
- Colibrí/Mariposa → ATK baja (30-45), DEF baja (30-45)
Rango: 30-90. Excepcionales cerca de 85+, abundantes cerca de 40-.
Actualizar `battle-controller.js` para leer `card.atk` y `card.def` directamente.

### [ ] CSS-01: Consolidar CSS duplicado
**Archivos**: `frontend/styles.css` y `frontend/css/styles.css`
**Asignado**: 🤖 Antigravity
**Tarea**: Hay dos archivos CSS divergentes. `battle.html` referencia `./css/styles.css`,
`index.html` (Pairs) referencia `./styles.css`.
Estrategia: copiar el contenido de `frontend/styles.css` (fuente principal, la que se edita)
hacia `frontend/css/styles.css`, y actualizar `frontend/index.html` para que use `./css/styles.css`.
Así todos los HTMLs del frontend apuntan a la misma ruta.

### [ ] BATTLE-04: Sonidos en el modo Kombate (Web Audio)
**Archivo**: `frontend/battle.html`
**Asignado**: 🤖 Antigravity
**Tarea**: El juego Pairs tiene sonidos de match/error. Kombate no tiene ningún sonido.
Agregar con Web Audio API (sin archivos externos), igual que Pairs:
- Ataque exitoso: tono agudo corto (880Hz, sine, 0.1s)
- Daño recibido: tono bajo (150Hz, sawtooth, 0.15s)
- Victoria de ronda: melodía ascendente 3 notas (C5 → E5 → G5)
- Derrota de ronda: melodía descendente 2 notas (D4 → B3)
- Fanfarria de victoria de set: 5 notas rápidas ascendentes

---

## PRIORIDAD ALTA — Bloquea el juego (ORIGINALES — todas completadas)

### [x] BATTLE-01: Integrar Battle/Kombate al frontend
**Archivo**: `frontend/battle.html` (crear), `frontend/js/battle-controller.js` (existe)
**Asignado**: ✅ Completado
**Tarea**: Crear `frontend/battle.html` que cargue `battle-controller.js`, `battle-engine.js`, `battle-ui.js`.
El motor ya existe pero no hay página HTML que lo muestre.
Agregar link al battle desde `index.html` (home).

### [x] BATTLE-02: Conectar battle-engine con cartas reales
**Archivo**: `frontend/js/battle-engine.js`, `frontend/js/battle-controller.js`
**Asignado**: ✅ Completado
**Tarea**: El engine usa cartas hardcoded. Debe cargar cartas desde `../birds/pack-1.json`
filtrando solo las que tienen `tags.includes("kombat")`.
Stats ATK/DEF deben derivarse del índice de la carta (ya hay lógica en Pairs: `10 + (oid % 9)`).

### [x] DECK-01: Arreglar página "Mis Cartas" (deck.html)
**Archivo**: `frontend/deck.html`
**Asignado**: ✅ Completado
**Tarea**: Verificar que carga y muestra las 40 cartas de `birds/pack-1.json`.
Debe mostrar imagen, nombre, tags (pares/kombat), stats ATK/DEF.
Actualmente puede estar mostrando datos vacíos o dando error.

---

## PRIORIDAD MEDIA — Mejora la experiencia (ORIGINALES — todas completadas)

### [x] PAIRS-01: Mostrar imagen de la carta en el tablero (no solo al hacer click)
**Asignado**: ✅ Completado

### [x] PAIRS-02: Animación de volteo de carta (CSS flip)
**Asignado**: ✅ Completado

### [x] PAIRS-03: Sonidos básicos
**Asignado**: ✅ Completado

### [x] ADMIN-01: Importar cartas desde birds/pack-1.json al backend via admin
**Asignado**: ✅ Completado

### [x] BACKEND-01: Endpoint para actualizar tags de cartas existentes
**Asignado**: ✅ Completado

---

## PRIORIDAD BAJA — Pulido y extras (ORIGINALES — todas completadas)

### [x] UI-01: Home page (index.html) con links a todos los juegos
**Asignado**: ✅ Completado

### [x] UI-02: Header consistente en todas las páginas
**Asignado**: ✅ Completado

### [x] BACKEND-02: Endpoint de búsqueda por tags
**Asignado**: ✅ Completado

### [x] PAIRS-04: Guardar historial de partidas en localStorage
**Asignado**: ✅ Completado

### [x] INFRA-01: Script de seed para poblar la DB con birds/pack-1.json
**Asignado**: ✅ Completado

### [x] INFRA-02: Limpiar migración duplicada en Prisma
**Asignado**: ✅ Completado

---

## PRIORIDAD MEDIA — Nuevas mejoras

### [ ] BATTLE-05: Historial de batallas en localStorage
**Archivo**: `frontend/battle.html`, `frontend/js/storage.js`
**Asignado**: 🤖 Antigravity
**Tarea**: El juego Pairs guarda un historial de partidas que el usuario puede consultar.
Kombate no guarda nada. Agregar al terminar cada set de 8 juegos:
```js
{ date, result: 'victoria'|'derrota', gamesWon, gamesLost, roundsPlayed, score }
```
Mostrar en un botón "📋 Historial" en battle.html igual que el de Pairs.
Usar clave `kyndo_battle_history_v1` en localStorage. Máximo 50 entradas.

### [ ] PAIRS-05: Pestaña de estadísticas globales en Pairs
**Archivo**: `frontend/index.html` (modal de historial) o `frontend/settings.html`
**Asignado**: 🤖 Antigravity
**Tarea**: Mostrar estadísticas acumuladas calculadas del historial (`kyndo_history_v1`):
- Partidas jugadas / ganadas / % de victoria
- Grado actual y grado máximo alcanzado
- Racha máxima histórica y puntuación máxima
Agregar como segunda pestaña "📊 Estadísticas" dentro del modal de historial existente.

### [ ] DECK-02: Sincronizar colección con backend
**Archivo**: `frontend/js/deck-manager.js`
**Asignado**: 🤖 Antigravity (con backend corriendo)
**Tarea**: `deck-manager.js` tiene catálogo hardcoded de 40 cartas.
Agregar función `syncWithBackend()` que llame a `GET /api/search?limit=100`
y actualice rareza de las cartas locales con los datos del servidor.
Mantener catálogo local como fallback si el backend no responde.
Llamar al inicio de `deck.html` con `try/catch` silencioso.

---

## PRIORIDAD BAJA — Nuevas mejoras

### [ ] UX-01: Modo oscuro
**Archivos**: `frontend/styles.css`, `frontend/css/styles.css`, `frontend/settings.html`
**Asignado**: 🤖 Antigravity
**Tarea**: Agregar dark mode activable desde `settings.html`.
Implementar con CSS custom properties en `[data-theme="dark"]`:
```css
[data-theme="dark"] {
  --bg-1: #0f172a; --bg-2: #1e293b;
  --surface: rgba(30, 41, 59, 0.95);
  --text-strong: #f1f5f9;
}
```
Guardar preferencia en `localStorage` con clave `kyndo_theme_v1`.
Aplicar con `document.documentElement.setAttribute('data-theme', ...)` al cargar.
Agregar toggle en `settings.html` y en el header de todas las páginas.

### [ ] UX-02: Sonido de apertura de sobres en Mis Cartas
**Archivo**: `frontend/deck.html`
**Asignado**: 🤖 Antigravity
**Tarea**: Cuando el jugador abre un sobre (pack) en `deck.html`, agregar efecto de sonido.
Usar Web Audio API (sin archivos externos):
- Sobre abriéndose: ruido + tono ascendente suave (200→600Hz, 0.3s)
- Ping por cada carta revelada: (440Hz, sine, 0.08s)
- Si sale carta rara o excepcional: fanfarria especial (3 notas + brillo)

### [ ] INFRA-03: Limpiar console.logs de producción
**Archivo**: `frontend/js/battle-controller.js` (y battle-engine.js, battle-ui.js)
**Asignado**: 🤖 Antigravity
**Tarea**: `battle-controller.js` tiene `console.log()` de desarrollo (línea ~496 y otros).
Reemplazar con `console.debug()` para que no aparezcan en producción por defecto.
Buscar con grep `console.log` en todos los archivos de `frontend/js/`.

### [ ] INFRA-04: Actualizar cache bust en battle.html
**Archivo**: `frontend/battle.html`
**Asignado**: 🤖 Antigravity
**Tarea**: `<link rel="stylesheet" href="./css/styles.css?v=20260202-4">` tiene fecha vieja.
Actualizar a `?v=20260221` o eliminar el query param si no se usa CDN.
Revisar también si hay otros recursos con versiones hardcodeadas.

### [ ] TEST-01: Crear archivo rewards-tests.js
**Archivo**: `frontend/js/rewards-tests.js`
**Asignado**: 🤖 Antigravity
**Tarea**: El archivo aparece en git status como "Added" pero no existe en disco.
Crear tests para `rewards.js` que corran en consola del browser con `console.assert()`:
```js
// test: 3 pares en racha → 1 carta de recompensa
// test: pasar de grado → pack de 5 cartas
// test: ganar set de Kombat → 1 carta
// test: ganar partida Kombat → 5 cartas
```
Exportar función `runRewardsTests()` para llamar desde consola.

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
- [x] Fix overlay carta grande en Pairs (centrado correcto en pantalla)
