# KYNDO — ESQUEMA DE BASE DE DATOS (MVP) v1.2

Documento técnico definitivo para el **MVP de KYNDO**. Define tablas, claves, constraints e índices mínimos con SQL ejecutable.

---

## 0. Principios de diseño

- **Autoridad del servidor** (server-only)
- **Separación catálogo global vs. estado del jugador**
- **Determinismo auditable** (seeds, versionado de reglas)
- **Escalabilidad ≥12,000 objetos**

**Motor de BD:** PostgreSQL 14+ (recomendado) o compatible

**IDs:** UUIDv7 (ordenables por tiempo). Alternativa: ULID.

---

## 1. CATÁLOGO GLOBAL (Contenido del juego)

### 1.1 `domains` (Categorías temáticas)
```sql
CREATE TABLE domains (
    domain_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domains_status ON domains(status) WHERE status = 'active';
CREATE INDEX idx_domains_name ON domains(name);

COMMENT ON TABLE domains IS 'Categorías temáticas del juego (aves, fauna, transporte, etc.)';
COMMENT ON COLUMN domains.metadata IS 'Configuración adicional: {icon, description, display_order}';
```

**Ejemplo de datos:**
```sql
INSERT INTO domains (name, metadata) VALUES
    ('Aves', '{"icon": "🦅", "description": "Aves del mundo"}'),
    ('Fauna', '{"icon": "🦁", "description": "Animales terrestres"}'),
    ('Transporte', '{"icon": "🚗", "description": "Vehículos y máquinas"}');
```

---

### 1.2 `objects` (Entidades del mundo real)
```sql
CREATE TABLE objects (
    object_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(domain_id) ON DELETE RESTRICT,
    scientific_name VARCHAR(255),
    common_name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_has_name CHECK (
        scientific_name IS NOT NULL OR common_name IS NOT NULL
    )
);

CREATE INDEX idx_objects_domain ON objects(domain_id);
CREATE INDEX idx_objects_scientific ON objects(scientific_name) WHERE scientific_name IS NOT NULL;
CREATE INDEX idx_objects_common ON objects(common_name);

COMMENT ON TABLE objects IS 'Objetos reales del catálogo (ej: Águila Real, León, Ferrari)';
COMMENT ON COLUMN objects.metadata IS 'Datos enciclopédicos: {habitat, diet, range, fun_facts}';
```

**Ejemplo de datos:**
```sql
INSERT INTO objects (domain_id, scientific_name, common_name, metadata) VALUES
    (
        (SELECT domain_id FROM domains WHERE name = 'Aves'), 
        'Aquila chrysaetos', 
        'Águila Real',
        '{"habitat": "Montañas", "diet": "Carnívoro", "wingspan_cm": 220}'
    ),
    (
        (SELECT domain_id FROM domains WHERE name = 'Aves'),
        'Falco peregrinus',
        'Halcón Peregrino',
        '{"habitat": "Costas y acantilados", "diet": "Carnívoro", "max_speed_kmh": 389}'
    );
```

---

### 1.3 `object_images` (Variantes visuales)
```sql
CREATE TABLE object_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    variant_index INT NOT NULL CHECK (variant_index >= 0),
    image_path VARCHAR(500) NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'webp' 
        CHECK (format IN ('png', 'webp', 'jpg')),
    source VARCHAR(50) CHECK (source IN ('ia', 'fotografía', 'ilustración')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_object_variant UNIQUE (object_id, variant_index)
);

CREATE INDEX idx_object_images_object ON object_images(object_id);

COMMENT ON TABLE object_images IS 'Mínimo 2 variantes por objeto (regla cognitiva)';
COMMENT ON COLUMN object_images.variant_index IS 'Índice de variante: 0, 1, 2... (sin huecos)';
```

**Regla de validación (trigger recomendado):**
```sql
CREATE OR REPLACE FUNCTION check_min_images()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM object_images WHERE object_id = NEW.object_id) < 2 THEN
        RAISE WARNING 'Objeto % tiene menos de 2 imágenes (regla cognitiva)', NEW.object_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_min_images
AFTER INSERT OR UPDATE ON object_images
FOR EACH ROW EXECUTE FUNCTION check_min_images();
```

