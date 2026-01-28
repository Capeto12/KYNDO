# KYNDO — CHECKLIST DE IMPLEMENTACIÓN POR TABLA (MVP)

Este documento sirve como **guía de ejecución directa para desarrollo backend**. Cada tabla tiene su checklist mínimo para considerarse **implementada correctamente**.

**Regla general:** Si un ítem no se cumple, la tabla **no está lista**.

---

## 0. Convenciones y herramientas

### **Testing de tablas**

Para cada tabla, ejecutar:
```sql
-- Validar estructura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'nombre_tabla';

-- Validar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'nombre_tabla';

-- Validar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'nombre_tabla';
```

### **Criterio de "Listo"**

Una tabla se considera lista si:
- ✅ Existe con el esquema correcto
- ✅ Todos los constraints funcionan
- ✅ Índices creados
- ✅ Datos de prueba insertados exitosamente
- ✅ Consultas básicas ejecutan sin error
- ✅ Foreign keys validan correctamente

---

## 1. CATÁLOGO GLOBAL

### ✅ `domains`

**Checklist:**

- [ ] Tabla creada con PK `domain_id` (UUID)
- [ ] Campo `name` con constraint UNIQUE
- [ ] Campo `status` con CHECK (active/inactive)
- [ ] Índice en `name`
- [ ] Índice parcial en `status WHERE status = 'active'`
- [ ] Al menos 1 dominio insertado (ej: "Aves")
- [ ] No permite `name` duplicado (error al intentar)

**Testing:**
```sql
-- Insertar dominio válido
INSERT INTO domains (name, status) VALUES ('Aves Test', 'active');

-- Debe fallar (nombre duplicado)
INSERT INTO domains (name, status) VALUES ('Aves Test', 'active');
-- Error esperado: duplicate key value violates unique constraint

-- Debe fallar (status inválido)
INSERT INTO domains (name, status) VALUES ('Fauna', 'pending');
-- Error esperado: violates check constraint

-- Validar índice
EXPLAIN SELECT * FROM domains WHERE name = 'Aves Test';
-- Debe usar Index Scan en idx_domains_name
```

**Datos mínimos:**
```sql
INSERT INTO domains (name, metadata) VALUES
    ('Aves', '{"icon": "🦅", "description": "Aves del mundo"}');
```

---

### ✅ `objects`

**Checklist:**

- [ ] Tabla creada con PK `object_id` (UUID)
- [ ] FK válida a `domains.domain_id` con ON DELETE RESTRICT
- [ ] Campos `scientific_name` y `common_name`
- [ ] Constraint CHECK que al menos uno de los nombres existe
- [ ] Índice en `domain_id`
- [ ] Índice en `scientific_name`
- [ ] Índice en `common_name`
- [ ] Al menos 10 objetos insertados en dominio "Aves"
- [ ] No se puede borrar dominio si tiene objetos

**Testing:**
```sql
-- Insertar objeto válido
INSERT INTO objects (domain_id, scientific_name, common_name, metadata) VALUES
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 
     'Aquila chrysaetos', 
     'Águila Real',
     '{"habitat": "Montañas"}');

-- Debe fallar (domain_id inválido)
INSERT INTO objects (domain_id, common_name) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Objeto Fantasma');
-- Error esperado: violates foreign key constraint

-- Debe fallar (ambos nombres NULL)
INSERT INTO objects (domain_id, metadata) VALUES
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), '{}');
-- Error esperado: violates check constraint "chk_has_name"

-- Intentar borrar dominio con objetos (debe fallar)
DELETE FROM domains WHERE name = 'Aves';
-- Error esperado: update or delete on table "domains" violates foreign key constraint
```

**Datos mínimos:**
```sql
-- Crear al menos 10 objetos del dominio Aves
INSERT INTO objects (domain_id, scientific_name, common_name, metadata) VALUES
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Aquila chrysaetos', 'Águila Real', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Falco peregrinus', 'Halcón Peregrino', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Bubo scandiacus', 'Búho Nival', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Vultur gryphus', 'Cóndor Andino', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Ramphastos toco', 'Tucán', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Ara macao', 'Guacamayo', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Aptenodytes forsteri', 'Pingüino Emperador', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Phoenicopterus roseus', 'Flamenco', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Pelecanus occidentalis', 'Pelícano', '{}'),
    ((SELECT domain_id FROM domains WHERE name = 'Aves'), 'Pavo cristatus', 'Pavo Real', '{}');
```

