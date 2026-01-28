# KYNDO — SISTEMA DE LOCALIZACIÓN MULTIIDIOMA

Sistema completo de internacionalización (i18n) para KYNDO, incluyendo nomenclatura de cartas en múltiples idiomas.

---

## 0. Principio fundamental

> **El juego es NATIVO en cada idioma, no una traducción.**

Cada idioma tiene:
- ✅ Nombres de aves nativos del idioma
- ✅ UI/UX completamente localizada
- ✅ Reglas y tutoriales en el idioma local
- ✅ Textos de cartas adaptados culturalmente

---

## 1. Idiomas soportados

### **1.1 Launch (MVP - 3 idiomas)**

| Código | Idioma | Nombre nativo | Prioridad | Mercado objetivo |
|--------|--------|---------------|-----------|------------------|
| `es-CO` | Español (Colombia) | Español | Alta | Colombia |
| `en-US` | English (US) | English | Alta | Global |
| `pt-BR` | Português (Brasil) | Português | Media | Brasil |

### **1.2 Post-MVP (expansión)**

| Código | Idioma | Nombre nativo | Mercado objetivo |
|--------|--------|---------------|------------------|
| `es-MX` | Español (México) | Español | México |
| `es-ES` | Español (España) | Español | Europa |
| `fr-FR` | Français | Français | Francia, África francófona |
| `de-DE` | Deutsch | Deutsch | Alemania, Europa central |
| `nl-NL` | Nederlands | Nederlands | Países Bajos |
| `ja-JP` | 日本語 | 日本語 | Japón |
| `zh-CN` | 简体中文 | 中文 | China |

---

## 2. Arquitectura de base de datos

### **2.1 Nueva tabla: `object_names_i18n`**

Nombres de objetos en múltiples idiomas.
```sql
CREATE TABLE object_names_i18n (
    object_name_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL, -- 'es-CO', 'en-US', 'pt-BR', etc.
    common_name VARCHAR(255) NOT NULL,  -- Nombre común en ese idioma
    alternative_names TEXT[], -- Nombres alternativos/regionales
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(255), -- eBird, Wikipedia, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_object_language UNIQUE (object_id, language_code)
);

CREATE INDEX idx_object_names_i18n_object ON object_names_i18n(object_id);
CREATE INDEX idx_object_names_i18n_language ON object_names_i18n(language_code);
CREATE INDEX idx_object_names_i18n_verified ON object_names_i18n(verified) WHERE verified = TRUE;

COMMENT ON TABLE object_names_i18n IS 'Nombres comunes de objetos en múltiples idiomas';
COMMENT ON COLUMN object_names_i18n.common_name IS 'Nombre común principal en el idioma especificado';
COMMENT ON COLUMN object_names_i18n.alternative_names IS 'Nombres alternativos/regionales (array)';
```

**Ejemplo de datos:**
```sql
-- Águila Real en diferentes idiomas
INSERT INTO object_names_i18n (object_id, language_code, common_name, alternative_names, verified, source) VALUES
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'es-CO', 'Águila Real', ARRAY['Águila Dorada', 'Águila Caudal'], TRUE, 'Asociación Colombiana de Ornitología'),
    
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'en-US', 'Golden Eagle', ARRAY['Royal Eagle'], TRUE, 'eBird'),
    
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'pt-BR', 'Águia-real', ARRAY['Águia-dourada'], TRUE, 'WikiAves Brasil'),
    
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'nl-NL', 'Steenarend', NULL, TRUE, 'Vogelbescherming Nederland'),
    
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'de-DE', 'Steinadler', NULL, TRUE, 'NABU Deutschland'),
    
    ((SELECT object_id FROM objects WHERE scientific_name = 'Aquila chrysaetos'),
     'fr-FR', 'Aigle royal', ARRAY['Aigle doré'], TRUE, 'LPO France');
```

---

### **2.2 Actualizar tabla: `objects`**

Simplificar a solo datos científicos universales.
```sql
-- Eliminar columnas de nombres específicos de idioma
ALTER TABLE objects DROP COLUMN IF EXISTS common_name;

-- Mantener solo datos científicos universales
-- scientific_name permanece (es universal)
```

---

### **2.3 Nueva tabla: `ui_translations`**