**Ejemplo de datos:**
```sql
INSERT INTO object_images (object_id, variant_index, image_path, source) VALUES
    (
        (SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
        0,
        '/assets/objects/aguila_real_0.webp',
        'ia'
    ),
    (
        (SELECT object_id FROM objects WHERE common_name = 'Águila Real'),
        1,
        '/assets/objects/aguila_real_1.webp',
        'ia'
    );
```

---

### 1.4 `cards` (Representaciones jugables)
```sql
CREATE TABLE cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE RESTRICT,
    type CHAR(1) NOT NULL CHECK (type IN ('A', 'B', 'C')),
    rarity VARCHAR(20) NOT NULL DEFAULT 'common'
        CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_object_type UNIQUE (object_id, type)
);

CREATE INDEX idx_cards_object ON cards(object_id);
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_rarity ON cards(rarity);

COMMENT ON TABLE cards IS 'Cada objeto tiene 3 cartas (A/B/C). Estado vive en player_card_state.';
COMMENT ON COLUMN cards.type IS 'A=básica, B=táctica (factores), C=avanzada (habilidades)';
```

**Ejemplo de datos:**
```sql
-- Generar las 3 cartas para cada objeto
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
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS t(type);
```

---

### 1.5 Factores Ataque/Defensa
```sql
CREATE TABLE attack_factors (
    object_id UUID PRIMARY KEY REFERENCES objects(object_id) ON DELETE CASCADE,
    p DECIMAL(3,1) NOT NULL CHECK (p BETWEEN 0 AND 10),  -- Predación
    s DECIMAL(3,1) NOT NULL CHECK (s BETWEEN 0 AND 10),  -- Velocidad
    w DECIMAL(3,1) NOT NULL CHECK (w BETWEEN 0 AND 10),  -- Weapons (anatomía ofensiva)
    h DECIMAL(3,1) NOT NULL CHECK (h BETWEEN 0 AND 10),  -- Hunt strategy
    a DECIMAL(3,1) NOT NULL CHECK (a BETWEEN 0 AND 10),  -- Agresividad
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE defense_factors (
    object_id UUID PRIMARY KEY REFERENCES objects(object_id) ON DELETE CASCADE,
    ad DECIMAL(3,1) NOT NULL CHECK (ad BETWEEN 0 AND 10), -- Adaptabilidad
    c  DECIMAL(3,1) NOT NULL CHECK (c BETWEEN 0 AND 10),  -- Camuflaje
    e  DECIMAL(3,1) NOT NULL CHECK (e BETWEEN 0 AND 10),  -- Evasión
    sd DECIMAL(3,1) NOT NULL CHECK (sd BETWEEN 0 AND 10), -- Social defense
    r  DECIMAL(3,1) NOT NULL CHECK (r BETWEEN 0 AND 10),  -- Robustez
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE attack_factors IS 'Factores 0-10 para cálculo de ataque';
COMMENT ON TABLE defense_factors IS 'Factores 0-10 para cálculo de defensa';
```

**Ejemplo de datos:**
```sql
INSERT INTO attack_factors (object_id, p, s, w, h, a) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'), 8.5, 7.0, 6.5, 7.5, 6.0),
    ((SELECT object_id FROM objects WHERE common_name = 'Halcón Peregrino'), 7.0, 9.5, 5.5, 8.0, 7.5);

INSERT INTO defense_factors (object_id, ad, c, e, sd, r) VALUES
    ((SELECT object_id FROM objects WHERE common_name = 'Águila Real'), 7.0, 5.0, 8.0, 4.0, 6.5),
    ((SELECT object_id FROM objects WHERE common_name = 'Halcón Peregrino'), 8.0, 6.0, 9.5, 3.5, 5.0);
```

---

