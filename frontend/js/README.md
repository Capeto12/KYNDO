# KYNDO Memory - Módulos JavaScript

Esta carpeta contiene los módulos JavaScript del juego Memory, organizados según los principios de arquitectura del proyecto.

## 📁 Estructura de Módulos

### `config.js`
**Propósito:** Configuración centralizada de todos los parámetros editables del juego.

**Exports:**
- `STREAK_BASE_BONUS` - Bono base por racha
- `REPEAT_MISS_EXTRA_ATTEMPTS` - Intentos extra por error repetido
- `REPEAT_MISS_POINT_PENALTY` - Penalización de puntos por error repetido
- `ATTEMPT_FACTOR` - Factor multiplicador para intentos máximos
- `MATCH_BASE_POINTS` - Puntos base por match
- `GRADE_CONFIG` - Configuración de cartas por grado
- `STORAGE_KEY` - Clave de almacenamiento local
- `RESULT_DELAY_MS` - Delay antes de mostrar resultado
- `CARD_STATES` - Nombres de estados de carta

**Modificaciones:** Este archivo se puede editar para ajustar el balance del juego. Ver `docs/BALANCE_PARAMETERS.md` para guía completa.

---

### `game-engine.js`
**Propósito:** Lógica pura del juego, sin dependencias del DOM.

**Exports:**
- `MemoryGameState` - Clase que gestiona el estado del juego
- `computeColumns()` - Calcula columnas del grid
- `canonicalPairKey()` - Genera clave única para pares
- `clampNonNegative()` - Asegura valores no negativos
- `buildObjectIds()` - Genera IDs mezclados para el tablero
- `calculateMaxAttempts()` - Calcula límite de intentos
- `calculateStreakBonus()` - Calcula bono por racha
- `isValidGrade()` - Valida un grado
- `getNextGrade()` - Obtiene el siguiente grado

**Características:**
- Funciones puras cuando sea posible
- Sin manipulación del DOM
- Testeable con unit tests
- Reutilizable en diferentes contextos

---

### `ui-renderer.js`
**Propósito:** Renderizado y manipulación del DOM.

**Exports:**
- `HUDRenderer` - Clase para actualizar el HUD
- `FocusOverlay` - Clase para el overlay de foco de carta
- `ResultOverlay` - Clase para el overlay de resultados
- `BoardRenderer` - Clase para gestionar el tablero
- `showResultWithDelay()` - Muestra resultado con delay

**Características:**
- Toda la interacción con el DOM está aquí
- Separado de la lógica del juego
- Fácil de testear visualmente
- Puede ser reemplazado por otros renderers (React, Vue, etc.)

---

### `storage.js`
**Propósito:** Gestión de persistencia del progreso.

**Exports:**
- `ProgressStorage` - Clase para manejar localStorage
- `progressStorage` - Instancia singleton

**Características:**
- Abstracción sobre localStorage
- Fácil migrar a backend en el futuro
- Manejo de errores robusto
- Métodos para cargar/guardar/limpiar progreso

---

### `game-controller.js`
**Propósito:** Orquestador principal que conecta lógica y presentación.

**Exports:**
- `MemoryGameController` - Clase controladora principal
- `initGame()` - Función de inicialización

**Características:**
- Coordina game-engine y ui-renderer
- Maneja eventos del usuario
- Gestiona el flujo del juego
- Punto de entrada principal

---

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  game-controller│  ← Punto de entrada
└────────┬────────┘
         │
         ├──→ game-engine.js    (lógica pura)
         │      └─→ config.js   (parámetros)
         │
         ├──→ ui-renderer.js    (presentación)
         │      └─→ config.js   (constantes)
         │
         └──→ storage.js        (persistencia)
                └─→ config.js   (keys)
```

## 🎯 Beneficios de esta Arquitectura

1. **Separación de Responsabilidades**
   - Lógica separada de presentación
   - Cada módulo tiene un propósito claro
   - Fácil de entender y mantener

2. **Testeable**
   - game-engine.js es 100% testeable
   - Funciones puras sin efectos secundarios
   - Mocks fáciles de crear para ui-renderer

3. **Reutilizable**
   - game-engine.js se puede usar en web, mobile, native
   - ui-renderer.js se puede reemplazar con React/Vue
   - storage.js se puede cambiar a backend sin tocar lógica

4. **Mantenible**
   - Cambios de balance solo en config.js
   - Bugs de lógica solo en game-engine.js
   - Bugs visuales solo en ui-renderer.js

5. **Escalable**
   - Fácil agregar nuevos modos de juego
   - Fácil agregar features (sonido, animaciones)
   - Preparado para migración a backend

## 🚀 Uso

### Importar en HTML
```html
<script type="module">
  import { initGame } from './js/game-controller.js';
  
  document.addEventListener('DOMContentLoaded', () => {
    initGame();
  });
</script>
```

### Usar módulos individualmente
```javascript
// Solo la lógica
import { MemoryGameState } from './game-engine.js';

const game = new MemoryGameState(1);
const result = game.resolvePair(3, 3);
console.log(result); // { isMatch: true, scoreChange: 10, ... }
```

## 📝 Próximas Mejoras

- [ ] Unit tests para game-engine.js
- [ ] Sistema de eventos (pub/sub) para desacoplar más
- [ ] Animaciones avanzadas en ui-renderer.js
- [ ] Soporte para múltiples idiomas
- [ ] Integración con backend API

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Estado:** Refactorización completada según ARCHITECTURE.md
