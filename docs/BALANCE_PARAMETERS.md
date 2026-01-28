# ⚖️ PARÁMETROS DE BALANCE — KYNDO MEMORY

**Versión:** 1.0 (Nivel 1)

Este documento consolida **todos los valores editables** del juego para facilitar el balanceo sin tocar la lógica.

---

## 🎯 **Ubicación en el código**

Todos estos parámetros están en la sección:
```javascript
// =========================
// ✅ PARÁMETROS DE BALANCE (EDITABLES)
// =========================
```

**Archivo:** `frontend/memory/index.html` (líneas ~170-175)

---

## 📊 **Parámetros actuales**

### **1. Sistema de racha**
```javascript
const STREAK_BASE_BONUS = 5;
```

**Función:**
- Controla el bono acumulativo por racha de matches consecutivos
- Fórmula: `bonoPorPaso = STREAK_BASE_BONUS × (racha - 1)`

**Valores sugeridos:**

| Valor | Efecto | Uso |
|-------|--------|-----|
| `3` | Racha suave | Casual, principiantes |
| `5` | **Racha media (actual)** | Balanceado |
| `7` | Racha fuerte | Competitivo, expertos |
| `10` | Racha muy fuerte | Modo hardcore |

**Ejemplo con valor 5:**
- Racha 1: +0 bono
- Racha 2: +5 bono
- Racha 3: +10 bono
- Racha 4: +15 bono
- Racha 5: +20 bono

---

### **2. Castigo por repetir error (intentos)**
```javascript
const REPEAT_MISS_EXTRA_ATTEMPTS = 1;
```

**Función:**
- Intentos extra sumados cuando repites un par ya fallado

**Valores sugeridos:**

| Valor | Efecto | Uso |
|-------|--------|-----|
| `0` | Sin castigo de intentos | Modo relajado |
| `1` | **Castigo ligero (actual)** | Balanceado |
| `2` | Castigo medio | Exigente |
| `3` | Castigo fuerte | Hardcore |

---

### **3. Castigo por repetir error (puntos)**
```javascript
const REPEAT_MISS_POINT_PENALTY = 2;
```

**Función:**
- Puntos restados cuando repites un par ya fallado
- El puntaje nunca baja de 0 (clamped)

**Valores sugeridos:**

| Valor | Efecto | Uso |
|-------|--------|-----|
| `0` | Sin castigo de puntos | Modo sin presión |
| `2` | **Castigo ligero (actual)** | Balanceado |
| `5` | Castigo medio | Competitivo |
| `10` | Castigo fuerte | Hardcore |

---

### **4. Factor de límite de intentos**
```javascript
const ATTEMPT_FACTOR = 2.2;
```

**Función:**
- Multiplica el número de pares para obtener el límite de intentos
- Fórmula: `maxAttempts = ceil(totalPares × ATTEMPT_FACTOR)`

**Valores sugeridos:**

| Valor | Efecto | Ejemplo (10 pares) | Uso |
|-------|--------|-------------------|-----|
| `1.5` | Muy exigente | 15 intentos | Modo difícil |
| `2.0` | Exigente | 20 intentos | Competitivo |
| `2.2` | **Balanceado (actual)** | 22 intentos | Normal |
| `2.5` | Generoso | 25 intentos | Casual |
| `3.0` | Muy generoso | 30 intentos | Principiantes |

**Análisis del valor 2.2:**
- Con memoria perfecta necesitas exactamente `totalPares` intentos
- Factor 2.2 = puedes fallar ~12 veces en 10 pares (120% de margen)
- Es **generoso pero requiere eficiencia**

---

## 🎲 **Configuración de grados**
```javascript
const gradeConfig = {
  1: 20,  // 5×4, 10 pares, 22 intentos
  2: 30,  // 6×5, 15 pares, 33 intentos
  3: 42,  // 7×6, 21 pares, 46 intentos
  4: 56,  // 8×7, 28 pares, 62 intentos
  5: 72,  // 9×8, 36 pares, 79 intentos
};
```

**Función:**
- Define cuántas cartas totales tiene cada grado
- Debe ser siempre número PAR (para formar pares)

**Cálculo del grid:**
```javascript
columns = Math.ceil(Math.sqrt(totalCards));
rows = Math.ceil(totalCards / columns);
```

**Tabla de referencia:**

| Grado | Cartas | Pares | Cols | Rows | Grid | Intentos | Carta size (360px) |
|-------|--------|-------|------|------|------|----------|--------------------|
| 1 | 20 | 10 | 5 | 4 | 5×4 | 22 | ~72px |
| 2 | 30 | 15 | 6 | 5 | 6×5 | 33 | ~60px |
| 3 | 42 | 21 | 7 | 6 | 7×6 | 46 | ~51px |
| 4 | 56 | 28 | 8 | 7 | 8×7 | 62 | ~45px |
| 5 | 72 | 36 | 9 | 8 | 9×8 | 79 | ~40px |

**Por qué estos números:**