### 1.6 `rulesets` (Versionado de balance)
```sql
CREATE TABLE rulesets (
    ruleset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) UNIQUE NOT NULL, -- Semver: "1.0.0"
    weights_attack JSONB NOT NULL,
    weights_defense JSONB NOT NULL,
    normalization_method VARCHAR(50) NOT NULL DEFAULT 'linear',
    rounding_method VARCHAR(50) NOT NULL DEFAULT 'half_up',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_weights_attack CHECK (
        jsonb_typeof(weights_attack) = 'object' AND
        weights_attack ? 'p' AND
        weights_attack ? 's' AND
        weights_attack ? 'w' AND
        weights_attack ? 'h' AND
        weights_attack ? 'a'
    ),
    CONSTRAINT chk_weights_defense CHECK (
        jsonb_typeof(weights_defense) = 'object' AND
        weights_defense ? 'ad' AND
        weights_defense ? 'c' AND
        weights_defense ? 'e' AND
        weights_defense ? 'sd' AND
        weights_defense ? 'r'
    )
);

CREATE INDEX idx_rulesets_version ON rulesets(version);

COMMENT ON TABLE rulesets IS 'Versiones de balance. NUNCA se borran, solo se agregan.';
COMMENT ON COLUMN rulesets.weights_attack IS 'Pesos para factores: {"p": 0.25, "s": 0.20, ...}';
```

**Ejemplo de datos:**
```sql
INSERT INTO rulesets (version, weights_attack, weights_defense) VALUES
    (
        '1.0.0',
        '{"p": 0.25, "s": 0.20, "w": 0.20, "h": 0.20, "a": 0.15}',
        '{"ad": 0.25, "c": 0.20, "e": 0.25, "sd": 0.15, "r": 0.15}'
    );
```

---

## 2. JUGADORES Y SESIÓN

### 2.1 `players` (Cuentas)
```sql
CREATE TABLE players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'email'
        CHECK (auth_provider IN ('email', 'google', 'apple')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_last_login ON players(last_login_at);

COMMENT ON TABLE players IS 'Cuentas de usuario. Sin datos de juego.';
```

---

### 2.2 `player_state` (Estado persistente del jugador)
```sql
CREATE TABLE player_state (
    player_id UUID PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
    active_domain UUID NOT NULL REFERENCES domains(domain_id),
    mmr INT NOT NULL DEFAULT 1000 CHECK (mmr >= 0),
    league VARCHAR(50) NOT NULL DEFAULT 'bronze'
        CHECK (league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_state_domain ON player_state(active_domain);
CREATE INDEX idx_player_state_mmr ON player_state(mmr);

COMMENT ON TABLE player_state IS 'Estado general del jugador (dominio activo, MMR, liga)';
```

### 2.2 `player_state` (Estado persistente del jugador)
```sql
CREATE TABLE player_state (
    player_id UUID PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
    active_domain UUID NOT NULL REFERENCES domains(domain_id),
    mmr INT NOT NULL DEFAULT 1000 CHECK (mmr >= 0),
    league VARCHAR(50) NOT NULL DEFAULT 'bronze'
        CHECK (league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- NUEVA COLUMNA: Preferencia de nomenclatura
    card_name_format VARCHAR(20) NOT NULL DEFAULT 'scientific'
        CHECK (card_name_format IN ('scientific', 'english', 'colombian')),
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_state_domain ON player_state(active_domain);
CREATE INDEX idx_player_state_mmr ON player_state(mmr);

COMMENT ON TABLE player_state IS 'Estado general del jugador (dominio activo, MMR, liga, preferencias)';
COMMENT ON COLUMN player_state.card_name_format IS 'Formato de nombres en cartas: scientific (defecto), english, colombian';
```

**Testing:**
```sql
-- Insertar con valor por defecto
INSERT INTO player_state (player_id, active_domain)
VALUES (?, ?);
-- card_name_format será 'scientific' automáticamente

-- Cambiar preferencia
UPDATE player_state 
SET card_name_format = 'english', updated_at = NOW()
WHERE player_id = ?;

-- Debe fallar (valor inválido)
UPDATE player_state 
SET card_name_format = 'portuguese'
WHERE player_id = ?;
-- Error esperado: violates check constraint
```

