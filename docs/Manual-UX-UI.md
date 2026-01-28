# KYNDO — MANUAL UX/UI TÉCNICO (MVP)

Documento técnico que define **cómo se manifiesta el sistema KYNDO al jugador**. No es diseño gráfico ni branding. Es **lógica de interfaz, estados y transiciones**, estrictamente alineado con la **BD v1.2** y el **Manual Técnico v1.2**.

**Regla base:** Si una pantalla o acción no está aquí, no existe en el MVP.

---

## 0. Principios UX no negociables

- UX al servicio de la **cognición**, no del espectáculo
- Todo estado del sistema debe tener **representación visual clara**
- Ningún dato se muestra si no existe en BD
- Ninguna acción del usuario altera directamente la verdad (server-only)

---

## 1. Mapa de pantallas del MVP

**Pantallas permitidas:**

1. **Home**
2. **Memory** (Nivel 1)
3. **Colección**
4. **Combate A/D**
5. **Resultado**

**Pantallas NO permitidas en MVP:**
- Tienda
- Packs
- Social
- Configuración avanzada
- Tutorial interactivo

---

## 2. Pantalla: Home

### Objetivo

- Mostrar estado actual del jugador
- Permitir acceso a modos disponibles

### Datos requeridos (BD)
```sql
SELECT 
  ps.active_domain,
  ps.mmr,
  ps.league,
  pss.state
FROM player_state ps
JOIN player_session_state pss ON ps.player_id = pss.player_id
WHERE ps.player_id = ?
```

### Elementos de UI

- **Dominio activo** (nombre + icono)
- **MMR / Liga** (si aplicable)
- **Botón: Jugar Memory** (habilitado si `state = idle`)
- **Botón: Combate A/D** (habilitado si `state = idle`)
- **Botón: Ver Colección** (siempre habilitado)

### Acciones permitidas

- Entrar a Memory (si `state = idle`)
- Entrar a Combate (si `state = idle`)
- Ver Colección

### Acciones bloqueadas en MVP

- Cambiar dominio activo
- Acceder a modos no desbloqueados
- Configuración avanzada

---

## 3. Pantalla: Memory (Nivel 1)

### Objetivo

- Ejecución del juego cognitivo
- Progresión y desbloqueo de cartas

### Estados del jugador

- **Al entrar:** `player_session_state.state = in_memory`
- **Al salir:** `player_session_state.state = idle`

### Datos requeridos (BD)
```sql
-- Al iniciar run
INSERT INTO memory_runs (player_id, level, card_count, dense_mode, seed)
VALUES (?, 1, 20, false, ?);

-- Consultar progreso
SELECT * FROM memory_progress WHERE player_id = ? AND object_id IN (...);

-- Consultar estado de cartas
SELECT * FROM player_card_state WHERE player_id = ? AND card_id IN (...);

-- Obtener imágenes
SELECT * FROM object_images WHERE object_id IN (...);
```

### Layout

**Componentes:**

1. **Header (HUD)**
   - Pares encontrados / total
   - Intentos usados / máximo
   - Racha actual
   - Puntaje

2. **Tablero (grid dinámico)**
   - Cartas en grid `n×m` (calculado: `ceil(sqrt(totalCards))`)
   - Gap entre cartas: 7px
   - Padding del board: 8px

3. **Overlay de foco**
   - Carta grande (70-80% de pantalla)
   - Fondo oscuro semitransparente
   - Click en overlay → cierra foco

4. **Pantalla de resultado**
   - Título (Superado / No superado)
   - Resumen de métricas
   - Botones de acción

### Estados visuales de carta (obligatorios)

