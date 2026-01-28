# Almacenamiento de Datos - KYNDO

## Estado Actual (MVP)

### 1. **Contenido de Aves (Cartas)**
📍 **Ubicación:** `/content/content/birds/pack-1.json`

```json
{
  "pack_id": "birds-pack-1",
  "assets": [
    {
      "id": 0,
      "title": "Halcón",
      "image_url": "../content/birds/halcon.webp"
    },
    ...
  ]
}
```

- Contiene la información de las aves (nombre, imagen)
- Formato JSON estático
- Se carga de forma asíncrona al iniciar el juego
- Ubicado en el repositorio para fácil mantenimiento

### 2. **Progreso del Jugador**
📍 **Ubicación:** `localStorage` del navegador

El juego guarda el progreso localmente usando `localStorage` con la clave `kyndo_memory_v1`:

```javascript
{
  "memoryGrade": 1,        // Grado actual del jugador (1-5)
  "score": 150,            // Puntuación acumulada
  "maxStreakSeen": 5       // Racha máxima alcanzada
}
```

**Archivo responsable:** `/frontend/game.js` (clase `GameState`)

**Funciones clave:**
- `loadProgress()` - Carga el progreso al iniciar
- `saveProgress()` - Guarda después de cada nivel completado
- `resetProgress()` - Limpia el progreso (reinicio)

### 3. **Base de Datos PostgreSQL (Futuro)**
📍 **Documentación:** `/docs/Esquema-BD.md`

La arquitectura de base de datos está **completamente documentada** pero **NO implementada aún**. Es para cuando se desarrolle el backend.

**Tablas principales planificadas:**
- `players` - Cuentas de usuario
- `player_state` - Estado del jugador (MMR, liga, dominio activo)
- `player_card_state` - Colección de cartas por jugador
- `memory_runs` - Historial de partidas
- `objects` - Catálogo de aves/objetos
- `cards` - Cartas del juego (tipos A/B/C)

**Motor:** PostgreSQL 14+

**Estado:** Solo documentación, no hay servidor de BD corriendo

---

## Arquitectura Actual vs Futura

### Actual (MVP - Solo Frontend)
```
Cliente (Navegador)
├── HTML/CSS/JS (frontend/)
├── Contenido JSON (content/content/birds/)
└── localStorage (progreso local)
```

**Ventajas:**
- ✅ Sin dependencias de servidor
- ✅ Funciona offline
- ✅ Desarrollo rápido
- ✅ Hosting simple (GitHub Pages, Netlify)

**Limitaciones:**
- ❌ Progreso no sincronizado entre dispositivos
- ❌ Sin sistema de usuarios
- ❌ Sin rankings globales
- ❌ Fácilmente hackeable

### Futuro (Con Backend)
```
Cliente (Navegador)
├── HTML/CSS/JS
└── API Calls

Servidor (Backend)
├── API REST (Node.js/Python)
├── PostgreSQL (Base de datos)
└── Autenticación (JWT/OAuth)

Contenido
└── CDN para imágenes
```

**Beneficios:**
- ✅ Sincronización multi-dispositivo
- ✅ Sistema de usuarios y autenticación
- ✅ Rankings y competencia
- ✅ Server-authoritative (anti-cheating)
- ✅ Analytics y telemetría

---

## Cómo Funciona Actualmente

### 1. Al Cargar el Juego
```javascript
// 1. Cargar contenido de aves
const response = await fetch('../content/content/birds/pack-1.json');
const data = await response.json();
// Ahora tenemos las aves disponibles

// 2. Cargar progreso del jugador
const saved = localStorage.getItem('kyndo_memory_v1');
const progress = JSON.parse(saved);
// Ahora sabemos en qué grado está el jugador
```

### 2. Durante el Juego
- Las cartas se generan con IDs (0-9 para 10 aves)
- Se mezclan aleatoriamente (Fisher-Yates shuffle)
- El estado del juego se mantiene en memoria (clase `GameState`)
- No se comunica con ningún servidor

### 3. Al Completar un Nivel
```javascript
// Guardar progreso actualizado
localStorage.setItem('kyndo_memory_v1', JSON.stringify({
  memoryGrade: newGrade,
  score: finalScore,
  maxStreakSeen: maxStreak
}));
```

---

## Migración Futura a Backend

Cuando se implemente el backend, la transición será:

### Fase 1: Dual Mode
- El juego funcionará con o sin conexión
- Si hay conexión → guarda en servidor
- Si no hay conexión → guarda en localStorage
- Sincroniza cuando recupera conexión

### Fase 2: Backend Obligatorio
- Requiere cuenta de usuario
- Todo se guarda en servidor
- Cliente solo valida UX, servidor valida lógica
- Implementa sistema de ligas y ranking

### Implementación Recomendada
Ver documentación completa en:
- `/docs/Esquema-BD.md` - Esquema de base de datos
- `/docs/Checklist-Endpoints.md` - API endpoints necesarios
- `/docs/Manual-Tecnico.md` - Arquitectura técnica

---

## Para Desarrolladores

### Añadir Más Aves
1. Edita `/content/content/birds/pack-1.json`
2. Añade nuevos objetos al array `assets`:
```json
{
  "id": 10,
  "title": "Colibrí",
  "image_url": "../content/birds/colibri.webp"
}
```
3. Coloca la imagen en `/content/birds/`
4. El juego las cargará automáticamente

### Añadir Más Dominios (Futuro)
Cuando se tenga más contenido:
1. Crear `/content/content/fauna/pack-1.json`
2. Crear `/content/content/transport/pack-1.json`
3. Modificar `CONTENT_PATH` en `game.js` para seleccionar dominio

### Limpiar Progreso del Jugador
```javascript
// Desde consola del navegador:
localStorage.removeItem('kyndo_memory_v1');
location.reload();
```

---

## Preguntas Frecuentes

### ¿Dónde está la base de datos?
**R:** No hay base de datos actualmente. El MVP usa `localStorage` del navegador. La base de datos PostgreSQL está documentada en `/docs/Esquema-BD.md` para implementación futura con backend.

### ¿Cómo añado más cartas?
**R:** Edita `/content/content/birds/pack-1.json` y añade más objetos al array.

### ¿Se pierden los datos al cambiar de navegador?
**R:** Sí, actualmente el progreso está en `localStorage` que es por navegador. En el futuro con backend, se sincronizará entre dispositivos.

### ¿Puedo ver mi progreso guardado?
**R:** Sí, abre la consola del navegador (F12) y escribe:
```javascript
JSON.parse(localStorage.getItem('kyndo_memory_v1'))
```

### ¿Cuándo se implementará el backend?
**R:** Está planificado para después del MVP. Ver `/docs/Roadmap-MVP.md`.

---

**Última actualización:** Enero 2025
**Documento:** DATA_STORAGE.md v1.0
