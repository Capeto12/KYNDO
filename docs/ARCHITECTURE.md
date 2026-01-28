# 🏗️ ARQUITECTURA — KYNDO MEMORY (CÓDIGO REAL)

**Versión:** 1.0 (Nivel 1 estabilizado)

Este documento explica **cómo funciona el código actual**, no la teoría general del sistema.

---

## 📐 **Arquitectura de alto nivel**
```
┌─────────────────────────────────────┐
│  HTML (estructura)                   │
│  - Board grid dinámico               │
│  - Overlays (foco + resultado)       │
│  - HUD (pares/intentos/racha/score)  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  CSS (presentación)                  │
│  - Estados visuales de carta         │
│  - Grid responsivo                   │
│  - Animaciones de transición         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  JavaScript (lógica)                 │
│  - Game loop                         │
│  - Estado del juego                  │
│  - Eventos de interacción            │
│  - Persistencia (LocalStorage)       │
└─────────────────────────────────────┘
```

**Principio fundamental:** Todo el estado vive en JavaScript. El DOM solo refleja el estado.

---

## 🔄 **Flujo de ejecución completo**

### **1. Inicialización (startRun)**
```
DOMContentLoaded
  ↓
startRun()
  ↓
┌─────────────────────────────────────┐
│ 1. Reset completo                   │
│    - board.innerHTML = ''           │
│    - missedPairs.clear()            │
│    - revealedCards = []             │
│    - score = 0, matches = 0, etc    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. Cargar config del grado actual   │
│    - totalCards = gradeConfig[1]    │
│    - totalCards = 20                │
│    - totalPairs = 10                │
│    - maxAttempts = ceil(10 × 2.2)   │
│    - maxAttempts = 22               │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. Calcular grid dinámico           │
│    - columns = ceil(sqrt(20))       │
│    - columns = 5                    │
│    - rows = ceil(20 / 5) = 4        │
│    - grid: 5×4                      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. Generar objectIds mezclados      │
│    - ids = [0,0,1,1,...,9,9]        │
│    - Fisher-Yates shuffle           │
│    - ids = [3,7,0,9,3,1,...]        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 5. Renderizar cartas en DOM         │
│    - for (i = 0; i < 20; i++)       │
│    - crear div.card                 │
│    - data-object-id = ids[i]        │
│    - addEventListener('click')      │
│    - appendChild(board)             │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 6. Actualizar HUD                   │
│    - updateHUD()                    │
│    - Mostrar estado inicial         │
└─────────────────────────────────────┘
```

---

### **2. Click en carta (evento crítico)**
```
Usuario hace click en carta
  ↓
card.addEventListener('click')
  ↓
┌─────────────────────────────────────┐
│ PASO 1: ¿Hay pending que limpiar?  │
│                                     │
│ if (clearPendingCards()) {          │
│   return; // click consumido        │
│ }                                   │
└─────────────────────────────────────┘
  ↓ NO hay pending
┌─────────────────────────────────────┐
│ PASO 2: Validaciones               │
│                                     │
│ if (pendingLock) return;            │
│ if (card.state !== 'hidden') return;│
│ if (revealedCards.length >= 2)     │
│   return;                           │
└─────────────────────────────────────┘
  ↓ Todas las validaciones OK
┌─────────────────────────────────────┐
│ PASO 3: Revelar carta               │
│                                     │
│ card.dataset.state = 'revealed';    │
│ card.classList.remove('hidden');    │
│ card.classList.add('revealed');     │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ PASO 4: Guardar en array            │
│                                     │
│ revealedCards.push(card);           │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ PASO 5: Abrir overlay (foco)        │
│                                     │
│ openFocusFor(card);                 │
│ - Leer objectId de la carta         │
│ - Cargar contenido ficticio         │
│ - overlay.classList.add('active')   │
└─────────────────────────────────────┘
```

---

### **3. Click en overlay (cierra y evalúa)**
```
Usuario hace click en overlay
  ↓
overlay.addEventListener('click')
  ↓
┌─────────────────────────────────────┐
│ 1. Cerrar overlay                   │
│    closeFocus();                    │
│    overlay.classList.remove('active')│
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. ¿Hay 2 cartas reveladas?         │
│                                     │
│ if (revealedCards.length === 2) {   │
│   const [a, b] = revealedCards;     │
│   resolvePair(a, b);                │
│ }                                   │
└─────────────────────────────────────┘
```

---

