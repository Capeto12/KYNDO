# KYNDO — CHECKLIST DE ENDPOINTS / APIs (MVP)

Checklist técnico derivado **directamente** del Manual UX/UI Técnico (MVP), la BD v1.2 y el Manual Técnico v1.2.

**Regla:** Si un endpoint no está aquí, no existe en el MVP.

**Convención:**
- Todos los endpoints son **server-authoritative**
- El cliente nunca envía valores calculados
- Autenticación requerida salvo indicación explícita

---

## 0. Autenticación / Sesión

### POST `/auth/login`

**Propósito:** Crear o validar jugador y sesión

**Request:**
```json
{
  "email": "user@example.com",
  "provider": "email" | "google" | "apple"
}
```

**Response:**
```json
{
  "player_id": "uuid",
  "token": "jwt_token",
  "session": {
    "player_id": "uuid",
    "state": "idle",
    "active_domain": "uuid",
    "mmr": 1000,
    "league": "bronze"
  }
}
```

**Acciones server-side:**
1. Crea o valida `players`
2. Inicializa `player_state` si no existe
3. Inicializa `player_wallet` si no existe
4. Crea/actualiza `player_session_state` → `idle`
5. Retorna token de sesión

**Errores:**
- `400` — Email inválido
- `401` — Provider no autorizado
- `500` — Error de BD

---

### POST `/auth/logout`

**Propósito:** Cerrar sesión activa

**Request:**
```json
{
  "player_id": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Acciones server-side:**
1. Limpia `player_session_state` → `idle`
2. Invalida token (blacklist)

**Errores:**
- `401` — Token inválido

---

## 1. Home

### GET `/home`

**Propósito:** Obtener estado actual del jugador para pantalla Home

**Usado por:** Pantalla Home

**Request:** Headers con `Authorization: Bearer {token}`

**Response:**
```json
{
  "player": {
    "player_id": "uuid",
    "email": "user@example.com"
  },
  "state": {
    "active_domain": "uuid",
    "active_domain_name": "Aves",
    "mmr": 1000,
    "league": "bronze",
    "session_state": "idle"
  },
  "available_modes": {
    "memory": true,
    "battle": true,
    "collection": true
  }
}
```

**Acciones server-side:**
- Lee `player_state.active_domain`
- Lee `player_state.mmr`
- Lee `player_state.league`
- Lee `player_session_state.state`
- No modifica estado

**Errores:**
- `401` — No autenticado
- `404` — Jugador no encontrado

---

## 2. Memory

### POST `/memory/start`

**Propósito:** Iniciar una partida de Memory

**Usado por:** Pantalla Memory al entrar

**Request:**
```json
{
  "player_id": "uuid",
  "grade": 1
}
```

**Response:**
```json
{
  "memory_run_id": "uuid",
  "level": 1,
  "grade": 1,
  "card_count": 20,
  "max_attempts": 22,
  "seed": "random_seed_string",
  "dense_mode": false
}
```

**Acciones server-side:**
1. Verifica `player_session_state = idle`
2. Crea `memory_runs` con:
   - `memory_run_id` (nuevo UUID)
   - `player_id`
   - `level = 1` (hardcoded MVP)
   - `card_count` según `gradeConfig[grade]`
   - `dense_mode = card_count >= 80`
   - `seed` (generado aleatoriamente)
3. Cambia `player_session_state.state` → `in_memory`
4. Actualiza `player_session_state.context_id` → `memory_run_id`
5. Retorna configuración inicial del tablero

**Errores:**
- `400` — Grade inválido (no existe en config)
- `409` — Jugador ya está en partida (`state != idle`)
- `500` — Error de BD

---

### POST `/memory/flip`

**Propósito:** Registrar interacción durante Memory (opcional, para telemetría)

**Usado por:** Interacción durante Memory (click en carta)

**Nota:** Este endpoint es OPCIONAL en MVP. Solo si se quiere telemetría granular.

**Request:**
```json
{
  "memory_run_id": "uuid",
  "card_index": 5,
  "timestamp": "2025-01-27T10:30:00Z"
}
```

**Response:**
```json
{
  "acknowledged": true
}
```

**Acciones server-side:**
- Valida `memory_run_id`
- Registra evento en `event_log` (tipo: `memory_flip`)
- NO altera lógica del juego

**Errores:**
- `404` — Run no encontrado

**Decisión MVP:** Probablemente NO implementar (overhead innecesario).

---

### POST `/memory/finish`

**Propósito:** Finalizar partida de Memory y calcular resultado

**Usado por:** Fin de Memory (cuando se completan todos los pares o se abandona)

**Request:**
```json
{
  "memory_run_id": "uuid",
  "pairs_found": 10,
  "attempts_used": 18,
  "score": 125,
  "max_streak": 5,
  "time_elapsed_ms": 180000
}
```

**Response:**
```json
{
  "result": {
    "passed": true,
    "pairs_found": 10,
    "total_pairs": 10,
    "attempts_used": 18,
    "max_attempts": 22,
    "score": 125,
    "max_streak": 5
  },
  "unlocks": [
    {
      "card_id": "uuid",
      "type": "B",
      "object_name": "Águila Real"
    }
  ],
  "progression": {
    "current_grade": 1,
    "next_grade": 2,
    "can_advance": true
  },
  "rewards": {
    "soft_currency": 50
  }
}
```

**Acciones server-side:**

1. **Validar datos:**
   - `memory_run_id` existe
   - `pairs_found ≤ totalPairs`
   - `attempts_used` es razonable (anti-cheat básico)

2. **Calcular resultado:**
```javascript
   const passed = (
     pairs_found === totalPairs && 
     attempts_used <= maxAttempts
   );