Traducciones de textos de interfaz.
```sql
CREATE TABLE ui_translations (
    translation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL, -- 'menu.home', 'card.attack', etc.
    language_code VARCHAR(10) NOT NULL,
    value TEXT NOT NULL,
    context VARCHAR(255), -- Contexto adicional
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_key_language UNIQUE (key, language_code)
);

CREATE INDEX idx_ui_translations_key ON ui_translations(key);
CREATE INDEX idx_ui_translations_language ON ui_translations(language_code);

COMMENT ON TABLE ui_translations IS 'Traducciones de textos de interfaz';
```

**Ejemplo de datos:**
```sql
INSERT INTO ui_translations (key, language_code, value) VALUES
    ('menu.home', 'es-CO', 'Inicio'),
    ('menu.home', 'en-US', 'Home'),
    ('menu.home', 'pt-BR', 'Início'),
    ('menu.home', 'nl-NL', 'Start'),
    
    ('card.attack', 'es-CO', 'Ataque'),
    ('card.attack', 'en-US', 'Attack'),
    ('card.attack', 'pt-BR', 'Ataque'),
    ('card.attack', 'nl-NL', 'Aanval'),
    
    ('card.defense', 'es-CO', 'Defensa'),
    ('card.defense', 'en-US', 'Defense'),
    ('card.defense', 'pt-BR', 'Defesa'),
    ('card.defense', 'nl-NL', 'Verdediging');
```

---

### **2.4 Actualizar tabla: `player_state`**
```sql
ALTER TABLE player_state 
ADD COLUMN language_code VARCHAR(10) NOT NULL DEFAULT 'en-US'
CHECK (language_code IN ('es-CO', 'en-US', 'pt-BR', 'es-MX', 'es-ES', 'fr-FR', 'de-DE', 'nl-NL', 'ja-JP', 'zh-CN'));

-- Eliminar card_name_format (reemplazado por card_name_priority)
ALTER TABLE player_state DROP COLUMN IF EXISTS card_name_format;

-- Agregar preferencia de orden de nombres
ALTER TABLE player_state
ADD COLUMN card_name_priority VARCHAR(20) NOT NULL DEFAULT 'scientific_first'
CHECK (card_name_priority IN ('scientific_first', 'local_first', 'english_first'));

COMMENT ON COLUMN player_state.language_code IS 'Idioma de la interfaz del jugador';
COMMENT ON COLUMN player_state.card_name_priority IS 'Orden de nombres en cartas: científico primero, local primero, o inglés primero';
```

---

## 3. Lógica de nomenclatura de cartas

### **3.1 Estructura de nombres en carta**
```
┌─────────────────────────────────┐
│  [TÍTULO PRINCIPAL]             │ ← Según preferencia del usuario
│  [Subtítulo 1]                  │ ← Segundo en prioridad
│  [Subtítulo 2]                  │ ← Tercero en prioridad
└─────────────────────────────────┘
```

### **3.2 Opciones de preferencia**

| Preferencia | Título | Subtítulo 1 | Subtítulo 2 | Ejemplo (es-CO) |
|-------------|--------|-------------|-------------|-----------------|
| `scientific_first` | Científico | Idioma local | Inglés (si ≠ local) | **AQUILA CHRYSAETOS**<br>Águila Real<br>Golden Eagle |
| `local_first` | Idioma local | Científico | Inglés (si ≠ local) | **ÁGUILA REAL**<br>Aquila chrysaetos<br>Golden Eagle |
| `english_first` | Inglés | Científico | Idioma local (si ≠ inglés) | **GOLDEN EAGLE**<br>Aquila chrysaetos<br>Águila Real |

**Regla especial:** Si `language_code = 'en-US'` y `card_name_priority = 'local_first'`, entonces local = inglés.

---

### **3.3 Función de renderizado**
```javascript
function getCardDisplayNames(card, userLanguage, userPriority) {
  // 1. Obtener nombre científico (universal)
  const scientificName = card.scientific_name;
  
  // 2. Obtener nombre en idioma del usuario
  const localName = card.names_i18n.find(n => n.language_code === userLanguage)?.common_name 
                    || scientificName; // fallback
  
  // 3. Obtener nombre en inglés (universal de referencia)
  const englishName = card.names_i18n.find(n => n.language_code === 'en-US')?.common_name
                      || scientificName; // fallback
  
  // 4. Determinar orden según preferencia
  let title, subtitle1, subtitle2;
  
  switch(userPriority) {
    case 'scientific_first':
      title = scientificName;
      subtitle1 = localName;
      subtitle2 = (userLanguage !== 'en-US') ? englishName : null;
      break;
      
    case 'local_first':
      title = localName;
      subtitle1 = scientificName;
      subtitle2 = (userLanguage !== 'en-US') ? englishName : null;
      break;
      
    case 'english_first':
      title = englishName;
      subtitle1 = scientificName;
      subtitle2 = (userLanguage !== 'en-US') ? localName : null;
      break;
      
    default:
      title = scientificName;
      subtitle1 = localName;
      subtitle2 = englishName;
  }
  
  // 5. Remover subtítulos duplicados
  if (subtitle1 === title) subtitle1 = subtitle2, subtitle2 = null;
  if (subtitle2 === title || subtitle2 === subtitle1) subtitle2 = null;
  
  return {
    title: title.toUpperCase(),
    subtitle1: subtitle1,
    subtitle2: subtitle2
  };
}
```