### **4. Limpieza de pending (CRÍTICO)**
```
function clearPendingCards()
  ↓
┌─────────────────────────────────────┐
│ 1. Buscar cartas pending            │
│    const pending =                  │
│      querySelectorAll('.pending');  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. ¿Hay exactamente 2?              │
│                                     │
│ if (pending.length === 2) {         │
│   // Limpiar                        │
│ } else {                            │
│   return false; // nada que hacer   │
│ }                                   │
└─────────────────────────────────────┘
  ↓ SÍ hay 2 pending
┌─────────────────────────────────────┐
│ 3. Volver a hidden                  │
│                                     │
│ pending.forEach(card => {           │
│   card.dataset.state = 'hidden';    │
│   card.classList.remove('pending'); │
│   card.classList.add('hidden');     │
│ });                                 │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. Retornar true                    │
│    return true;                     │
│    (indica que se limpiaron)        │
└─────────────────────────────────────┘
```

**Por qué es crítico:**
- Sin esto, 2 cartas pending bloquean el juego completamente
- El jugador no puede abrir más cartas
- Es el único camino de `pending` → `hidden`

---

### **5. Resolución de par (motor del juego)**
```
resolvePair(cardA, cardB)
  ↓
┌─────────────────────────────────────┐
│ PASO 1: Incrementar intentos base   │
│    attempts += 1;                   │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ PASO 2: Obtener IDs                │
│    aId = Number(a.dataset.objectId);│
│    bId = Number(b.dataset.objectId);│
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ PASO 3: ¿Match?                     │
│    if (aId === bId)                 │
└─────────────────────────────────────┘
  ↓                           ↓
  SÍ (MATCH)                  NO (MISS)
  ↓                           ↓
┌──────────────────┐   ┌──────────────────┐
│ MATCH            │   │ MISS             │
│                  │   │                  │
│ matches += 1     │   │ streak = 0       │
│ streak += 1      │   │                  │
│ maxStreakSeen    │   │ key = canonical  │
│                  │   │                  │
│ score += 10      │   │ if (missedPairs  │
│ bonus = 5×(n-1)  │   │     .has(key)) { │
│ score += bonus   │   │   attempts += 1  │
│                  │   │   score -= 2     │
│ state = matched  │   │ } else {         │
│ classList update │   │   missedPairs    │
│                  │   │     .add(key)    │
│ revealedCards=[] │   │ }                │
│                  │   │                  │
│ updateHUD()      │   │ state = pending  │
│ checkEndOfLevel()│   │ classList update │
│                  │   │                  │
│                  │   │ revealedCards=[] │
│                  │   │ updateHUD()      │
└──────────────────┘   └──────────────────┘
```

---

### **6. Fin de nivel (checkEndOfLevel)**
```
checkEndOfLevel()
  ↓
┌─────────────────────────────────────┐
│ ¿Ya encontramos todos los pares?    │
│                                     │
│ if (matches !== totalPairs) return; │
└─────────────────────────────────────┘
  ↓ SÍ, todos los pares encontrados
┌─────────────────────────────────────┐
│ Evaluar si pasó el límite           │
│                                     │
│ const passed =                      │
│   (attempts <= maxAttempts);        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Pausa cognitiva                     │
│                                     │
│ setTimeout(() => {                  │
│   showResultOverlay(passed);        │
│ }, 350);                            │
└─────────────────────────────────────┘
```

---

## 🎨 **Estados de carta (máquina de estados)**
```
        ┌─────────┐
        │ hidden  │ ◄──────────────────┐
        └────┬────┘                    │
             │ click                   │
             ↓                         │
        ┌─────────┐                    │
        │revealed │                    │
        └────┬────┘                    │
             │ resolvePair()           │
             ↓                         │
          ┌──┴──┐                      │
       Match? │  No                    │
          ↓     ↓                      │
    ┌────────┐ ┌────────┐              │
    │matched │ │pending │              │
    │(final) │ └───┬────┘              │
    └────────┘     │ clearPending()    │
                   └───────────────────┘
```

**Transiciones válidas:**
- `hidden` → `revealed` (click del usuario)
- `revealed` → `matched` (acierto, irreversible)
- `revealed` → `pending` (fallo, temporal)
- `pending` → `hidden` (limpieza)

**Transiciones INVÁLIDAS:**
- `matched` → cualquier cosa (estado final)
- `pending` → `revealed` (debe pasar por hidden)
- `hidden` → `matched` (debe pasar por revealed)

---

## 📦 **Estructura de datos clave**

### **revealedCards (array)**
```javascript
// Estado: máximo 2 elementos
revealedCards = [cardElementA, cardElementB]

// Al resolver par, siempre se vacía
revealedCards = []

// Operaciones:
revealedCards.push(card);           // agregar
const [a, b] = revealedCards;       // desestructurar
revealedCards = [];                 // resetear
```

