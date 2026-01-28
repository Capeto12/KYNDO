# KYNDO — MANUAL TÉCNICO v1.2

Documento derivado del **KYNDO Manual Maestro v1.02**.

**Objetivo:** Traducir el diseño conceptual a **arquitectura técnica ejecutable**. Aquí no hay narrativa ni marketing. Solo estructura, estados y reglas.

---

## 1. Arquitectura general del sistema

### 1.1 Principio base

- Un solo backend lógico
- Un solo motor de reglas (**KYNDO Engine**)
- Dominios como **capas de filtrado**, no como juegos independientes

### 1.2 Separación de responsabilidades

- **Runtime (app):** Juego, memoria, combate, progresión
- **Content-time (offline / build):** Generación de cartas, imágenes, SVG y catálogo

**Regla dura:** Ninguna carta (SVG/arte) se genera dinámicamente en runtime.

---

## 2. Entidades principales (Base de Datos)

### 2.0 Reglas del catálogo

- Cada objeto debe tener **mínimo 2 imágenes** asociadas (tabla `object_images`).
- Las variantes visuales son requisito cognitivo (evitan memorización mecánica).
- Memory avanzado y experto consumen **variantes**, no duplicados.

### 2.1 Dominio

**Tabla:** `domains`
```
- domain_id (PK)
- name (unique)
- status (active / inactive)
```

### 2.2 Objeto

**Tabla:** `objects`
```
- object_id (PK)
- domain_id (FK)
- scientific_name
- common_name
- metadata (jsonb)
```

**Regla:** Un objeto existe **una sola vez** en el sistema.

### 2.3 Cartas

**Tabla:** `cards`
```
- card_id (PK)
- object_id (FK)
- type (A | B | C)
- rarity
- metadata (jsonb)
```

**Constraint:** `unique(object_id, type)`

**Reglas críticas:**
- `Card` es entidad **global y sin estado**.
- El estado vive exclusivamente en `player_card_state`.
- Estados posibles: `hidden | discovered | unlocked | temporary_owned`

### 2.4 Imágenes de objeto

**Tabla:** `object_images`
```
- image_id (PK)
- object_id (FK)
- variant_index (int)
- image_path
- format (png | webp)
- source (ia | fotografía | ilustración)
```

**Constraint:** `unique(object_id, variant_index)`

**Regla mínima:** ≥2 filas por `object_id`

### 2.5 Atributos A/D

**Tabla:** `attack_factors`
```
- object_id (PK, FK)
- p, s, w, h, a (0–10)
```

**Tabla:** `defense_factors`
```
- object_id (PK, FK)
- ad, c, e, sd, r (0–10)
```

**Check constraint:** Todos los factores ∈ [0, 10]

---

## 3. Motor A/D (KYNDO Engine)

### 3.1 Versionado de reglas (fuente de verdad)

**Tabla:** `rulesets`
```
- ruleset_id (PK)
- version (semver, unique)
- weights_attack (jsonb)
- weights_defense (jsonb)
- normalization_method
- rounding_method
- created_at
```

**Regla crítica:**
- Todo cálculo A/D usa un `ruleset_id`.
- Los eventos históricos siempre se interpretan con el `ruleset_id` vigente en el momento del evento.
- Los rulesets **no se borran**, solo se agregan.

### 3.2 Cálculo base
```
1. Suma ponderada de factores:
   Attack_raw = Σ(factor × weight)

2. Normalización a [0, 99]:
   Attack = normalize(Attack_raw)

3. Redondeo estándar (half-up)
```

El valor base **no cambia** salvo actualización de versión (nuevo `RuleSet`).

### 3.3 Modificadores

**Orden de aplicación:**
1. **Base** (factores × pesos)
2. **Entorno** (porcentual, ej: +15% en bosque)
3. **Habilidad** (delta discreto, ej: +5 attack)

---

## 4. Estados del jugador

**Tabla:** `player_state`
```
- player_id (PK, FK)
- active_domain (FK → domains)
- mmr (int)
- league (string)
```