### 2.3 `player_session_state` (Estado de sesión activa)
```sql
CREATE TABLE player_session_state (
    player_id UUID PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
    state VARCHAR(20) NOT NULL DEFAULT 'idle'
        CHECK (state IN ('idle', 'in_memory', 'in_battle')),
    context_id UUID, -- memory_run_id o battle_id
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_session_state ON player_session_state(state);

COMMENT ON TABLE player_session_state IS 'Estado temporal de sesión. Se limpia al desconectar.';
COMMENT ON COLUMN player_session_state.context_id IS 'UUID del memory_run o battle activo';
```

---

## 3. PROGRESO DEL JUGADOR

### 3.1 `player_card_state` (Colección personal)
```sql
CREATE TABLE player_card_state (
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE RESTRICT,
    state VARCHAR(20) NOT NULL DEFAULT 'hidden'
        CHECK (state IN ('hidden', 'discovered', 'unlocked', 'temporary_owned')),
    expires_at TIMESTAMPTZ, -- Solo si state = 'temporary_owned'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (player_id, card_id),
    
    CONSTRAINT chk_temp_owned_has_expiry CHECK (
        (state = 'temporary_owned' AND expires_at IS NOT NULL) OR
        (state != 'temporary_owned' AND expires_at IS NULL)
    )
);

CREATE INDEX idx_player_card_state_expires ON player_card_state(expires_at) 
    WHERE expires_at IS NOT NULL;
CREATE INDEX idx_player_card_player ON player_card_state(player_id);
CREATE INDEX idx_player_card_state_enum ON player_card_state(state);

COMMENT ON TABLE player_card_state IS 'Estado de cada carta por jugador';
COMMENT ON COLUMN player_card_state.expires_at IS 'Fecha de expiración para Conquista Temporal';
```

**Job de limpieza (ejecutar cada 5 minutos):**
```sql
-- Expirar cartas temporales
UPDATE player_card_state
SET state = 'hidden', expires_at = NULL, updated_at = NOW()
WHERE state = 'temporary_owned' AND expires_at < NOW();
```

---

### 3.2 `memory_progress` (Progreso por objeto)
```sql
CREATE TABLE memory_progress (
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    level_completed INT NOT NULL DEFAULT 0 CHECK (level_completed >= 0),
    attempts_total INT NOT NULL DEFAULT 0 CHECK (attempts_total >= 0),
    fails_total INT NOT NULL DEFAULT 0 CHECK (fails_total >= 0),
    best_score INT NOT NULL DEFAULT 0 CHECK (best_score >= 0),
    last_played_at TIMESTAMPTZ,
    
    PRIMARY KEY (player_id, object_id)
);

CREATE INDEX idx_memory_progress_player ON memory_progress(player_id);
CREATE INDEX idx_memory_progress_last_played ON memory_progress(last_played_at);

COMMENT ON TABLE memory_progress IS 'Progreso del jugador por cada objeto en Memory';
```

---

### 3.3 `memory_runs` (Partidas de Memory)
```sql
CREATE TABLE memory_runs (
    memory_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
    grade INT NOT NULL CHECK (grade BETWEEN 1 AND 5),
    card_count INT NOT NULL CHECK (card_count > 0 AND card_count % 2 = 0),
    dense_mode BOOLEAN NOT NULL DEFAULT FALSE,
    seed VARCHAR(255) NOT NULL,
    
    -- Resultado (null hasta finalizar)
    pairs_found INT CHECK (pairs_found >= 0),
    attempts_used INT CHECK (attempts_used >= 0),
    score INT CHECK (score >= 0),
    max_streak INT CHECK (max_streak >= 0),
    passed BOOLEAN,
    time_elapsed_ms BIGINT CHECK (time_elapsed_ms >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    
    CONSTRAINT chk_finished_has_result CHECK (
        (finished_at IS NULL AND pairs_found IS NULL) OR
        (finished_at IS NOT NULL AND pairs_found IS NOT NULL)
    )
);

CREATE INDEX idx_memory_runs_player ON memory_runs(player_id, created_at DESC);
CREATE INDEX idx_memory_runs_finished ON memory_runs(finished_at) WHERE finished_at IS NOT NULL;

COMMENT ON TABLE memory_runs IS 'Historial de partidas Memory';
COMMENT ON COLUMN memory_runs.dense_mode IS 'TRUE si card_count >= 80 (activa modo denso en UI)';
COMMENT ON COLUMN memory_runs.seed IS 'Seed para reproducibilidad (debugging/replay)';
```