---

### **missedPairs (Set)**
```javascript
// Guarda pares fallados como "minId-maxId"
missedPairs = Set {
  "2-7",   // fallamos AVE 2 con AVE 7
  "3-5",   // fallamos AVE 3 con AVE 5
  "0-9"    // fallamos AVE 0 con AVE 9
}

// Función canónica (orden no importa)
function canonicalPairKey(id1, id2) {
  const a = Number(id1), b = Number(id2);
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// Ejemplos:
canonicalPairKey(7, 2) → "2-7"
canonicalPairKey(2, 7) → "2-7"  // misma clave

// Operaciones:
missedPairs.add(key);      // registrar fallo
missedPairs.has(key);      // verificar si ya falló antes
missedPairs.clear();       // reset al iniciar run
```

**Por qué Set y no Array:**
- `.has()` es O(1) vs `.includes()` que es O(n)
- No permite duplicados automáticamente
- Más eficiente para 10-36 pares

---

### **gradeConfig (objeto)**
```javascript
const gradeConfig = {
  1: 20,  // grado → total cartas
  2: 30,
  3: 42,
  4: 56,
  5: 72
};

// Acceso:
totalCards = gradeConfig[memoryGrade];

// Validación:
if (!gradeConfig[memoryGrade]) {
  memoryGrade = 1; // fallback
}
```

---

### **gameState (variables globales)**
```javascript
// Configuración (cargada de gradeConfig)
let totalCards = 0;
let totalPairs = 0;
let maxAttempts = 0;

// Progreso actual
let score = 0;
let matches = 0;
let attempts = 0;

// Racha
let streak = 0;
let maxStreakSeen = 0;

// Estado temporal
let revealedCards = [];
let pendingLock = false;

// Historial de errores
const missedPairs = new Set();

// Persistencia
let memoryGrade = 1; // cargado de localStorage
```

**Nota:** En una refactorización futura, esto debería ser un objeto único:
```javascript
const gameState = {
  config: { totalCards, totalPairs, maxAttempts },
  progress: { score, matches, attempts },
  streak: { current: 0, max: 0 },
  temp: { revealedCards, pendingLock },
  history: { missedPairs }
};
```

---

## 🔐 **Invariantes (condiciones que SIEMPRE deben cumplirse)**
```javascript
// 1. Número de cartas es par
assert(totalCards % 2 === 0);

// 2. revealedCards nunca tiene más de 2
assert(revealedCards.length <= 2);

// 3. Puntaje nunca es negativo
assert(score >= 0);

// 4. Matches nunca supera totalPairs
assert(matches <= totalPairs);

// 5. Cartas matched no pueden volver a hidden
// (garantizado por pointer-events: none en CSS)

// 6. Pending siempre son exactamente 2 o 0
const pending = querySelectorAll('.pending');
assert(pending.length === 0 || pending.length === 2);

// 7. Grid siempre tiene suficiente espacio
const rows = Math.ceil(totalCards / columns);
assert(rows * columns >= totalCards);
```

**Si alguno de estos falla, hay un bug crítico.**

---

## 🧪 **Funciones puras vs impuras**

### **Funciones puras (sin side effects)**
```javascript
// ✅ Pura: mismo input → mismo output
function computeColumns(totalCards) {
  return Math.ceil(Math.sqrt(totalCards));
}

// ✅ Pura: operación sobre datos
function canonicalPairKey(id1, id2) {
  const a = Number(id1), b = Number(id2);
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// ✅ Pura: cálculo matemático
function clampNonNegative(n) {
  return n < 0 ? 0 : n;
}
```

### **Funciones impuras (modifican estado/DOM)**
```javascript
// ⚠️ Impura: modifica DOM
function updateHUD() {
  hudMatches.textContent = String(matches);
  hudScore.textContent = String(score);
  // ...
}

// ⚠️ Impura: modifica estado global
function resolvePair(a, b) {
  attempts += 1;
  // ...
  revealedCards = [];
}

// ⚠️ Impura: side effect (overlay)
function openFocusFor(card) {
  // ...
  overlay.classList.add('active');
}
```

**Buena práctica:** Separar lógica pura de efectos (preparación para refactor futuro).

---

## 🔄 **Persistencia (LocalStorage)**

### **Lectura al inicio**
```javascript
const STORAGE_KEY = 'kyndo_memory_v1';

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
})();

let memoryGrade = typeof saved.memoryGrade === 'number' 
  ? saved.memoryGrade 
  : 1;

// Validar que el grado existe
if (!gradeConfig[memoryGrade]) {
  memoryGrade = 1;
}
```