```

3. **Actualizar `memory_progress`:**
   - Incrementar `attempts_total`
   - Incrementar `fails_total` si NO pasó
   - Actualizar `level_completed` si pasó
   - Actualizar `last_played_at`

4. **Desbloquear cartas (si aplica):**
   - Consultar lógica de desbloqueo
   - Actualizar `player_card_state` (hidden → discovered/unlocked)
   - Retornar lista de desbloqueos

5. **Actualizar economía:**
   - `player_wallet.soft_currency += reward`

6. **Cambiar sesión:**
   - `player_session_state.state` → `idle`
   - `player_session_state.context_id` → `NULL`

7. **Registrar evento:**
   - `event_log` con tipo `memory_finish`
   - Payload completo del resultado

8. **Retornar resultado completo**

**Errores:**
- `400` — Datos inválidos (pares > total, attempts negativos, etc.)
- `404` — Run no encontrado
- `409` — Run ya finalizado (idempotencia)

**Anti-cheat básico:**
```javascript
// Server-side validation
const minAttempts = pairs_found; // perfecto
const maxReasonableAttempts = totalPairs * 5; // generoso

if (attempts_used < minAttempts || 
    attempts_used > maxReasonableAttempts) {
  return 400; // datos sospechosos
}

const maxReasonableScore = totalPairs * 50; // muy generoso
if (score > maxReasonableScore) {
  return 400; // score imposible
}
```

---

## 3. Colección

### GET `/collection`

**Propósito:** Obtener estado de la colección del jugador

**Usado por:** Pantalla Colección

**Request:** Headers con `Authorization: Bearer {token}`

**Query params (opcional):**
- `?filter=rarity` → Filtrar por rareza
- `?filter=discovered` → Solo cartas descubiertas

**Response:**
```json
{
  "cards": [
    {
      "card_id": "uuid",
      "object_id": "uuid",
      "type": "A",
      "rarity": "common",
      "state": "unlocked",
      "object": {
        "common_name": "Águila Real",
        "scientific_name": "Aquila chrysaetos"
      },
      "images": [
        {
          "variant_index": 0,
          "image_path": "/assets/objects/aguila_real_0.webp"
        },
        {
          "variant_index": 1,
          "image_path": "/assets/objects/aguila_real_1.webp"
        }
      ]
    }
  ],
  "stats": {
    "total_cards": 150,
    "discovered": 45,
    "unlocked": 12,
    "hidden": 93
  }
}
```

**Acciones server-side:**
- Lee `player_card_state` WHERE `player_id = ?`
- JOIN con `cards`
- JOIN con `objects`
- LEFT JOIN con `object_images`
- Filtra según estado (no exponer cartas `hidden` completamente)
- No expone factores internos (A/D) a menos que carta sea tipo B/C unlocked

**Errores:**
- `401` — No autenticado

---

### GET `/collection/card/{card_id}`

**Propósito:** Obtener detalle de una carta específica (zoom)

**Usado por:** Zoom de carta en Colección

**Request:** Headers con `Authorization: Bearer {token}`

**Response:**
```json
{
  "card": {
    "card_id": "uuid",
    "object_id": "uuid",
    "type": "B",
    "rarity": "rare",
    "state": "unlocked",
    "object": {
      "common_name": "Águila Real",
      "scientific_name": "Aquila chrysaetos",
      "metadata": {
        "habitat": "Montañas",
        "diet": "Carnívoro"
      }
    },
    "images": [
      {
        "variant_index": 0,
        "image_path": "/assets/objects/aguila_real_0.webp"
      },
      {
        "variant_index": 1,
        "image_path": "/assets/objects/aguila_real_1.webp"
      }
    ],
    "factors": {
      "attack": {
        "p": 8.5,
        "s": 7.0,
        "w": 6.5,
        "h": 7.5,
        "a": 6.0
      },
      "defense": {
        "ad": 7.0,
        "c": 5.0,
        "e": 8.0,
        "sd": 4.0,
        "r": 6.5
      }
    }
  }
}
```

**Acciones server-side:**
- Valida propiedad / estado (jugador tiene acceso a esta carta)
- Retorna detalle permitido según estado:
  - `hidden` → 404 o minimal info
  - `discovered` → objeto + imágenes, SIN factores
  - `unlocked` → objeto + imágenes + factores (si es tipo B/C)
- Nunca retorna factores A/D internos si carta es tipo A

**Errores:**
- `401` — No autenticado
- `403` — Carta no accesible (hidden)
- `404` — Carta no existe

---

## 4. Combate A/D

### POST `/battle/matchmake`

**Propósito:** Buscar oponente y crear combate

**Usado por:** Entrar a Combate

**Request:**
```json
{
  "player_id": "uuid"
}
```

**Response:**
```json
{
  "battle_id": "uuid",
  "opponent": {
    "player_id": "uuid",
    "mmr": 1050,
    "league": "bronze"
  },
  "domain": {
    "domain_id": "uuid",
    "name": "Aves"
  },
  "ruleset": {
    "ruleset_id": "uuid",
    "version": "1.0.0"
  },
  "your_turn": true
}
```

**Acciones server-side:**

1. **Validar estado:**
   - Verifica `player_session_state = idle`

2. **Matchmaking:**
```sql
   SELECT player_id, mmr 
   FROM player_state 
   WHERE active_domain = ? 
     AND player_id != ?
     AND player_id NOT IN (SELECT player_id FROM player_session_state WHERE state != 'idle')
   ORDER BY ABS(mmr - ?) 
   LIMIT 1;