---

### **3.4 Ejemplos de renderizado**

#### **Usuario: Holandés (nl-NL), Preferencia: `local_first`**
```
┌─────────────────────────────────┐
│  STEENAREND                     │ ← Nombre local (holandés)
│  Aquila chrysaetos              │ ← Científico
│  Golden Eagle                   │ ← Inglés (referencia)
└─────────────────────────────────┘
```

#### **Usuario: Español Colombia (es-CO), Preferencia: `scientific_first`**
```
┌─────────────────────────────────┐
│  AQUILA CHRYSAETOS              │ ← Científico
│  Águila Real                    │ ← Local (español Colombia)
│  Golden Eagle                   │ ← Inglés (referencia)
└─────────────────────────────────┘
```

#### **Usuario: Inglés (en-US), Preferencia: `local_first`**
```
┌─────────────────────────────────┐
│  GOLDEN EAGLE                   │ ← Local = Inglés
│  Aquila chrysaetos              │ ← Científico
└─────────────────────────────────┘
```
(No hay tercer subtítulo porque local = inglés)

---

## 4. Detección automática de idioma

### **4.1 Al crear cuenta / primera carga**
```javascript
async function detectUserLanguage() {
  // 1. Leer configuración del navegador
  const browserLang = navigator.language || navigator.userLanguage;
  
  // 2. Mapear a idiomas soportados
  const supportedLanguages = {
    'es': 'es-CO',  // Español por defecto Colombia
    'es-CO': 'es-CO',
    'es-MX': 'es-MX',
    'es-ES': 'es-ES',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US',
    'pt': 'pt-BR',
    'pt-BR': 'pt-BR',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'nl': 'nl-NL',
    'ja': 'ja-JP',
    'zh': 'zh-CN'
  };
  
  // 3. Buscar coincidencia exacta o parcial
  let detectedLang = supportedLanguages[browserLang];
  
  if (!detectedLang) {
    const langPrefix = browserLang.split('-')[0];
    detectedLang = supportedLanguages[langPrefix];
  }
  
  // 4. Fallback a inglés
  return detectedLang || 'en-US';
}
```

---

### **4.2 Cambio manual de idioma**

**UI de configuración:**
```
┌────────────────────────────────────┐
│ LANGUAGE / IDIOMA / 言語            │
├────────────────────────────────────┤
│                                    │
│ ○ Español (Colombia)               │
│ ○ English (United States)          │
│ ○ Português (Brasil)               │
│ ○ Español (México)                 │
│ ○ Français                         │
│ ○ Deutsch                          │
│ ○ Nederlands                       │
│                                    │
│ [Aplicar] [Cancelar]               │
└────────────────────────────────────┘
```

**Al cambiar idioma:**
1. Actualizar `player_state.language_code`
2. Recargar todas las traducciones
3. Re-renderizar toda la UI
4. Actualizar nombres de cartas según nuevo idioma

---

## 5. Query de cartas con nombres localizados

### **5.1 Vista para cartas localizadas**
```sql
CREATE OR REPLACE VIEW v_cards_localized AS
SELECT 
    c.card_id,
    c.object_id,
    c.type,
    c.rarity,
    o.scientific_name,
    o.domain_id,
    d.name as domain_name,
    
    -- Nombres en todos los idiomas (JSONB)
    (
        SELECT jsonb_object_agg(
            oni.language_code,
            jsonb_build_object(
                'common_name', oni.common_name,
                'alternative_names', oni.alternative_names,
                'verified', oni.verified
            )
        )
        FROM object_names_i18n oni
        WHERE oni.object_id = o.object_id
    ) as names_i18n,
    
    -- Imágenes
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

COMMENT ON VIEW v_cards_localized IS 'Cartas con nombres en todos los idiomas disponibles';
```