---

### ✅ `object_images`

**Checklist:**

- [ ] Tabla creada con PK `image_id` (UUID)
- [ ] FK válida a `objects.object_id` con ON DELETE CASCADE
- [ ] Campo `variant_index` con CHECK >= 0
- [ ] Constraint UNIQUE en (object_id, variant_index)
- [ ] Campo `format` con CHECK (png/webp/jpg)
- [ ] Índice en `object_id`
- [ ] Cada objeto tiene MÍNIMO 2 imágenes
- [ ] Trigger/validación que avisa si objeto tiene <2 imágenes

**Testing:**
```sql
-- Insertar imagen válida
INSERT INTO object_images (object_id, variant_index, image_path, format, source) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
     0, '/assets/objects/aguila_real_0.webp', 'webp', 'ia');

-- Debe fallar (variant_index duplicado)
INSERT INTO object_images (object_id, variant_index, image_path, format, source) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
     0, '/assets/objects/aguila_real_otro.webp', 'webp', 'ia');
-- Error esperado: duplicate key value violates unique constraint

-- Debe fallar (format inválido)
INSERT INTO object_images (object_id, variant_index, image_path, format) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
     1, '/assets/aguila.gif', 'gif');
-- Error esperado: violates check constraint

-- Validar mínimo 2 imágenes
SELECT object_id, COUNT(*) as image_count
FROM object_images
GROUP BY object_id
HAVING COUNT(*) < 2;
-- Debe retornar 0 filas (todos los objetos tienen ≥2 imágenes)
```

**Datos mínimos:**
```sql
-- Insertar 2 variantes para cada objeto
INSERT INTO object_images (object_id, variant_index, image_path, format, source)
SELECT 
    object_id,
    0,
    '/assets/objects/' || LOWER(REPLACE(common_name, ' ', '_')) || '_0.webp',
    'webp',
    'ia'
FROM objects
WHERE domain_id = (SELECT domain_id FROM domains WHERE name = 'Aves');

INSERT INTO object_images (object_id, variant_index, image_path, format, source)
SELECT 
    object_id,
    1,
    '/assets/objects/' || LOWER(REPLACE(common_name, ' ', '_')) || '_1.webp',
    'webp',
    'ia'
FROM objects
WHERE domain_id = (SELECT domain_id FROM domains WHERE name = 'Aves');
```

---

### ✅ `cards`

**Checklist:**

- [ ] Tabla creada con PK `card_id` (UUID)
- [ ] FK válida a `objects.object_id` con ON DELETE RESTRICT
- [ ] Campo `type` con CHECK (A/B/C)
- [ ] Campo `rarity` con CHECK (common/rare/epic/legendary)
- [ ] Constraint UNIQUE en (object_id, type)
- [ ] Índices en `object_id`, `type`, `rarity`
- [ ] Cada objeto tiene exactamente 3 cartas (A, B, C)

**Testing:**
```sql
-- Generar las 3 cartas para todos los objetos
INSERT INTO cards (object_id, type, rarity) 
SELECT 
    object_id,
    t.type,
    CASE 
        WHEN t.type = 'A' THEN 'common'
        WHEN t.type = 'B' THEN 'rare'
        WHEN t.type = 'C' THEN 'epic'
    END as rarity
FROM objects
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS t(type)
WHERE domain_id = (SELECT domain_id FROM domains WHERE name = 'Aves');

-- Debe fallar (duplicar tipo para mismo objeto)
INSERT INTO cards (object_id, type, rarity) VALUES
    ((SELECT object_id FROM objects LIMIT 1), 'A', 'common');
-- Error esperado: duplicate key value violates unique constraint

-- Validar que todos los objetos tienen 3 cartas
SELECT object_id, COUNT(*) as card_count
FROM cards
GROUP BY object_id
HAVING COUNT(*) != 3;
-- Debe retornar 0 filas
```

---

### ✅ `attack_factors` y `defense_factors`

**Checklist:**