```
   - Tolerancia inicial: ±100 MMR
   - Si no hay match: bot o espera

3. **Crear batalla:**
```sql
   INSERT INTO battles (domain_id, ruleset_id, status)
   VALUES (?, (SELECT ruleset_id FROM rulesets ORDER BY created_at DESC LIMIT 1), 'open');
```

4. **Registrar participantes:**
```sql
   INSERT INTO battle_participants (battle_id, player_id, attack_value, defense_value)
   VALUES 
     (?, player1_id, calculated_attack_p1, calculated_defense_p1),
     (?, player2_id, calculated_attack_p2, calculated_defense_p2);
```
   **CRÍTICO:** Valores A/D calculados server-side, NUNCA por cliente.

5. **Cambiar sesión:**
   - Ambos jugadores: `player_session_state.state` → `in_battle`
   - `player_session_state.context_id` → `battle_id`

6. **Registrar evento:**
   - `event_log` tipo `battle_matchmake`

7. **Retornar batalla creada**

**Errores:**
- `409` — Jugador ya está en batalla
- `404` — No hay oponente disponible (timeout después de 30s)

---

### GET `/battle/{battle_id}`

**Propósito:** Obtener estado actual del combate

**Usado por:** Pantalla Combate

**Request:** Headers con `Authorization: Bearer {token}`

**Response:**
```json
{
  "battle": {
    "battle_id": "uuid",
    "status": "open",
    "domain": "Aves",
    "current_round": 1,
    "total_rounds": 3
  },
  "you": {
    "player_id": "uuid",
    "card": {
      "object_name": "Águila Real",
      "image": "/assets/objects/aguila_real_0.webp"
    },
    "attack_value": 67,
    "defense_value": 72
  },
  "opponent": {
    "player_id": "uuid",
    "card": {
      "object_name": "Halcón Peregrino",
      "image": "/assets/objects/halcon_0.webp"
    },
    "attack_value": 54,
    "defense_value": 81
  }
}
```

**Acciones server-side:**
- Lee estado actual del combate
- Retorna ronda activa
- Retorna valores A/D efectivos (POST-cálculo)
- NO retorna factores internos ni fórmulas

**Errores:**
- `404` — Batalla no encontrada
- `403` — Jugador no es participante

---

### POST `/battle/resolve`

**Propósito:** Resolver una ronda del combate

**Usado por:** Acción del jugador en ronda

**Request:**
```json
{
  "battle_id": "uuid",
  "round_number": 1,
  "selected_card_id": "uuid"
}
```

**Response:**
```json
{
  "round_result": {
    "winner": "player_1",
    "player_1_attack": 67,
    "player_1_defense": 72,
    "player_2_attack": 54,
    "player_2_defense": 81,
    "calculation": "attack_vs_defense"
  },
  "battle_status": "ongoing",
  "next_round": 2
}
```

**Acciones server-side:**

1. **Aplicar reglas con `ruleset_id`:**
```javascript
   const winner = determineWinner(
     p1_attack, p1_defense,
     p2_attack, p2_defense,
     ruleset
   );