✅ **Progresión no lineal** (20→30→42→56→72)
- Evita saltos demasiado bruscos
- Mantiene desafío creciente pero manejable
- Los saltos se hacen más grandes conforme avanzas

✅ **Grids cuadrados aproximados**
- `sqrt(20) ≈ 4.5 → 5×4` (muy cercano a cuadrado)
- `sqrt(72) ≈ 8.5 → 9×8` (proporción visual balanceada)
- Evita rectángulos demasiado alargados

✅ **Escalable a mobile**
- En pantalla 360px de ancho:
  - Grado 1: 72px por carta (muy cómodo)
  - Grado 5: 40px por carta (límite recomendado)
- Con gap de 7px entre cartas

✅ **Números pares siempre**
- Todos divisibles por 2 (para formar pares)
- No quedan cartas sueltas

---

### **Valores alternativos (si quieres experimentar)**

#### **Opción A: Progresión más agresiva**
```javascript
{
  1: 20,  // 5×4
  2: 36,  // 6×6 (cuadrado perfecto)
  3: 56,  // 8×7
  4: 81,  // 9×9 (cuadrado perfecto, pero impar - ajustar a 80)
  5: 100, // 10×10
}
```

**Pros:** Saltos más dramáticos, mayor desafío  
**Contras:** Puede ser frustrante, Grado 5 demasiado denso en mobile

#### **Opción B: Progresión más suave**
```javascript
{
  1: 20,  // 5×4
  2: 25,  // 5×5 (cuadrado perfecto, pero impar - ajustar a 24)
  3: 36,  // 6×6
  4: 49,  // 7×7 (impar - ajustar a 48)
  5: 64,  // 8×8
}
```

**Pros:** Incrementos predecibles, fácil de recordar  
**Contras:** Menos desafiante, menos variedad visual

#### **Opción C: Cuadrados perfectos puros**
```javascript
{
  1: 16,  // 4×4
  2: 36,  // 6×6
  3: 64,  // 8×8
  4: 100, // 10×10
  5: 144, // 12×12
}
```

**Pros:** Grids perfectamente cuadrados, estéticamente limpios  
**Contras:** Saltos MUY agresivos, Grado 5 impracticable en mobile

---

### **Recomendación oficial**

**Mantén los valores actuales (20/30/42/56/72)** a menos que el testing con usuarios reales muestre problemas claros.

**Razones:**
- Balanceados por prueba y error
- Funcionan bien en mobile
- Progresión bien calibrada
- No abrumadores ni demasiado fáciles

---

## 🎨 **Parámetros visuales (CSS)**

Estos NO están parametrizados en JS pero podrían estarlo:

### **Gap entre cartas**
```css
#board { gap: 7px; }
```

**Sugerencias:**
- Mobile: 7px (actual)
- Tablet: 10px
- Desktop: 12px

### **Padding del tablero**
```css
#board { padding: 8px; }
```

**Sugerencias:**
- Mobile: 8px (actual)
- Tablet: 12px
- Desktop: 16px

### **Tamaño del overlay (carta grande)**
```css
.focused-card {
  width: 90vw;
  max-width: 350px;
  max-height: 88vh;
}
```

**Ajustar según dispositivo:**
- Mobile: 90vw × 88vh
- Tablet: 70vw × 80vh
- Desktop: 50vw × 70vh

---

## 🎯 **Parámetros de puntuación base**

Estos NO están parametrizados pero podrían serlo:
```javascript
// Puntos por match correcto (hardcoded)
score += 10;
```

**Si quieres hacerlo editable:**
```javascript
const MATCH_BASE_POINTS = 10;

// Luego usar:
score += MATCH_BASE_POINTS;
```

**Valores sugeridos:**
- Casual: 5 puntos
- Normal: 10 puntos (actual)
- Competitivo: 15 puntos
- Hardcore: 20 puntos

---

## 🧪 **Guía de testeo de balance**

### **Proceso recomendado:**

1. **Cambiar UN parámetro a la vez**
2. **Jugar 3-5 partidas completas** del mismo grado
3. **Anotar métricas:**
   - ¿Se siente justo?
   - ¿Es muy fácil/difícil ascender?
   - ¿El puntaje refleja habilidad?
   - ¿La racha se siente recompensante?
4. **Ajustar incrementalmente** (no saltos grandes)
5. **Repetir testing**

### **Métricas objetivo (Grado 1)**

| Métrica | Valor ideal |
|---------|-------------|
| % de usuarios que ascienden | 60-70% |
| Intentos promedio usados | 16-18 (de 22) |
| % de usuarios con racha ≥3 | 40-50% |
| Puntaje promedio | 80-120 |
| Tiempo promedio | 3-5 minutos |

### **Señales de desbalance**

**Demasiado fácil:**
- >85% de usuarios ascienden
- Intentos promedio <14
- Puntajes >150 muy comunes

**Acción:** Reducir `ATTEMPT_FACTOR` a 2.0 o aumentar castigos