- [ ] Tablas creadas con PK `object_id`
- [ ] FK válida a `objects.object_id` con ON DELETE CASCADE
- [ ] Todos los factores con CHECK BETWEEN 0 AND 10
- [ ] Todos los factores con tipo DECIMAL(3,1)
- [ ] Todos los objetos tienen factores asignados
- [ ] Valores realistas (no todos 10 o todos 0)

**Testing:**
```sql
-- Insertar factores válidos
INSERT INTO attack_factors (object_id, p, s, w, h, a) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
     8.5, 7.0, 6.5, 7.5, 6.0);

-- Debe fallar (valor fuera de rango)
INSERT INTO attack_factors (object_id, p, s, w, h, a) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Halcón Peregrino'),
     11.0, 5.0, 5.0, 5.0, 5.0);
-- Error esperado: violates check constraint

-- Validar que todos los objetos tienen factores
SELECT o.object_id, o.common_name
FROM objects o
LEFT JOIN attack_factors af ON o.object_id = af.object_id
WHERE af.object_id IS NULL;
-- Debe retornar 0 filas
```

**Datos mínimos:**
```sql
-- Asignar factores a todos los objetos (valores de ejemplo)
INSERT INTO attack_factors (object_id, p, s, w, h, a)
SELECT object_id, 
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1)
FROM objects
WHERE domain_id = (SELECT domain_id FROM domains WHERE name = 'Aves');

INSERT INTO defense_factors (object_id, ad, c, e, sd, r)
SELECT object_id,
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1),
    5.0 + (RANDOM() * 5.0)::DECIMAL(3,1)
FROM objects
WHERE domain_id = (SELECT domain_id FROM domains WHERE name = 'Aves');
```

---

### ✅ `rulesets`

**Checklist:**

- [ ] Tabla creada con PK `ruleset_id` (UUID)
- [ ] Campo `version` con constraint UNIQUE
- [ ] Campos `weights_attack` y `weights_defense` tipo JSONB
- [ ] Constraint CHECK que valida estructura de weights (contiene claves p/s/w/h/a y ad/c/e/sd/r)
- [ ] Índice en `version`
- [ ] Al menos ruleset v1.0.0 creado
- [ ] Pesos suman aproximadamente 1.0

**Testing:**
```sql
-- Insertar ruleset válido
INSERT INTO rulesets (version, weights_attack, weights_defense) VALUES
    ('1.0.0',
     '{"p": 0.25, "s": 0.20, "w": 0.20, "h": 0.20, "a": 0.15}',
     '{"ad": 0.25, "c": 0.20, "e": 0.25, "sd": 0.15, "r": 0.15}');

-- Debe fallar (version duplicada)
INSERT INTO rulesets (version, weights_attack, weights_defense) VALUES
    ('1.0.0', '{}', '{}');
-- Error esperado: duplicate key value violates unique constraint

-- Debe fallar (weights_attack incompleto)
INSERT INTO rulesets (version, weights_attack, weights_defense) VALUES
    ('1.0.1',
     '{"p": 0.5, "s": 0.5}', -- falta w, h, a
     '{"ad": 0.25, "c": 0.20, "e": 0.25, "sd": 0.15, "r": 0.15}');
-- Error esperado: violates check constraint

-- Validar suma de pesos
SELECT 
    version,
    (weights_attack->>'p')::NUMERIC + 
    (weights_attack->>'s')::NUMERIC +
    (weights_attack->>'w')::NUMERIC +
    (weights_attack->>'h')::NUMERIC +
    (weights_attack->>'a')::NUMERIC as total_attack
FROM rulesets;
-- Debe estar cerca de 1.0
```

---

## 2. JUGADORES Y SESIÓN

### ✅ `players`

**Checklist:**

- [ ] Tabla creada con PK `player_id` (UUID)
- [ ] Campo `email` con constraint UNIQUE
- [ ] Campo `auth_provider` con CHECK
- [ ] Índice en `email`
- [ ] Al menos 1 jugador de prueba creado
- [ ] No permite emails duplicados

**Testing:**
```sql
-- Crear jugador
INSERT INTO players (email, display_name, auth_provider) VALUES
    ('test@kyndo.app', 'Test User', 'email');

-- Debe fallar (email duplicado)
INSERT INTO players (email, auth_provider) VALUES
    ('test@kyndo.app', 'email');
-- Error esperado: duplicate key value violates unique constraint
```