### **Escritura al ascender**
```javascript
// En showResultOverlay, al presionar "Continuar" (si passed)
if (passed) {
  const next = memoryGrade + 1;
  memoryGrade = gradeConfig[next] ? next : memoryGrade;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
    memoryGrade 
  }));
}
```

**Datos guardados:**
- `memoryGrade` (número del 1 al 5)

**Datos NO guardados (actualmente):**
- Estadísticas históricas
- Puntajes máximos
- Tiempo jugado

**Futuro (backend):**
```javascript
// POST /memory/finish
{
  memory_run_id: "uuid",
  grade: 1,
  passed: true,
  pairs: 10,
  attempts: 18,
  score: 125,
  max_streak: 5
}
```

---

## 🚫 **Anti-patrones detectados (y corregidos)**

### **❌ ANTI-PATRÓN 1: Bloqueo sin salida**

**ANTES (malo):**
```javascript
card.addEventListener('click', () => {
  const pending = querySelectorAll('.pending');
  if (pending.length === 2) return; // BLOQUEO
  
  // resto del código...
});
```

**Problema:** Si hay 2 pending, el juego se congela. El usuario no puede hacer nada.

**AHORA (bueno):**
```javascript
card.addEventListener('click', () => {
  if (clearPendingCards()) {
    return; // click consumido en limpiar
  }
  
  // resto del código...
});
```

**Solución:** El click limpia las pending, desbloqueando el juego.

---

### **❌ ANTI-PATRÓN 2: Lógica dispersa en eventos**

**ANTES (malo):**
```javascript
card.addEventListener('click', () => {
  // 50 líneas de lógica aquí
  if (/* condición compleja */) {
    // más lógica
    if (/* otra condición */) {
      // aún más lógica
    }
  }
});
```

**Problema:** Difícil de testear, mantener y debuggear.

**AHORA (bueno):**
```javascript
card.addEventListener('click', () => {
  if (clearPendingCards()) return;
  if (!isCardClickable(card)) return;
  revealCard(card);
  openFocusFor(card);
});

function isCardClickable(card) {
  if (pendingLock) return false;
  if (card.dataset.state !== 'hidden') return false;
  if (revealedCards.length >= 2) return false;
  return true;
}

function revealCard(card) {
  card.dataset.state = 'revealed';
  card.classList.remove('hidden');
  card.classList.add('revealed');
  revealedCards.push(card);
}
```

**Solución:** Funciones pequeñas con responsabilidad única.

---

### **❌ ANTI-PATRÓN 3: Estado desordenado**

**ANTES (malo):**
```javascript
let x = 0;
let y = 0;
let z = false;
let w = [];
// ¿Qué representa cada variable?
```

**Problema:** Nombres no descriptivos, propósito poco claro.

**AHORA (bueno):**
```javascript
let score = 0;           // puntuación actual
let matches = 0;         // pares encontrados
let attempts = 0;        // intentos consumidos
let streak = 0;          // racha actual de matches
let revealedCards = [];  // cartas temporalmente reveladas
```

**Solución:** Nombres descriptivos, comentarios cuando aportan valor.

---

## 📌 **Convenciones de código**

### **Nombres de funciones**
```javascript
// Verbos para acciones
startRun()
resolvePair()
clearPendingCards()

// Preguntas booleanas
isCardClickable()
canOpenCard()

// Helpers/utils (sustantivos o verbos)
computeColumns()
canonicalPairKey()
clampNonNegative()

// Actualizaciones de UI
updateHUD()
openFocusFor()
showResultOverlay()
```

### **Nombres de variables**
```javascript
// Estado de juego: camelCase
let totalPairs = 0;
let maxAttempts = 0;

// Parámetros: UPPER_SNAKE_CASE
const STREAK_BASE_BONUS = 5;
const ATTEMPT_FACTOR = 2.2;

// DOM: prefijo claro
const hudScore = document.getElementById('hud-score');
const btnPrimary = document.getElementById('btnPrimary');

// Datos: descriptivo
const objectIds = buildObjectIds(totalPairs);
const [cardA, cardB] = revealedCards;
```

---

## 🔮 **Futuras mejoras arquitectónicas**