**Demasiado difícil:**
- <40% de usuarios ascienden
- Intentos promedio >20
- Frustración en feedback

**Acción:** Aumentar `ATTEMPT_FACTOR` a 2.5 o reducir castigos

---

## 🔄 **Historial de cambios**

### **v1.0 (Enero 2025) — Valores iniciales**
```javascript
STREAK_BASE_BONUS = 5
REPEAT_MISS_EXTRA_ATTEMPTS = 1
REPEAT_MISS_POINT_PENALTY = 2
ATTEMPT_FACTOR = 2.2
gradeConfig = {1:20, 2:30, 3:42, 4:56, 5:72}
```

**Justificación:**
- Balance inicial conservador
- Generoso con intentos (factor 2.2)
- Castigo presente pero no punitivo
- Racha recompensa eficiencia sin ser explosiva

**Resultado observado:**
- [Pendiente testeo con usuarios reales]
- Funcionamiento técnico: ✅ Estable
- Jugabilidad interna: ✅ Balanceado

---

## 🎯 **Presets por perfil de jugador**

### **Perfil: Casual (relajado)**
```javascript
STREAK_BASE_BONUS = 3
REPEAT_MISS_EXTRA_ATTEMPTS = 0
REPEAT_MISS_POINT_PENALTY = 0
ATTEMPT_FACTOR = 2.5
```

**Objetivo:** Disfrutar sin presión, aprender jugando

---

### **Perfil: Normal (actual)**
```javascript
STREAK_BASE_BONUS = 5
REPEAT_MISS_EXTRA_ATTEMPTS = 1
REPEAT_MISS_POINT_PENALTY = 2
ATTEMPT_FACTOR = 2.2
```

**Objetivo:** Balance entre desafío y accesibilidad

---

### **Perfil: Competitivo (desafiante)**
```javascript
STREAK_BASE_BONUS = 7
REPEAT_MISS_EXTRA_ATTEMPTS = 2
REPEAT_MISS_POINT_PENALTY = 5
ATTEMPT_FACTOR = 2.0
```

**Objetivo:** Dominio y eficiencia, alto skill ceiling

---

### **Perfil: Hardcore (punitivo)**
```javascript
STREAK_BASE_BONUS = 10
REPEAT_MISS_EXTRA_ATTEMPTS = 3
REPEAT_MISS_POINT_PENALTY = 10
ATTEMPT_FACTOR = 1.5
```

**Objetivo:** Solo para expertos, memoria casi perfecta requerida

---

## 🚨 **Valores NO recomendados**

| Parámetro | Valor peligroso | Por qué |
|-----------|-----------------|---------|
| `ATTEMPT_FACTOR` | < 1.5 | Casi imposible ascender, frustrante |
| `ATTEMPT_FACTOR` | > 3.5 | Sin desafío real, trivial |
| `STREAK_BASE_BONUS` | > 15 | Explosión de puntaje, desbalanceado |
| `STREAK_BASE_BONUS` | < 2 | Racha no se siente recompensante |
| `REPEAT_MISS_POINT_PENALTY` | > 15 | Castigo desmoralizante |
| `gradeConfig[1]` | < 16 | Grid demasiado pequeño, poco desafío |
| `gradeConfig[5]` | > 100 | Impracticable en mobile, abrumador |

---

## 📝 **Formato para registro de cambios**

Al modificar parámetros, documentar así en CHANGELOG.md:
```markdown
### [2025-02-15] — Ajuste de racha tras testing

**Cambios:**
- `STREAK_BASE_BONUS`: 5 → 7
- `ATTEMPT_FACTOR`: 2.2 → 2.0

**Justificación:**
- Feedback de 50 testers: "muy fácil ascender"
- Puntajes promedio: 140 (objetivo: 80-120)
- % ascenso: 82% (objetivo: 60-70%)

**Resultado esperado:**
- Ascenso más desafiante
- Puntajes más balanceados
- Mayor valor a la racha perfecta

**Resultado real (post-cambio):**
- [Actualizar después de nuevo testing]
```

---

## 🔮 **Futuros parámetros (post-MVP)**

### **Para Memory Nivel 2 (variantes visuales):**
```javascript
const VARIANT_MATCH_BONUS = 15; // bonus por emparejar variantes correctas
const VARIANT_MIS_PENALTY = 5;  // castigo por variantes incorrectas
```

### **Para Memory PvP:**
```javascript
const PVP_TIME_LIMIT = 300;     // 5 minutos por partida
const PVP_VICTORY_MMR = 15;     // MMR ganado por victoria
const PVP_DEFEAT_MMR = -10;     // MMR perdido por derrota
```

### **Para sistema de logros:**
```javascript
const ACHIEVEMENT_THRESHOLDS = {
  perfect_memory: 0,     // 0 fallos
  speed_demon: 120,      // bajo 2 minutos
  comeback_king: 3,      // ganar con ≤3 intentos restantes
};
```

---

**Última actualización:** Enero 2025  
**Próxima revisión:** Después de 100+ partidas jugadas por usuarios reales