```

2. **Crear `battle_rounds`:**
```sql
   INSERT INTO battle_rounds (battle_id, round_number, ruleset_id)
   VALUES (?, ?, ?);
```

3. **Actualizar estado del combate:**
   - Incrementar contador de rondas
   - Si ronda final → marcar batalla como `resolved`

4. **Registrar evento:**
   - `event_log` tipo `battle_resolve`

5. **Retornar resultado de la ronda**

**Errores:**
- `400` — Carta no seleccionada o inválida
- `409` — Ronda ya resuelta

---

### POST `/battle/finish`

**Propósito:** Finalizar combate y aplicar recompensas

**Usado por:** Fin del combate (después de todas las rondas)

**Request:**
```json
{
  "battle_id": "uuid"
}
```

**Response:**
```json
{
  "result": {
    "winner": "player_1",
    "rounds_won": {
      "player_1": 2,
      "player_2": 1
    }
  },
  "mmr_changes": {
    "player_1": +15,
    "player_2": -10
  },
  "rewards": {
    "soft_currency": 50,
    "temporary_cards": []
  }
}
```

**Acciones server-side:**

1. **Validar batalla:**
   - Verificar que todas las rondas están completas
   - Verificar que status = `resolved`

2. **Determinar ganador:**
   - Contar rondas ganadas por cada jugador

3. **Actualizar MMR:**
```sql
   UPDATE player_state 
   SET mmr = mmr + ? 
   WHERE player_id = ?;