**Tabla:** `player_session_state`
```
- player_id (PK, FK)
- state (idle | in_memory | in_battle)
- context_id (nullable: memory_run_id / battle_id)
- updated_at
```

### 4.1 Progreso cognitivo

**Tabla:** `memory_progress`
```
- player_id (FK)
- object_id (FK)
- level_completed (int)
- attempts_total (int)
- fails_total (int)
- last_played_at
```

**PK compuesta:** `(player_id, object_id)`

### 4.2 Estado de cartas por jugador

**Tabla:** `player_card_state`
```
- player_id (FK)
- card_id (FK)
- state (hidden | discovered | unlocked | temporary_owned)
- expires_at (nullable, solo si temporary_owned)
- updated_at
```

**PK compuesta:** `(player_id, card_id)`

---

## 5. Memory Mode — Lógica técnica

### 5.1 Parámetros de nivel

**Tabla:** `memory_runs`
```
- memory_run_id (PK)
- player_id (FK)
- level (int: 1/2/3)
- card_count (int)
- dense_mode (boolean)
- seed (string, para reproducibilidad)
- created_at
```

**Nota sobre `dense_mode`:**
- Se activa típicamente cuando `card_count ≥ 80`.
- La transición focus/unfocus es principalmente UX.
- No requiere persistir el "zoom", pero `dense_mode` permite que el cliente aplique el flujo correcto.

### 5.2 Generación determinística (seed)

**Regla:** La generación del tablero es determinística por `seed` para:
- Replay
- Debugging
- Verificación de exploits

**Implementación:**
```javascript
// Pseudo-código
function generateBoard(seed) {
  const rng = seedRandom(seed);
  const cards = shuffle(objectIds, rng);
  return cards;
}
```

### 5.3 Estados visuales obligatorios

Todo estado debe ser **reconocible sin texto**:

| Estado | Visual | Significado |
|--------|--------|-------------|
| `hidden` | Carta oscurecida / reverso | Carta oculta, clickeable |
| `discovered` | Visible sin bonus | Carta conocida, sin desbloqueo completo |
| `unlocked` | Borde activo / resaltado | Carta desbloqueada, usable |
| `temporary_owned` | Overlay temporal (reloj/aura) | Posesión temporal (Conquista) |

### 5.4 Resultado del nivel

- **Success:** Desbloqueos según progreso
- **Failure:** Cooldown / reducción de intentos

**Regla:** No existe pérdida de progreso permanente.

---

## 6. Combate A/D

### 6.1 Matchmaking

- Basado en MMR
- Filtrado por dominio activo
- Tolerancia de ±100 MMR inicial, incrementa si no hay match

### 6.2 Modelo temporal

**Decisión técnica (conservadora):** Combate **asincrónico por rondas**.

**Razones:**
- Reduce dependencia de tiempo real
- Mejora escalabilidad
- Permite reconexión y tolera latencia

### 6.3 Estructura de combate

**Tabla:** `battles`
```
- battle_id (PK)
- domain_id (FK)
- ruleset_id (FK)
- status (open | resolved)
- created_at
```

**Tabla:** `battle_participants`
```
- battle_id (FK)
- player_id (FK)
- attack_value (calculado server-side)
- defense_value (calculado server-side)
```

**PK compuesta:** `(battle_id, player_id)`

**Tabla:** `battle_rounds`
```
- round_id (PK)
- battle_id (FK)
- round_number (int)
- ruleset_id (FK, puede cambiar por ronda)
- created_at
```

**Regla:** Cada ronda registra el `ruleset_id` usado para auditoría.

---

## 7. Economía

### 7.1 Recursos

**Tabla:** `player_wallet`
```
- player_id (PK, FK)
- soft_currency (int)
```

**Futuro:** `hard_currency` (opcional)

### 7.2 Fuente de verdad

**Regla crítica:** Economía **server-only** (autoridad del servidor).

El cliente:
- ❌ NUNCA envía valores de moneda
- ✅ SOLO solicita acciones (comprar, abrir pack)
- ✅ SOLO presenta el estado devuelto por servidor