---

## 4. COMBATE A/D

### 4.1 `battles` (Batallas)
```sql
CREATE TABLE battles (
    battle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(domain_id),
    ruleset_id UUID NOT NULL REFERENCES rulesets(ruleset_id),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    CONSTRAINT chk_resolved_has_timestamp CHECK (
        (status = 'resolved' AND resolved_at IS NOT NULL) OR
        (status != 'resolved' AND resolved_at IS NULL)
    )
);

CREATE INDEX idx_battles_status ON battles(status) WHERE status != 'resolved';
CREATE INDEX idx_battles_domain ON battles(domain_id);

COMMENT ON TABLE battles IS 'Batallas entre jugadores';
```

---

### 4.2 `battle_participants` (Participantes)
```sql
CREATE TABLE battle_participants (
    battle_id UUID NOT NULL REFERENCES battles(battle_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(card_id),
    
    -- Valores calculados server-side (NUNCA del cliente)
    attack_value INT NOT NULL CHECK (attack_value BETWEEN 0 AND 99),
    defense_value INT NOT NULL CHECK (defense_value BETWEEN 0 AND 99),
    
    rounds_won INT NOT NULL DEFAULT 0 CHECK (rounds_won >= 0),
    
    PRIMARY KEY (battle_id, player_id)
);

CREATE INDEX idx_battle_participants_player ON battle_participants(player_id);

COMMENT ON TABLE battle_participants IS 'Jugadores en una batalla';
COMMENT ON COLUMN battle_participants.attack_value IS 'Calculado server-side con ruleset';
COMMENT ON COLUMN battle_participants.defense_value IS 'Calculado server-side con ruleset';
```

---

### 4.3 `battle_rounds` (Rondas)
```sql
CREATE TABLE battle_rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(battle_id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number > 0),
    ruleset_id UUID NOT NULL REFERENCES rulesets(ruleset_id), -- Puede cambiar por ronda
    winner_player_id UUID REFERENCES players(player_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (battle_id, round_number)
);

CREATE INDEX idx_battle_rounds_battle ON battle_rounds(battle_id, round_number);

COMMENT ON TABLE battle_rounds IS 'Rondas de una batalla';
COMMENT ON COLUMN battle_rounds.ruleset_id IS 'Ruleset usado en esta ronda (auditoría)';
```

---

## 5. ECONOMÍA

### 5.1 `player_wallet` (Monedas)
```sql
CREATE TABLE player_wallet (
    player_id UUID PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
    soft_currency INT NOT NULL DEFAULT 0 CHECK (soft_currency >= 0),
    hard_currency INT NOT NULL DEFAULT 0 CHECK (hard_currency >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE player_wallet IS 'Monedas del jugador';
COMMENT ON COLUMN player_wallet.soft_currency IS 'Moneda ganada jugando';
COMMENT ON COLUMN player_wallet.hard_currency IS 'Moneda comprada (futuro)';
```

---

## 6. AUDITORÍA

### 6.1 `event_log` (Registro de eventos)
```sql
CREATE TABLE event_log (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    ruleset_id UUID REFERENCES rulesets(ruleset_id), -- Si aplica
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_log_player ON event_log(player_id, created_at DESC);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_created ON event_log(created_at DESC);

COMMENT ON TABLE event_log IS 'Log de eventos del sistema (auditoría, telemetría, debugging)';
```