**Consulta de ejemplo:**
```sql
-- Obtener carta con nombres localizados
SELECT * FROM v_cards_localized WHERE card_id = ?;

-- Resultado:
{
  "card_id": "uuid",
  "scientific_name": "Aquila chrysaetos",
  "names_i18n": {
    "es-CO": {
      "common_name": "Águila Real",
      "alternative_names": ["Águila Dorada"],
      "verified": true
    },
    "en-US": {
      "common_name": "Golden Eagle",
      "alternative_names": ["Royal Eagle"],
      "verified": true
    },
    "nl-NL": {
      "common_name": "Steenarend",
      "alternative_names": null,
      "verified": true
    }
  }
}
```

---

## 6. Búsqueda multiidioma

### **6.1 Función de búsqueda**
```sql
CREATE OR REPLACE FUNCTION search_cards_multilang(
    search_term TEXT,
    user_language VARCHAR(10)
) RETURNS TABLE (
    card_id UUID,
    relevance_score INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.card_id,
        CASE
            -- Coincidencia exacta en nombre local del usuario (máxima relevancia)
            WHEN LOWER(oni.common_name) = LOWER(search_term) AND oni.language_code = user_language THEN 100
            
            -- Coincidencia exacta en nombre científico
            WHEN LOWER(o.scientific_name) = LOWER(search_term) THEN 95
            
            -- Coincidencia exacta en inglés
            WHEN LOWER(oni_en.common_name) = LOWER(search_term) THEN 90
            
            -- Coincidencia parcial en nombre local
            WHEN LOWER(oni.common_name) LIKE '%' || LOWER(search_term) || '%' AND oni.language_code = user_language THEN 70
            
            -- Coincidencia parcial en científico
            WHEN LOWER(o.scientific_name) LIKE '%' || LOWER(search_term) || '%' THEN 60
            
            -- Coincidencia en nombres alternativos
            WHEN EXISTS (
                SELECT 1 FROM unnest(oni.alternative_names) AS alt 
                WHERE LOWER(alt) LIKE '%' || LOWER(search_term) || '%'
            ) THEN 50
            
            ELSE 0
        END AS relevance_score
    FROM cards c
    JOIN objects o ON c.object_id = o.object_id
    LEFT JOIN object_names_i18n oni ON o.object_id = oni.object_id
    LEFT JOIN object_names_i18n oni_en ON o.object_id = oni_en.object_id AND oni_en.language_code = 'en-US'
    WHERE relevance_score > 0
    ORDER BY relevance_score DESC, o.scientific_name ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Migración de datos existentes

### **7.1 Script de migración**
```sql
-- 1. Crear nueva tabla
CREATE TABLE object_names_i18n ( ... );

-- 2. Migrar datos existentes de "common_name" como 'es-CO'
INSERT INTO object_names_i18n (object_id, language_code, common_name, verified, source)
SELECT 
    object_id,
    'es-CO',
    common_name, -- dato existente
    TRUE,
    'Legacy migration'
FROM objects
WHERE common_name IS NOT NULL;

-- 3. Poblar nombres en inglés desde eBird (manual o API)
-- (Ver sección 8)

-- 4. Eliminar columna obsoleta
ALTER TABLE objects DROP COLUMN common_name;
```

---

## 8. Fuentes de datos por idioma

### **8.1 Fuentes recomendadas**

| Idioma | Fuente principal | URL/API |
|--------|------------------|---------|
| **Científico** | IOC World Bird List | https://www.worldbirdnames.org/ |
| **Inglés (en-US)** | eBird | https://ebird.org/api/v2/ref/taxonomy/ebird |
| **Español (es-CO)** | Asociación Colombiana de Ornitología | https://asociacioncolombianadeornitologia.org/ |
| **Español (es-MX)** | eBird México | https://ebird.org/region/MX |
| **Português (pt-BR)** | WikiAves Brasil | https://www.wikiaves.com.br/ |
| **Français (fr-FR)** | LPO France | https://www.lpo.fr/ |
| **Deutsch (de-DE)** | NABU | https://www.nabu.de/ |
| **Nederlands (nl-NL)** | Vogelbescherming Nederland | https://www.vogelbescherming.nl/ |

---

### **8.2 Script de población (eBird API ejemplo)**
```javascript
// Poblar nombres en inglés desde eBird
const EBIRD_API_KEY = 'tu_api_key';
const EBIRD_TAXONOMY_URL = 'https://api.ebird.org/v2/ref/taxonomy/ebird';