| Estado | Visual | Interacción |
|--------|--------|-------------|
| `hidden` | Gris (#bdbdbd), letra "K" tenue | Clickeable |
| `revealed` | Blanco (#fff), borde sólido | No clickeable (temporal) |
| `pending` | Gris claro (#e8e8e8), borde punteado | Requiere limpieza |
| `matched` | Gris (#f1f1f1), borde grueso, opacidad 0.65, escala 0.96 | No clickeable (permanente) |

**CSS de referencia:**
```css
.card.hidden { background: #bdbdbd; cursor: pointer; }
.card.revealed { background: #fff; border: 1px solid #999; }
.card.pending { background: #e8e8e8; border: 1px dashed #aaa; }
.card.matched { 
  background: #f1f1f1; 
  border: 2px solid #aaa; 
  opacity: 0.65; 
  pointer-events: none; 
  transform: scale(0.96);
}
```

### Flujo de interacción
```
1. Usuario entra a Memory
   ↓
2. Servidor crea memory_run con seed
   ↓
3. Cliente genera tablero determinístico
   ↓
4. Usuario click en carta → revealed + overlay
   ↓
5. Click en overlay → cierra foco
   ↓
6. Si hay 2 reveladas → resolvePair()
   ↓
7a. Match → matched (permanente)
7b. No match → pending (temporal)
   ↓
8. Si pending: click limpia → hidden
   ↓
9. Repetir hasta completar todos los pares
   ↓
10. Pantalla de resultado
```

### Transiciones

- **Éxito (dentro del límite):** 
  - Pantalla de "Nivel superado"
  - Botón "Continuar" → siguiente grado
  - Botón "Reintentar (opcional)" → mismo grado

- **Fallo (excedió límite):**
  - Pantalla de "Nivel completado, pero no superado"
  - Botón "Reintentar" → mismo grado
  - Botón "Cerrar" → queda en tablero terminado

- **Abandono:**
  - Volver a Home
  - Sin pérdida de progreso previo
  - Estado vuelve a `idle`

---

## 3.5 Configuración de nomenclatura de cartas

### Objetivo

Permitir al usuario personalizar el orden de nombres en las cartas según su preferencia (científico, inglés o colombiano como título principal).

### Ubicación en UI

**Opción A (Recomendada):** Settings → Display Preferences → Card Name Format

**Opción B:** Dentro de la pantalla Colección → botón de engranaje (⚙️)

---

### Datos requeridos (BD)
```sql
-- Nueva columna en player_state
ALTER TABLE player_state 
ADD COLUMN card_name_format VARCHAR(20) NOT NULL DEFAULT 'scientific'
CHECK (card_name_format IN ('scientific', 'english', 'colombian'));

-- Query para leer preferencia
SELECT card_name_format 
FROM player_state 
WHERE player_id = ?;
```

---

### Opciones disponibles

| Formato | Título principal | Subtítulo 1 | Subtítulo 2 | Ejemplo |
|---------|-----------------|-------------|-------------|---------|
| `scientific` | Nombre científico | Inglés | Colombiano | **AQUILA CHRYSAETOS**<br>Golden Eagle<br>Águila Real |
| `english` | Inglés | Científico | Colombiano | **GOLDEN EAGLE**<br>Aquila chrysaetos<br>Águila Real |
| `colombian` | Colombiano | Científico | Inglés | **ÁGUILA REAL**<br>Aquila chrysaetos<br>Golden Eagle |

---

### UI de configuración

**Pantalla de Settings:**
```
┌────────────────────────────────────┐
│ CONFIGURACIÓN DE CARTAS            │
├────────────────────────────────────┤
│                                    │
│ Formato de nombres:                │
│                                    │
│ ○ Nombre científico (por defecto) │
│   Título: Aquila chrysaetos        │
│   Subtítulos: Golden Eagle /       │
│               Águila Real          │
│                                    │
│ ○ Nombre en inglés                │
│   Título: Golden Eagle             │
│   Subtítulos: Aquila chrysaetos /  │
│               Águila Real          │
│                                    │
│ ○ Nombre común en Colombia        │
│   Título: Águila Real              │
│   Subtítulos: Aquila chrysaetos /  │
│               Golden Eagle         │
│                                    │
│ [Vista previa de carta]            │
│                                    │
│ [Guardar] [Cancelar]               │
└────────────────────────────────────┘
```

---

### Lógica de aplicación

**Frontend (JavaScript/Flutter):**
```javascript
function renderCardNames(card, userPreference) {
  const names = {
    scientific: card.scientific_name,
    english: card.english_name,
    colombian: card.colombian_name
  };
  
  let title, subtitle1, subtitle2;
  
  switch(userPreference) {
    case 'scientific':
      title = names.scientific;
      subtitle1 = names.english;
      subtitle2 = names.colombian;
      break;
      
    case 'english':
      title = names.english;
      subtitle1 = names.scientific;
      subtitle2 = names.colombian;
      break;
      
    case 'colombian':
      title = names.colombian;
      subtitle1 = names.scientific;
      subtitle2 = names.english;
      break;
      
    default:
      title = names.scientific; // fallback
      subtitle1 = names.english;
      subtitle2 = names.colombian;
  }
  
  return {
    title: title.toUpperCase(), // título siempre en mayúsculas
    subtitle1: subtitle1,
    subtitle2: subtitle2
  };
}
```

---

### CSS/Styling
```css
.card-name-section {
  background: rgba(0, 0, 0, 0.85);
  padding: 12px;
  text-align: center;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #E0E0E0;
  line-height: 1.3;
}

.card-subtitle:first-of-type {
  font-style: italic; /* científico siempre en cursiva cuando es subtítulo */
  opacity: 0.9;
}
```

---

### Persistencia

**Al cambiar la preferencia:**
```javascript
async function updateCardNameFormat(playerId, newFormat) {
  // Actualizar en BD
  await fetch('/api/player/settings', {
    method: 'PATCH',
    body: JSON.stringify({
      player_id: playerId,
      card_name_format: newFormat
    })
  });
  
  // Actualizar localStorage (cache)
  localStorage.setItem('kyndo_card_name_format', newFormat);
  
  // Re-renderizar todas las cartas visibles
  refreshAllCards();
}
```

**Al cargar la app:**
```javascript
async function loadUserPreferences(playerId) {
  // Intentar desde localStorage primero (offline-first)
  let format = localStorage.getItem('kyndo_card_name_format');
  
  if (!format) {
    // Si no existe, obtener del servidor
    const response = await fetch(`/api/player/${playerId}/state`);
    const data = await response.json();
    format = data.card_name_format || 'scientific';
    
    // Guardar en cache
    localStorage.setItem('kyndo_card_name_format', format);
  }
  
  return format;
}
```

---

### Reglas de negocio

1. **Valor por defecto:** `scientific` (nombre científico como título)
2. **Cambio en tiempo real:** Al cambiar la preferencia, todas las cartas visibles se actualizan inmediatamente
3. **Sin recarga:** No requiere recargar la página
4. **Persistencia:** Se guarda en BD y en localStorage
5. **Sincronización:** Al cambiar de dispositivo, mantiene la preferencia
6. **Vista previa:** Mostrar ejemplo de carta antes de guardar

---

### Acciones permitidas

- ✅ Cambiar formato en cualquier momento
- ✅ Ver vista previa antes de aplicar
- ✅ Aplicar cambio sin cerrar sesión

### Acciones bloqueadas

- ❌ No se puede tener formatos diferentes por carta (global por usuario)
- ❌ No afecta a otros jugadores (preferencia personal)

---

### Casos de uso

**Caso 1: Ornitólogo profesional**
- Prefiere: `scientific`
- Razón: Nomenclatura científica es universal y precisa

**Caso 2: Observador de aves recreativo (inglés)**
- Prefiere: `english`
- Razón: Nombres en inglés son más reconocibles internacionalmente

**Caso 3: Pajarero colombiano**
- Prefiere: `colombian`
- Razón: Nombres comunes en español son más familiares localmente

---

### Testing

**Escenarios a probar:**

1. **Cambio de formato:**
   - Usuario cambia de `scientific` a `english`
   - Verificar que todas las cartas en colección se actualizan
   - Verificar que las cartas en Memory se actualizan
   - Verificar que el cambio persiste al recargar

2. **Primera vez:**
   - Usuario nuevo sin preferencia
   - Verificar que defaults a `scientific`

3. **Sincronización:**
   - Usuario cambia preferencia en web
   - Verifica que se sincroniza en móvil

4. **Offline:**
   - Usuario sin conexión
   - Verifica que usa valor de localStorage
   - Al reconectar, sincroniza con servidor

---

## 4. Pantalla: Colección

### Objetivo

- Visualizar progreso del jugador
- Consultar cartas desbloqueadas

### Datos requeridos (BD)
```sql
SELECT 
  pcs.state,
  c.card_id,
  c.type,
  c.rarity,
  o.object_id,
  o.common_name,
  o.scientific_name,
  oi.image_path
FROM player_card_state pcs
JOIN cards c ON pcs.card_id = c.card_id
JOIN objects o ON c.object_id = o.object_id
LEFT JOIN object_images oi ON o.object_id = oi.object_id
WHERE pcs.player_id = ?
ORDER BY o.common_name;
```

### Reglas de visualización

| Estado | Visual | Información mostrada |
|--------|--------|---------------------|
| `hidden` | Silueta / placeholder | Nombre oculto, imagen oculta |
| `discovered` | Arte básico (variante 0) | Nombre común, sin factores |
| `unlocked` | Arte completo + borde activo | Nombre común/científico, factores (si es carta B) |
| `temporary_owned` | Arte + overlay temporal (reloj) | Mismo que unlocked + tiempo restante |

**Regla crítica:** No se muestran factores numéricos internos (P/S/W/H/A ni AD/C/E/SD/R) a menos que la carta sea tipo B o C desbloqueada.

### Acciones permitidas

- **Scroll** (vertical)
- **Zoom de carta** (modal, misma UI que overlay de Memory)
- **Filtrar por rareza** (opcional MVP)

### Acciones bloqueadas en MVP

- Editar cartas
- Intercambiar cartas
- Comprar cartas
- Comparar con otros jugadores

---

## 5. Pantalla: Combate A/D

### Objetivo

- Ejecutar duelos estructurados por rondas

### Estados del jugador

- **Entrada:** `player_session_state.state = in_battle`
- **Salida:** `player_session_state.state = idle`

### Datos requeridos (BD)
```sql
-- Matchmaking
SELECT player_id, mmr FROM player_state 
WHERE active_domain = ? AND player_id != ?
ORDER BY ABS(mmr - ?) LIMIT 1;

-- Crear batalla
INSERT INTO battles (domain_id, ruleset_id, status)
VALUES (?, (SELECT ruleset_id FROM rulesets ORDER BY created_at DESC LIMIT 1), 'open');

-- Registrar participantes
INSERT INTO battle_participants (battle_id, player_id, attack_value, defense_value)
VALUES (?, ?, calculated_attack, calculated_defense);

-- Consultar ronda actual
SELECT * FROM battle_rounds WHERE battle_id = ? ORDER BY round_number DESC LIMIT 1;
```

### Reglas UX críticas

- **Mostrar solo valores A/D efectivos** (post-cálculo)
- **No mostrar fórmulas ni factores internos**
- **Indicar ronda actual** (ej: "Ronda 1 de 3")
- **Estado del combate** (esperando, en progreso, resuelto)

### Layout sugerido
```
┌─────────────────────────────────┐
│  Ronda 1 de 3                   │
├─────────────────────────────────┤
│  TÚ           vs      OPONENTE  │
│  ┌─────────┐        ┌─────────┐ │
│  │ Carta   │        │ Carta   │ │
│  │ ATK: 67 │        │ ATK: 54 │ │
│  │ DEF: 72 │        │ DEF: 81 │ │
│  └─────────┘        └─────────┘ │
├─────────────────────────────────┤
│  [Confirmar selección]          │
└─────────────────────────────────┘
```

### Transiciones

- **Victoria:** Pantalla de resultado + ajuste MMR
- **Derrota:** Pantalla de resultado + ajuste MMR
- **Empate:** Pantalla de resultado, MMR sin cambio

---

## 6. Pantalla: Resultado

### Objetivo

- Feedback claro e inmediato sobre el desempeño

### Datos mostrados

**Para Memory:**
- Pares encontrados / total
- Intentos usados / máximo
- Puntaje final
- Racha máxima alcanzada
- Ascenso (sí/no)

**Para Battle:**
- Victoria / Derrota / Empate
- Rondas ganadas
- Cambio en MMR (±X)
- Cartas temporales ganadas (si aplica)

### Datos requeridos (BD)
```sql
-- Memory
SELECT * FROM memory_runs WHERE memory_run_id = ?;
SELECT * FROM memory_progress WHERE player_id = ? AND object_id IN (...);

-- Battle
SELECT * FROM battles WHERE battle_id = ?;
SELECT * FROM battle_rounds WHERE battle_id = ?;
SELECT * FROM player_state WHERE player_id = ? (para MMR actualizado);
```

### Reglas de presentación

- **Mostrar desbloqueos explícitamente** (ej: "Desbloqueaste 3 cartas tipo B")
- **Mostrar progreso acumulado** (ej: "Ahora tienes 15/21 pares en nivel experto")
- **No mostrar penalizaciones ocultas** (si hay cooldown, mostrarlo claramente)

### Acciones

- **Continuar** (si ascendió)
- **Reintentar** (siempre disponible)
- **Volver a Home**

---

## 7. Estados globales de UI

### Loading

- **Cuándo:** Esperando respuesta del servidor
- **Visual:** Spinner + mensaje contextual
- **Comportamiento:** Bloquea interacción, no altera estado

### Error

- **Cuándo:** Fallo de red, error del servidor, acción inválida
- **Visual:** Modal con mensaje claro
- **Comportamiento:** Reintento permitido, no cierra automáticamente

### Cooldown

- **Cuándo:** Penalización temporal activa
- **Visual:** Indicador de tiempo restante
- **Comportamiento:** Botón deshabilitado + timer visible

---

## 8. Seguridad UX

**Principios:**

- El cliente **no decide estados**
- Toda acción requiere confirmación del servidor
- El cliente solo refleja verdad persistida en BD

**Ejemplo de flujo seguro:**
```
Usuario click "Terminar nivel"
  ↓
Cliente envía: POST /memory/finish con memory_run_id
  ↓
Servidor calcula: éxito/fallo, desbloqueos, puntaje
  ↓
Servidor responde: { passed: true, unlocks: [...], score: 120 }
  ↓
Cliente muestra resultado según respuesta
```

**Anti-patrón (PROHIBIDO):**
```
Usuario click "Terminar nivel"
  ↓
Cliente calcula: "pasé porque usé 20 intentos de 22"
  ↓
Cliente muestra: "Nivel superado"
  ↓
Cliente envía: POST /memory/finish con { passed: true }
```

---

## 9. Mapeo UX → BD (resumen)

| Pantalla | Tablas principales |
|----------|-------------------|
| Home | `player_state`, `player_session_state` |
| Memory | `memory_runs`, `memory_progress`, `player_card_state`, `object_images` |
| Colección | `player_card_state`, `cards`, `objects`, `object_images` |
| Combate | `battles`, `battle_participants`, `battle_rounds`, `player_state` |
| Resultado | Todas las anteriores según contexto |

---

## 10. Responsive (mobile-first)

### Breakpoints sugeridos

- **Mobile:** < 600px
- **Tablet:** 600px - 900px
- **Desktop:** > 900px

### Adaptaciones clave

**Memory:**
- Mobile: Grid dinámico según `gradeConfig`, cartas ~40-80px
- Tablet: Grid dinámico, cartas ~60-100px
- Desktop: Grid dinámico, cartas ~80-120px

**Overlay:**
- Mobile: 90vw × 88vh
- Tablet: 70vw × 80vh
- Desktop: 50vw × 70vh

**HUD:**
- Mobile: Compacto, iconos + números
- Desktop: Texto completo descriptivo

---

## Estado del documento

- **Versión:** v1.0
- **Dependencias:** BD v1.2, Manual Técnico v1.2
- **Rol:** Definir UX ejecutable del MVP
- **Última actualización:** Enero 2025

---

**Fin del Manual UX/UI v1.0**