**Tipos de eventos recomendados:**
- `memory_start`, `memory_finish`
- `battle_matchmake`, `battle_resolve`, `battle_finish`
- `card_unlock`, `card_temporary_gain`
- `currency_change`
- `login`, `logout`

---

## 7. FUNCIONES AUXILIARES

### 7.1 Inicializar jugador nuevo
```sql
CREATE OR REPLACE FUNCTION initialize_new_player(p_player_id UUID, p_domain_id UUID)
RETURNS VOID AS $$
BEGIN
    -- player_state
    INSERT INTO player_state (player_id, active_domain)
    VALUES (p_player_id, p_domain_id);
    
    -- player_session_state
    INSERT INTO player_session_state (player_id, state)
    VALUES (p_player_id, 'idle');
    
    -- player_wallet
    INSERT INTO player_wallet (player_id)
    VALUES (p_player_id);
    
    -- Inicializar todas las cartas como hidden
    INSERT INTO player_card_state (player_id, card_id, state)
    SELECT p_player_id, card_id, 'hidden'
    FROM cards
    WHERE object_id IN (
        SELECT object_id FROM objects WHERE domain_id = p_domain_id
    );
END;
$$ LANGUAGE plpgsql;
```

---

### 7.2 Calcular valores A/D
```sql
CREATE OR REPLACE FUNCTION calculate_attack(
    p_object_id UUID,
    p_ruleset_id UUID
) RETURNS INT AS $$
DECLARE
    v_factors RECORD;
    v_weights JSONB;
    v_result NUMERIC;
BEGIN
    -- Obtener factores
    SELECT * INTO v_factors FROM attack_factors WHERE object_id = p_object_id;
    
    -- Obtener pesos
    SELECT weights_attack INTO v_weights FROM rulesets WHERE ruleset_id = p_ruleset_id;
    
    -- Calcular
    v_result := (
        v_factors.p * (v_weights->>'p')::NUMERIC +
        v_factors.s * (v_weights->>'s')::NUMERIC +
        v_factors.w * (v_weights->>'w')::NUMERIC +
        v_factors.h * (v_weights->>'h')::NUMERIC +
        v_factors.a * (v_weights->>'a')::NUMERIC
    ) * 10; -- Normalizar a 0-99
    
    RETURN LEAST(99, GREATEST(0, ROUND(v_result)::INT));
END;
$$ LANGUAGE plpgsql;

-- Similar para defense
CREATE OR REPLACE FUNCTION calculate_defense(
    p_object_id UUID,
    p_ruleset_id UUID
) RETURNS INT AS $$
DECLARE
    v_factors RECORD;
    v_weights JSONB;
    v_result NUMERIC;
BEGIN
    SELECT * INTO v_factors FROM defense_factors WHERE object_id = p_object_id;
    SELECT weights_defense INTO v_weights FROM rulesets WHERE ruleset_id = p_ruleset_id;
    
    v_result := (
        v_factors.ad * (v_weights->>'ad')::NUMERIC +
        v_factors.c * (v_weights->>'c')::NUMERIC +
        v_factors.e * (v_weights->>'e')::NUMERIC +
        v_factors.sd * (v_weights->>'sd')::NUMERIC +
        v_factors.r * (v_weights->>'r')::NUMERIC
    ) * 10;
    
    RETURN LEAST(99, GREATEST(0, ROUND(v_result)::INT));
END;
$$ LANGUAGE plpgsql;
```

---

## 8. VISTAS ÚTILES