async function populateEnglishNames() {
  // 1. Obtener taxonomía completa de eBird
  const response = await fetch(`${EBIRD_TAXONOMY_URL}?fmt=json`, {
    headers: { 'X-eBirdApiToken': EBIRD_API_KEY }
  });
  
  const taxonomy = await response.json();
  
  // 2. Para cada ave en nuestra BD
  for (const bird of ourDatabase) {
    // 3. Buscar en taxonomía eBird
    const ebirdEntry = taxonomy.find(t => 
      t.sciName === bird.scientific_name
    );
    
    if (ebirdEntry) {
      // 4. Insertar nombre en inglés
      await db.query(`
        INSERT INTO object_names_i18n (object_id, language_code, common_name, verified, source)
        VALUES ($1, 'en-US', $2, TRUE, 'eBird API')
        ON CONFLICT (object_id, language_code) DO UPDATE SET
          common_name = EXCLUDED.common_name,
          updated_at = NOW()
      `, [bird.object_id, ebirdEntry.comName]);
      
      console.log(`✅ ${bird.scientific_name} → ${ebirdEntry.comName}`);
    } else {
      console.warn(`⚠️  ${bird.scientific_name} not found in eBird`);
    }
  }
}
```

---

## 9. Testing de localización

### **9.1 Checklist por idioma**

Para cada idioma soportado:

- [ ] Nombres de aves completos y verificados
- [ ] UI traducida (botones, menús, mensajes)
- [ ] Reglas del juego traducidas
- [ ] Tutoriales traducidos
- [ ] Textos de error traducidos
- [ ] Formato de números local (ej: 1.234,56 vs 1,234.56)
- [ ] Formato de fechas local
- [ ] Testing con hablante nativo

---

### **9.2 Casos de prueba**

**Test 1: Cambio de idioma**
```
DADO un usuario con idioma 'es-CO'
CUANDO cambia a 'nl-NL'
ENTONCES:
  - Toda la UI se traduce a holandés
  - Los nombres de cartas cambian a holandés
  - Los botones y menús están en holandés
  - La app NO se recarga (cambio fluido)
```

**Test 2: Búsqueda multiidioma**
```
DADO un usuario con idioma 'de-DE' (alemán)
CUANDO busca "Steenarend" (holandés)
ENTONCES encuentra "Steinadler" (águila real en alemán)
(búsqueda cross-idioma funcional)
```

**Test 3: Fallback**
```
DADO un ave sin nombre en 'ja-JP' (japonés)
CUANDO un usuario japonés ve la carta
ENTONCES muestra nombre científico como fallback
```

---

## Estado del documento

- **Versión:** v1.0
- **Dependencias:** Esquema-BD.md, Manual-UX-UI.md
- **Última actualización:** Enero 2025

---

**Fin de LOCALIZATION.md v1.0**
```

---

# 📄 **SEPARAR: AUTOMATION_MAKE.md → Documentación interna**

**Crear archivo:** `/internal-docs/AUTOMATION_MAKE_INTERNAL.md` (NO subir a GitHub)

Este archivo contiene:
- API keys de NanoBanana
- Estructura de Google Sheets privada
- Credenciales de Google Drive
- Configuración de Make.com scenarios
- Prompts completos de generación

**En GitHub (público):** Crear `/docs/CONTENT_PIPELINE_PUBLIC.md` con:
- Concepto general del pipeline
- Sin credenciales
- Sin detalles de implementación privados

---

# ✅ **RESUMEN DE CAMBIOS CRÍTICOS**

## **1. Sistema de idiomas rediseñado:**

- ❌ ~~Nombre común único~~ 
- ✅ **Tabla `object_names_i18n`** con nombres en múltiples idiomas
- ✅ Usuario elige su idioma de UI
- ✅ Usuario elige orden de nombres en cartas (`scientific_first`, `local_first`, `english_first`)

## **2. Ejemplo real (Usuario holandés):**
```
Idioma UI: nl-NL (holandés)
Preferencia: local_first

Carta muestra:
┌─────────────────────────┐
│ STEENAREND              │ ← Holandés (local)
│ Aquila chrysaetos       │ ← Científico
│ Golden Eagle            │ ← Inglés (referencia)
└─────────────────────────┘

Botones en UI: "Start", "Collectie", "Instellingen" (todo en holandés)