### **Fase 2: Separar lógica del DOM**
```javascript
// game-engine.js (pura lógica, testeable)
class MemoryGame {
  constructor(config) {
    this.totalCards = config.totalCards;
    this.totalPairs = config.totalPairs;
    // ...
  }
  
  revealCard(cardId) {
    // lógica pura
    return newState;
  }
  
  resolvePair() {
    // lógica pura
    return { match, score, streak };
  }
  
  getState() {
    return { ...this.state }; // inmutable
  }
}

// ui-renderer.js (solo presentación)
class BoardRenderer {
  render(gameState) {
    // actualizar DOM según estado
  }
  
  updateHUD(gameState) {
    // reflejar estado en HUD
  }
}

// main.js (orquestación)
const game = new MemoryGame(config);
const ui = new BoardRenderer(boardElement);

board.addEventListener('click', (e) => {
  const newState = game.handleClick(e.target.id);
  ui.render(newState);
});
```

**Ventajas:**
- Testeable con unit tests
- Lógica reutilizable (web/mobile/native)
- Separación de responsabilidades clara

---

### **Fase 3: Sistema de eventos (pub/sub)**
```javascript
// Desacoplar lógica de UI
game.on('match', (data) => {
  showMatchAnimation(data.cards);
  playSoundEffect('match');
});

game.on('miss', (data) => {
  showMissAnimation(data.cards);
  if (data.repeated) {
    showPenaltyIndicator();
  }
});

game.on('levelComplete', (result) => {
  showResultOverlay(result);
  updateLeaderboard(result);
});

game.on('streakIncreased', (streak) => {
  showStreakEffect(streak);
});
```

**Ventajas:**
- Efectos visuales/sonoros desacoplados
- Fácil agregar features sin tocar core
- Testing más granular

---

### **Fase 4: State management (opcional, si crece mucho)**
```javascript
// Similar a Redux/Zustand
const initialState = {
  config: { totalCards: 20, totalPairs: 10, maxAttempts: 22 },
  progress: { score: 0, matches: 0, attempts: 0 },
  streak: { current: 0, max: 0 },
  cards: {},
  ui: { overlayOpen: false, pendingCards: [] }
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'REVEAL_CARD':
      return { ...state, cards: { ...state.cards, [action.id]: 'revealed' } };
    case 'RESOLVE_MATCH':
      return { ...state, progress: { ...state.progress, matches: state.progress.matches + 1 } };
    // ...
  }
}
```

**Solo necesario si:**
- Backend sincronizado
- Modo PvP tiempo real
- Replay de partidas
- Debugging avanzado

---

## 🎯 **Puntos de extensión para nuevas features**

### **1. Animaciones CSS**
```css
.card {
  transition: transform 150ms ease, opacity 150ms ease;
}

.card.matched {
  animation: matchPulse 300ms ease;
  transform: scale(0.96) rotateZ(2deg);
}

@keyframes matchPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### **2. Sonidos (Web Audio API)**
```javascript
function playMatchSound() {
  const audio = new Audio('/sounds/match.mp3');
  audio.volume = 0.3;
  audio.play();
}

function playMissSound() {
  const audio = new Audio('/sounds/miss.mp3');
  audio.volume = 0.2;
  audio.play();
}
```

### **3. Partículas de celebración**
```javascript
// En resolvePair, si match:
if (isMatch) {
  // ...
  createConfetti(cardA.getBoundingClientRect());
  createConfetti(cardB.getBoundingClientRect());
}
```

### **4. Backend integration**
```javascript
async function finishMemoryRun() {
  const result = {
    memory_run_id: currentRunId,
    grade: memoryGrade,
    passed: attempts <= maxAttempts,
    pairs: matches,
    attempts: attempts,
    score: score,
    max_streak: maxStreakSeen
  };
  
  const response = await fetch('/api/memory/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  });
  
  const data = await response.json();
  // Servidor retorna: unlocks, rewards, mmr_change
}
```

---

## 🎓 **Principios aplicados (para mantener)**

1. **Separación clara de responsabilidades**
   - HTML: estructura
   - CSS: presentación
   - JS: lógica

2. **Estado predecible**
   - Todo el estado en variables claras
   - Cambios explícitos (no side effects ocultos)

3. **Funciones pequeñas**
   - Cada función hace UNA cosa
   - Nombres descriptivos

4. **Validaciones defensivas**
   - Verificar estado antes de actuar
   - Early returns para casos inválidos

5. **Invariantes garantizados**
   - Score ≥ 0 siempre
   - revealedCards.length ≤ 2 siempre
   - Pending siempre 0 o 2

---

**Última actualización:** Enero 2025 (post-estabilización)  
**Estado:** Nivel 1 funcional y estable  
**Próxima evolución:** Separación lógica/UI (Fase 2)