---

### ✅ `player_state`

**Checklist:**

- [ ] Tabla creada con PK `player_id`
- [ ] FK válida a `players.player_id` con ON DELETE CASCADE
- [ ] FK válida a `domains.domain_id`
- [ ] Campo `mmr` con CHECK >= 0, default 1000
- [ ] Campo `league` con CHECK
- [ ] Índices en `active_domain` y `mmr`
- [ ] Se inicializa automáticamente al crear jugador

**Testing:**
```sql
-- Usar función de inicialización
SELECT initialize_new_player(
    (SELECT player_id FROM players WHERE email = 'test@kyndo.app'),
    (SELECT domain_id FROM domains WHERE name = 'Aves')
);

-- Validar que se creó
SELECT * FROM player_state WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Debe retornar 1 fila con mmr = 1000, league = 'bronze'
```

---

### ✅ `player_session_state`

**Checklist:**

- [ ] Tabla creada con PK `player_id`
- [ ] FK válida a `players.player_id` con ON DELETE CASCADE
- [ ] Campo `state` con CHECK (idle/in_memory/in_battle), default 'idle'
- [ ] Índice en `state`
- [ ] Se inicializa como 'idle' al crear jugador

**Testing:**
```sql
-- Validar inicialización
SELECT state FROM player_session_state 
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Debe retornar 'idle'

-- Cambiar estado
UPDATE player_session_state 
SET state = 'in_memory', context_id = gen_random_uuid()
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');

-- Debe fallar (estado inválido)
UPDATE player_session_state SET state = 'playing'
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Error esperado: violates check constraint
```

---

## 3. PROGRESO Y CARTAS

### ✅ `player_card_state`

**Checklist:**

- [ ] Tabla creada con PK compuesta (player_id, card_id)
- [ ] FK válidas con ON DELETE CASCADE/RESTRICT
- [ ] Campo `state` con CHECK (hidden/discovered/unlocked/temporary_owned)
- [ ] Constraint que valida `temporary_owned` requiere `expires_at`
- [ ] Índice en `expires_at` (parcial WHERE NOT NULL)
- [ ] Se inicializan todas las cartas como 'hidden' al crear jugador

**Testing:**
```sql
-- Validar inicialización (debe haber 30 cartas si hay 10 objetos × 3 tipos)
SELECT COUNT(*) FROM player_card_state
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Debe retornar 30 (o 3 × número de objetos)

-- Todas deben estar en 'hidden'
SELECT DISTINCT state FROM player_card_state
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Debe retornar solo 'hidden'

-- Cambiar estado a unlocked
UPDATE player_card_state
SET state = 'unlocked'
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app')
  AND card_id = (SELECT card_id FROM cards LIMIT 1);

-- Debe fallar (temporary_owned sin expires_at)
UPDATE player_card_state
SET state = 'temporary_owned'
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app')
  AND card_id = (SELECT card_id FROM cards LIMIT 1);
-- Error esperado: violates check constraint "chk_temp_owned_has_expiry"
```

---

### ✅ `memory_progress`

**Checklist:**

- [ ] Tabla creada con PK compuesta (player_id, object_id)
- [ ] FK válidas con ON DELETE CASCADE
- [ ] Campos con CHECK >= 0
- [ ] No requiere inicialización (se crea al jugar)

**Testing:**
```sql
-- Insertar progreso
INSERT INTO memory_progress (player_id, object_id, level_completed, attempts_total)
VALUES (
    (SELECT player_id FROM players WHERE email = 'test@kyndo.app'),
    (SELECT object_id FROM objects LIMIT 1),
    1, 3
);

-- Debe fallar (valor negativo)
UPDATE memory_progress SET attempts_total = -5
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Error esperado: violates check constraint
```

---

### ✅ `memory_runs`

**Checklist:**

- [ ] Tabla creada con PK `memory_run_id` (UUID)
- [ ] FK válida a `players.player_id` con ON DELETE CASCADE
- [ ] Campos `level`, `grade`, `card_count` con CHECK
- [ ] Campo `seed` NOT NULL
- [ ] Constraint que valida `finished_at` requiere `pairs_found` (resultado completo)
- [ ] Índice en (player_id, created_at DESC)