```
   - Ganador: +15 MMR
   - Perdedor: -10 MMR (mínimo 0)

4. **Aplicar recompensas:**
   - Actualizar `player_wallet`
   - Si aplica: crear `player_card_state` temporal (Conquista)

5. **Cambiar sesión:**
   - Ambos jugadores: `player_session_state.state` → `idle`

6. **Registrar evento:**
   - `event_log` tipo `battle_finish`

7. **Retornar resultado final**

**Errores:**
- `409` — Batalla no completada
- `404` — Batalla no encontrada

---

## 5. Resultado

### GET `/result/{context_id}`

**Propósito:** Obtener resumen de resultado (Memory o Battle)

**Usado por:** Pantalla Resultado

**Request:** Headers con `Authorization: Bearer {token}`

**Query param:**
- `?type=memory` o `?type=battle`

**Response (Memory):**
```json
{
  "type": "memory",
  "result": {
    "passed": true,
    "pairs_found": 10,
    "total_pairs": 10,
    "attempts_used": 18,
    "max_attempts": 22,
    "score": 125,
    "max_streak": 5
  },
  "unlocks": [...],
  "progression": {...},
  "rewards": {...}
}
```

**Response (Battle):**
```json
{
  "type": "battle",
  "result": {
    "winner": "you",
    "rounds_won": 2,
    "total_rounds": 3
  },
  "mmr_change": +15,
  "rewards": {...}
}
```

**Acciones server-side:**
- Lee resultados de Memory (`memory_runs`) o Battle (`battles`)
- Retorna desbloqueos
- Retorna progreso acumulado

**Errores:**
- `404` — Resultado no encontrado

---

## 6. Seguridad y reglas duras

### **Regla 1: Server-authoritative**
- Ningún endpoint acepta valores calculados por cliente (score, attack, defense, etc.)
- El cliente solo envía acciones (start, flip, finish)
- El servidor calcula y retorna resultados

### **Regla 2: Validación de datos**
```javascript
// Ejemplo de validación server-side
function validateMemoryFinish(request) {
  const { pairs_found, attempts_used, score } = request;
  
  if (pairs_found > totalPairs) return false;
  if (attempts_used < pairs_found) return false; // imposible
  if (score > pairs_found * 50) return false; // score imposible
  
  return true;
}
```

### **Regla 3: Idempotencia**
- `POST /memory/finish` con mismo `memory_run_id` → retorna mismo resultado (no duplica recompensas)
- `POST /battle/finish` con mismo `battle_id` → retorna mismo resultado

### **Regla 4: Event logging**
Todos los cambios críticos se registran en `event_log`:
- `memory_start`, `memory_finish`
- `battle_matchmake`, `battle_resolve`, `battle_finish`
- `card_unlock`
- `currency_change`

### **Regla 5: Estados transaccionales**
Cambios de estado en `player_session_state` son atómicos:
```sql
BEGIN TRANSACTION;
  UPDATE player_session_state SET state = 'in_memory' WHERE player_id = ?;
  INSERT INTO memory_runs (...);
COMMIT;
```

---

## 7. Regla final

**Un endpoint solo se considera implementado si:**
1. ✅ Cumple su checklist completo
2. ✅ Está alineado con UX/UI definido
3. ✅ No introduce estados nuevos no documentados
4. ✅ Tiene validación server-side
5. ✅ Registra eventos críticos en `event_log`

**Este checklist es vinculante para el MVP.**

---

## Estado del documento

- **Versión:** v1.0
- **Dependencias:** Manual UX/UI Técnico v1.0, BD v1.2, Manual Técnico v1.2
- **Última actualización:** Enero 2025

---

**Fin del Checklist de Endpoints v1.0**