### 7.3 Restricciones

- Límites diarios/semanales en `event_log`
- Rendimientos decrecientes por actividad repetida

---

## 8. IA y escalabilidad

### 8.1 Uso de IA (content-time)

- Generación de imágenes base (NanoBanana)
- Variantes visuales controladas
- Asignación inicial de factores A/D (propuesta, no definitiva)
- Detección de outliers en factores (offline)

### 8.2 Restricción crítica

**La IA NO interviene en:**
- Runtime
- Decisiones competitivas
- Cálculos de balance en vivo

**La IA es una herramienta de producción de contenido, no de juego.**

---

## 9. Versionado

**Regla de oro:** Los cambios en reglas requieren nueva versión de `ruleset`.

**Datos históricos preservados:** Los resultados históricos se interpretan con el `ruleset_id` vigente en el momento del evento, no con la versión actual.

**Ejemplo:**
```
Batalla del 2025-01-15 usó ruleset v1.0
→ Si consulto esa batalla en 2025-06-01 (ruleset v1.3 activo)
→ La recalculo con v1.0 para consistencia histórica
```

---

## 10. Pipeline técnico de generación de cartas (content-time)

### 10.1 Componentes

- **Marco SVG base:** Estructura, rareza por color, iconografía fija, tipografía, contenedores
- **Arte central IA:** Imágenes consistentes por objeto (≥2 variantes)
- **Catálogo maestro:** Fuente de verdad para componer cartas

### 10.2 Flujo recomendado
```
1. Diseñar/iterar el SVG base
   ↓
2. Ejecutar prompt maestro para generar 2+ variantes por objeto
   ↓
3. Optimizar assets (PNG 1024 → WebP)
   ↓
4. Registrar en catálogo (ids, rutas, metadatos)
   ↓
5. Componer carta (SVG + arte + textos) en build/content-time
   ↓
6. Importar a la app
   ↓
7. Pruebas de usabilidad
   ↓
8. Escalar
```

**Herramientas sugeridas:**
- SVG: Figma / Inkscape
- IA: NanoBanana / Stable Diffusion
- Optimización: squoosh.app / cwebp
- Catálogo: Scripts Python / Node.js

---

## 11. Reserva técnica — Conquista Temporal (post-MVP)

**Estado en BD:** `temporary_owned` (ya contemplado en esquema v1.2)

**Requisitos técnicos:**
- TTL por tiempo o partidas
- Campo `expires_at` en `player_card_state`
- Job/cron para expiración automática
- Indicador visual obligatorio en UI

**Implementación:**
```sql
-- Expirar cartas temporales
UPDATE player_card_state
SET state = 'hidden', expires_at = NULL
WHERE state = 'temporary_owned' AND expires_at < NOW();
```

**Estado:** No se implementa en MVP, pero la arquitectura está preparada.

---

## 12. Auditoría y seguridad

**Tabla:** `event_log`
```
- event_id (PK)
- player_id (FK)
- event_type (string)
- payload (jsonb)
- ruleset_id (nullable)
- created_at
```

**Eventos críticos a registrar:**
- `memory_start`, `memory_finish`
- `battle_matchmake`, `battle_resolve`, `battle_finish`
- `card_unlock`, `card_temporary_gain`
- `purchase`, `pack_open`

**Eventos opcionales (telemetría):**
- `memory_focus`, `memory_unfocus` (solo si quieres datos de uso)

**Uso:**
- Detección de anomalías
- Análisis de comportamiento
- Debugging de exploits
- Métricas de engagement

---

## Estado del documento

- **Versión:** v1.2
- **Dependencia:** Manual Maestro v1.02
- **Última actualización:** Enero 2025

**Cambios clave v1.2:**
- Separación runtime vs content-time explícita
- Regla mínima de variantes visuales (≥2)
- Pipeline técnico de generación documentado
- Estados visuales obligatorios definidos
- Reserva técnica para Conquista Temporal

---

**Fin del Manual Técnico v1.2**