**Testing:**
```sql
-- Crear run
INSERT INTO memory_runs (player_id, level, grade, card_count, seed)
VALUES (
    (SELECT player_id FROM players WHERE email = 'test@kyndo.app'),
    1, 1, 20, 'test_seed_12345'
);

-- Debe fallar (card_count impar)
INSERT INTO memory_runs (player_id, level, grade, card_count, seed)
VALUES (
    (SELECT player_id FROM players WHERE email = 'test@kyndo.app'),
    1, 1, 21, 'seed'
);
-- Error esperado: violates check constraint

-- Finalizar run (debe actualizar todos los campos de resultado)
UPDATE memory_runs
SET pairs_found = 10, attempts_used = 18, score = 120, 
    max_streak = 5, passed = true, finished_at = NOW()
WHERE memory_run_id = (SELECT memory_run_id FROM memory_runs LIMIT 1);
```

---

## 4. COMBATE (preparación MVP)

### ✅ `battles`, `battle_participants`, `battle_rounds`

**Checklist:**

- [ ] Tablas creadas con esquema correcto
- [ ] FK válidas
- [ ] Constraints CHECK funcionando
- [ ] NO requiere datos de prueba (no es jugable en MVP)
- [ ] Funciones `calculate_attack()` y `calculate_defense()` funcionan

**Testing:**
```sql
-- Testear función calculate_attack
SELECT calculate_attack(
    (SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
    (SELECT ruleset_id FROM rulesets WHERE version = '1.0.0')
);
-- Debe retornar un valor entre 0 y 99

-- Testear función calculate_defense
SELECT calculate_defense(
    (SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
    (SELECT ruleset_id FROM rulesets WHERE version = '1.0.0')
);
-- Debe retornar un valor entre 0 y 99
```

---

## 5. ECONOMÍA Y AUDITORÍA

### ✅ `player_wallet`

**Checklist:**

- [ ] Tabla creada con PK `player_id`
- [ ] FK válida con ON DELETE CASCADE
- [ ] Campos con CHECK >= 0, default 0
- [ ] Se inicializa al crear jugador

**Testing:**
```sql
-- Validar inicialización
SELECT soft_currency, hard_currency FROM player_wallet
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Debe retornar 0, 0

-- Debe fallar (valor negativo)
UPDATE player_wallet SET soft_currency = -100
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');
-- Error esperado: violates check constraint
```

---

### ✅ `event_log`

**Checklist:**

- [ ] Tabla creada con PK `event_id` (UUID)
- [ ] FK válida a `players.player_id`
- [ ] Índices en (player_id, created_at DESC) y (event_type)
- [ ] Trigger de wallet funciona (registra cambios automáticamente)

**Testing:**
```sql
-- Cambiar wallet (debe generar evento automático)
UPDATE player_wallet SET soft_currency = 100
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app');

-- Validar que se registró
SELECT * FROM event_log
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app')
  AND event_type = 'currency_change';
-- Debe retornar 1 fila con payload de old/new values
```

---

## 6. FUNCIONES Y VISTAS

### ✅ `initialize_new_player()`

**Checklist:**

- [ ] Función existe y ejecuta sin error
- [ ] Crea filas en: player_state, player_session_state, player_wallet
- [ ] Crea todas las cartas en player_card_state como 'hidden'

**Testing:**
```sql
-- Crear jugador de prueba 2
INSERT INTO players (email, auth_provider) VALUES ('test2@kyndo.app', 'email');

-- Inicializar
SELECT initialize_new_player(
    (SELECT player_id FROM players WHERE email = 'test2@kyndo.app'),
    (SELECT domain_id FROM domains WHERE name = 'Aves')
);

-- Validar player_state
SELECT * FROM player_state WHERE player_id = (SELECT player_id FROM players WHERE email = 'test2@kyndo.app');
-- Debe existir

-- Validar player_card_state (todas hidden)
SELECT COUNT(*) FROM player_card_state
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test2@kyndo.app')
  AND state = 'hidden';
-- Debe retornar total de cartas del dominio
```

---

### ✅ `calculate_attack()` y `calculate_defense()`