### 8.1 Vista de cartas completas
```sql
CREATE OR REPLACE VIEW v_cards_full AS
SELECT 
    c.card_id,
    c.object_id,
    c.type,
    c.rarity,
    o.domain_id,
    d.name as domain_name,
    o.scientific_name,
    o.common_name,
    o.metadata as object_metadata,
    (
        SELECT jsonb_agg(jsonb_build_object(
            'variant_index', oi.variant_index,
            'image_path', oi.image_path,
            'format', oi.format
        ) ORDER BY oi.variant_index)
        FROM object_images oi
        WHERE oi.object_id = o.object_id
    ) as images
FROM cards c
JOIN objects o ON c.object_id = o.object_id
JOIN domains d ON o.domain_id = d.domain_id;

COMMENT ON VIEW v_cards_full IS 'Vista completa de cartas con info del objeto e imágenes';
```

---

### 8.2 Vista de colección del jugador
```sql
CREATE OR REPLACE VIEW v_player_collection AS
SELECT 
    pcs.player_id,
    pcs.card_id,
    pcs.state,
    pcs.expires_at,
    c.type,
    c.rarity,
    o.common_name,
    o.scientific_name,
    d.name as domain_name,
    (
        SELECT image_path 
        FROM object_images 
        WHERE object_id = o.object_id 
        ORDER BY variant_index 
        LIMIT 1
    ) as primary_image
FROM player_card_state pcs
JOIN cards c ON pcs.card_id = c.card_id
JOIN objects o ON c.object_id = o.object_id
JOIN domains d ON o.domain_id = d.domain_id;

COMMENT ON VIEW v_player_collection IS 'Colección personal del jugador con info básica';
```

---

## 9. CONSTRAINTS Y REGLAS CRÍTICAS

### Reglas de integridad referencial
```sql
-- No se puede borrar un dominio si tiene objetos
ALTER TABLE objects ADD CONSTRAINT fk_objects_domain 
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE RESTRICT;

-- No se puede borrar un objeto si tiene cartas (que tienen jugadores)
ALTER TABLE cards ADD CONSTRAINT fk_cards_object
    FOREIGN KEY (object_id) REFERENCES objects(object_id) ON DELETE RESTRICT;

-- Si se borra un jugador, se borra todo su progreso (cascade)
-- Ya están definidos como ON DELETE CASCADE
```

---

### Triggers de auditoría
```sql
-- Registrar cambios en wallet
CREATE OR REPLACE FUNCTION log_wallet_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.soft_currency != NEW.soft_currency OR OLD.hard_currency != NEW.hard_currency THEN
        INSERT INTO event_log (player_id, event_type, payload)
        VALUES (
            NEW.player_id,
            'currency_change',
            jsonb_build_object(
                'old_soft', OLD.soft_currency,
                'new_soft', NEW.soft_currency,
                'old_hard', OLD.hard_currency,
                'new_hard', NEW.hard_currency
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_audit
AFTER UPDATE ON player_wallet
FOR EACH ROW EXECUTE FUNCTION log_wallet_change();
```

---

## 10. DATOS DE PRUEBA (Seed inicial)
```sql
-- Script completo de seed en /scripts/seed.sql

-- 1. Crear dominio de prueba
INSERT INTO domains (name, metadata) VALUES 
    ('Aves Test', '{"icon": "🦅", "test": true}');

-- 2. Crear 10 objetos de prueba
-- 3. Generar imágenes ficticias
-- 4. Crear 30 cartas (3 por objeto)
-- 5. Asignar factores A/D
-- 6. Crear ruleset v1.0.0
-- 7. Crear jugador de prueba

-- Ver archivo completo en: /scripts/seed_test_data.sql
```

---

## Estado del documento

- **Versión:** v1.2 (MEJORADA)
- **Motor:** PostgreSQL 14+
- **Dependencias:** Manual Maestro v1.02, Manual Técnico v1.2
- **Última actualización:** Enero 2025

**Cambios clave (mejora):**
- ✅ SQL ejecutable real
- ✅ Constraints completos con validación
- ✅ Funciones auxiliares para cálculos A/D
- ✅ Vistas útiles para consultas comunes
- ✅ Triggers de auditoría
- ✅ Ejemplos de datos reales
- ✅ Comentarios en todas las tablas
- ✅ Índices optimizados

---

**Fin del Esquema BD v1.2 (Mejorado)**