**Checklist:**

- [ ] Funciones existen
- [ ] Retornan valores entre 0 y 99
- [ ] Usan pesos del ruleset correctamente
- [ ] Resultado es consistente (mismo input = mismo output)

**Testing:**
```sql
-- Testear consistencia
SELECT calculate_attack(
    (SELECT object_id FROM objects LIMIT 1),
    (SELECT ruleset_id FROM rulesets WHERE version = '1.0.0')
) as attack_1;

-- Ejecutar de nuevo (debe retornar el mismo valor)
SELECT calculate_attack(
    (SELECT object_id FROM objects LIMIT 1),
    (SELECT ruleset_id FROM rulesets WHERE version = '1.0.0')
) as attack_2;

-- attack_1 = attack_2 (determinismo)
```

---

### ✅ Vistas (`v_cards_full`, `v_player_collection`)

**Checklist:**

- [ ] Vistas creadas sin error
- [ ] Consultas ejecutan rápidamente (<100ms)
- [ ] Retornan datos completos y correctos

**Testing:**
```sql
-- Testear v_cards_full
SELECT * FROM v_cards_full LIMIT 5;
-- Debe retornar cartas con objeto, dominio, imágenes (JSONB array)

-- Testear v_player_collection
SELECT * FROM v_player_collection
WHERE player_id = (SELECT player_id FROM players WHERE email = 'test@kyndo.app')
LIMIT 5;
-- Debe retornar cartas del jugador con info completa
```

---

## 7. CHECKLIST FINAL DE VALIDACIÓN

### ✅ **Base de datos completa**

Ejecutar este script de validación final:
```sql
-- 1. Todas las tablas existen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Debe retornar 17 tablas

-- 2. Todos los foreign keys válidos
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';
-- Debe retornar ~20 foreign keys

-- 3. Todos los índices creados
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
-- Debe retornar ~30 índices

-- 4. Datos mínimos presentes
SELECT 'domains' as tabla, COUNT(*) as filas FROM domains
UNION ALL
SELECT 'objects', COUNT(*) FROM objects
UNION ALL
SELECT 'object_images', COUNT(*) FROM object_images
UNION ALL
SELECT 'cards', COUNT(*) FROM cards
UNION ALL
SELECT 'attack_factors', COUNT(*) FROM attack_factors
UNION ALL
SELECT 'defense_factors', COUNT(*) FROM defense_factors
UNION ALL
SELECT 'rulesets', COUNT(*) FROM rulesets;

-- Resultados esperados:
-- domains: ≥1
-- objects: ≥10
-- object_images: ≥20 (2 por objeto)
-- cards: ≥30 (3 por objeto)
-- attack_factors: ≥10
-- defense_factors: ≥10
-- rulesets: ≥1

-- 5. Jugador de prueba funcional
SELECT 
    p.email,
    ps.mmr,
    pss.state,
    pw.soft_currency,
    COUNT(pcs.card_id) as total_cards
FROM players p
JOIN player_state ps ON p.player_id = ps.player_id
JOIN player_session_state pss ON p.player_id = pss.player_id
JOIN player_wallet pw ON p.player_id = pw.player_id
LEFT JOIN player_card_state pcs ON p.player_id = pcs.player_id
WHERE p.email = 'test@kyndo.app'
GROUP BY p.email, ps.mmr, pss.state, pw.soft_currency;

-- Debe retornar:
-- email: test@kyndo.app
-- mmr: 1000
-- state: idle
-- soft_currency: 0-100 (según testing)
-- total_cards: 30 (o 3 × objetos)
```

---

## 8. REGLA FINAL

**Una tabla solo se considera implementada si:**

1. ✅ Cumple su checklist completo
2. ✅ Pasa todos los tests de validación
3. ✅ Datos de prueba insertados exitosamente
4. ✅ No hay errores al ejecutar operaciones básicas
5. ✅ Performance aceptable (consultas <100ms)

**Este checklist es vinculante para el MVP.**

---

## Estado del documento

- **Versión:** v1.0
- **Dependencias:** Esquema BD v1.2, Manual Técnico v1.2
- **Rol:** Guía de implementación y validación
- **Última actualización:** Enero 2025

---

**Fin del Checklist de Implementación v1.0**
