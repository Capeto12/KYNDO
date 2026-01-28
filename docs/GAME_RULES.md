# 🎮 REGLAS DE JUEGO — KYNDO MEMORY

**Versión:** 1.0 (Nivel 1 estabilizado)

---

## 🎯 **Objetivo del juego**

Encontrar todos los pares de cartas en el tablero, **mantenerte dentro del límite de intentos**, y ascender de grado.

> **Filosofía:** KYNDO no premia terminar. Premia recordar, corregir y ser eficiente.

---

## 📐 **Mecánica base: Memory avanzado**

No es un memory clásico. Las diferencias clave:

| Memory clásico | KYNDO Memory |
|----------------|--------------|
| Sin límite de intentos | Límite dinámico por grado |
| No castiga errores | Castiga repetir el mismo error |
| Terminar = ganar | Terminar + eficiencia = ganar |
| Tablero fijo | Tablero crece por grados |

---

## 🎲 **Sistema de grados (Nivel 1)**

Memory Nivel 1 tiene **5 grados** con dificultad creciente basada en cantidad de cartas.

**Diseño del grid:** El tablero crece agregando columnas progresivamente, manteniendo proporción visual.

| Grado | Total cartas | Pares | Grid (cols × rows) | Límite intentos | Cálculo grid |
|-------|--------------|-------|-------------------|-----------------|--------------|
| **1** | 20 | 10 | 5 × 4 | 22 | `ceil(sqrt(20))` = 5 |
| **2** | 30 | 15 | 6 × 5 | 33 | `ceil(sqrt(30))` = 6 |
| **3** | 42 | 21 | 7 × 6 | 46 | `ceil(sqrt(42))` = 7 |
| **4** | 56 | 28 | 8 × 7 | 62 | `ceil(sqrt(56))` = 8 |
| **5** | 72 | 36 | 9 × 8 | 79 | `ceil(sqrt(72))` = 9 |

**Fórmula del grid:**
```javascript
columns = Math.ceil(Math.sqrt(totalCards));
rows = Math.ceil(totalCards / columns);
```

**Ejemplo visual (Grado 1: 20 cartas):**
```
█ █ █ █ █   (5 columnas)
█ █ █ █ █
█ █ █ █ █
█ █ █ █ █   (4 filas)
```

**Ejemplo visual (Grado 2: 30 cartas):**
```
█ █ █ █ █ █   (6 columnas)
█ █ █ █ █ █
█ █ █ █ █ █
█ █ █ █ █ █
█ █ █ █ █ █   (5 filas)
```

**Por qué este diseño:**
- Mantiene proporción cuadrada aproximada
- Evita filas/columnas demasiado largas
- Escalable hasta 100+ cartas
- Mobile-friendly (no requiere scroll horizontal excesivo)

**Cálculo del límite de intentos:**
```
maxAttempts = Math.ceil(totalPares × 2.2)
```

**Ejemplo (Grado 1):**
- 10 pares × 2.2 = 22 intentos máximos
- Si usas 23 intentos → completaste pero **NO asciendes**

---

## 🔄 **Flujo de una partida**

### **1. Inicio**
- Cartas boca abajo (estado `hidden`)
- HUD muestra: pares, intentos, racha, puntaje

### **2. Seleccionar carta**
- Click en carta → se revela (estado `revealed`)
- Overlay grande muestra la carta en detalle
- Click en overlay → cierra el foco

### **3. Seleccionar segunda carta**
- Click en otra carta → se revela
- Overlay muestra segunda carta
- Click en overlay → cierra y evalúa el par

### **4. Evaluación del par**

#### **✅ Si hacen match (mismo objectId):**
- Ambas cartas pasan a estado `matched`
- +1 al contador de pares encontrados
- +1 a la racha actual
- +10 puntos base
- Bono de racha acumulativo
- +1 intento usado

#### **❌ Si NO hacen match:**
- Ambas cartas pasan a estado `pending`
- Racha vuelve a 0
- +1 intento usado
- **Si ya habías fallado este mismo par antes:**
  - +1 intento extra (castigo)
  - -2 puntos (castigo)

### **5. Limpiar cartas pending**
- Las cartas pending (grises con borde punteado) quedan visibles
- **Debes hacer click en cualquier carta o tablero** para limpiarlas
- Vuelven a estado `hidden`
- Puedes continuar jugando

### **6. Fin de partida**

Cuando encuentres todos los pares:

#### **✅ Si intentos ≤ límite:**
- **ASCIENDES** al siguiente grado
- Pantalla de victoria
- Opción de continuar o reintentar

#### **❌ Si intentos > límite:**
- **NO ASCIENDES** (repites el grado)
- Pantalla de nivel completado
- Opción de reintentar

---

## 📊 **Sistema de puntuación**

### **Puntos base por match**
```
+10 puntos por cada par correcto
```

### **Sistema de racha**

La racha es un **multiplicador acumulativo** que premia matches consecutivos.

**Fórmula:**
```
Bono del paso actual = STREAK_BASE_BONUS × (racha - 1)
```

**Ejemplo con `STREAK_BASE_BONUS = 5`:**

| Racha | Bono de ese paso | Puntos totales acumulados |
|-------|------------------|---------------------------|
| 1     | 0                | 10 |
| 2     | 5                | 10 + 15 = 25 |
| 3     | 10               | 25 + 20 = 45 |
| 4     | 15               | 45 + 25 = 70 |
| 5     | 20               | 70 + 30 = 100 |

**Si fallas un par:**
- Racha vuelve a 0
- NO pierdes puntos anteriores
- El siguiente match vuelve a racha 1

---

## ⚠️ **Sistema de castigos**

### **Castigo por repetir el mismo error**

Si fallas un par (ej. AVE 3 con AVE 5) y luego vuelves a intentar ese mismo par incorrecto:

**Primera vez que fallas ese par:**
- +1 intento normal
- Sin castigo adicional
- El par se registra como "fallado"

**Segunda vez que fallas el MISMO par:**
- +1 intento normal
- **+1 intento extra** (castigo)
- **-2 puntos** (castigo, no baja de 0)

**Tercera vez, cuarta vez, etc.:**
- Mismo castigo cada vez (+1 intento, -2 puntos)

**Objetivo:** Aprender del error, no repetirlo mecánicamente.

---

## 🎯 **Condición de victoria (ascenso)**

Para subir al siguiente grado, **DEBES cumplir AMBAS condiciones:**

1. ✅ Encontrar **todos los pares**
2. ✅ Mantenerte **dentro del límite de intentos**

**Ejemplos:**

| Pares | Intentos | Límite | ¿Asciendes? |
|-------|----------|--------|-------------|
| 10/10 | 20 | 22 | ✅ SÍ |
| 10/10 | 22 | 22 | ✅ SÍ |
| 10/10 | 23 | 22 | ❌ NO (repites grado) |
| 9/10 | 15 | 22 | ❌ NO (no terminaste) |

---

## 🧠 **Estrategia óptima**

### **Nivel principiante:**
1. Enfócate en **recordar posiciones**
2. No adivines, espera a tener certeza
3. Evita repetir errores conocidos

### **Nivel intermedio:**
1. Memoriza **grupos de cartas** (ej. "las aves están en la esquina")
2. Usa el overlay para estudiar detalles visuales
3. Calcula tus intentos restantes

### **Nivel avanzado:**
1. Optimiza el orden de búsqueda (elimina opciones)
2. Maximiza la racha (planifica secuencias)
3. Minimiza intentos para puntaje alto

---

## 📱 **Interfaz (HUD)**

Durante el juego ves:
```
🧠 Pares: 7/10
🔁 Intentos: 15/22
🔥 Racha: 3
⭐ Puntaje: 85
Grado: 1
```
---

## 🌐 **Personalización de nombres**

KYNDO permite a cada jugador elegir cómo quiere ver los nombres de las aves en sus cartas.

### **Opciones disponibles:**

#### **1. Nombre científico (por defecto)**

Ideal para: Ornitólogos, científicos, observadores serios
```
┌─────────────────────────┐
│ AQUILA CHRYSAETOS       │ ← Título
│ Golden Eagle            │ ← Subtítulo 1
│ Águila Real             │ ← Subtítulo 2
└─────────────────────────┘
```

**Ventajas:**
- Nomenclatura universal
- Precisa e inequívoca
- Mismo nombre en todo el mundo

---

#### **2. Nombre en inglés**

Ideal para: Observadores internacionales, angloparlantes
```
┌─────────────────────────┐
│ GOLDEN EAGLE            │ ← Título
│ Aquila chrysaetos       │ ← Subtítulo 1
│ Águila Real             │ ← Subtítulo 2
└─────────────────────────┘
```

**Ventajas:**
- Nombres reconocibles globalmente
- Usados en guías de campo internacionales
- Fácil comunicación con observadores de otros países

---

#### **3. Nombre común en Colombia**

Ideal para: Pajareros colombianos, principiantes, observadores locales
```
┌─────────────────────────┐
│ ÁGUILA REAL             │ ← Título
│ Aquila chrysaetos       │ ← Subtítulo 1
│ Golden Eagle            │ ← Subtítulo 2
└─────────────────────────┘
```

**Ventajas:**
- Nombres familiares en español
- Usados en guías de campo colombianas
- Fácil para principiantes

---

### **Cómo cambiar la preferencia:**

1. Ir a **Configuración** (⚙️)
2. Seleccionar **Formato de nombres de cartas**
3. Elegir tu preferencia
4. Ver vista previa
5. Guardar

**El cambio se aplica inmediatamente** a todas tus cartas sin necesidad de reiniciar.

---

### **Preguntas frecuentes**

**¿Puedo tener diferentes formatos para diferentes cartas?**
No. La preferencia es global para todas tus cartas. Esto mantiene consistencia visual.

**¿Otros jugadores ven mis cartas con mi formato?**
No. Cada jugador ve sus propias cartas según su preferencia personal.

**¿El formato afecta el juego?**
No. Es solo visual. La carta sigue siendo la misma internamente.

**¿Puedo cambiar el formato en cualquier momento?**
Sí, sin límite de veces.

**¿El cambio se guarda en la nube?**
Sí, si cambias de dispositivo, mantiene tu preferencia.

---
**Interpretación:**
- Has encontrado 7 de 10 pares
- Usaste 15 de 22 intentos permitidos
- Tienes racha de 3 matches consecutivos
- Tu puntaje actual es 85
- Estás en Grado 1 del Nivel 1

---

## 🎨 **Estados visuales de carta**

| Estado | Visual | Significado |
|--------|--------|-------------|
| `hidden` | Gris, letra "K" | Carta oculta, clickeable |
| `revealed` | Blanco, borde sólido | Carta revelada temporalmente |
| `pending` | Gris claro, borde punteado | Par fallado, esperando limpieza |
| `matched` | Gris, borde grueso, opacidad baja | Par encontrado, no clickeable |

---

## ⚔️ **Modo Competitivo Memory (PvP)**

**Estado:** Planeado para post-MVP prioritario

### **Concepto**

Dos jugadores compiten en el **mismo tablero** (misma seed) para ver quién saca mejor resultado:

**Criterios de victoria (orden):**
1. **Más pares encontrados**
2. **Más puntos** (si empate en pares)
3. **Menos intentos usados** (si empate en puntos)

### **Variantes planeadas**

#### **PvP Asíncrono (prioritario)**
- Jugador A completa su run
- Sistema guarda seed y resultado
- Jugador B intenta superarlo
- Ganador determinado al finalizar ambos

**Ventajas:**
- No requiere tiempo real
- Más fácil de implementar
- Reutiliza toda la lógica existente

#### **PvP Sincrónico (futuro)**
- Ambos jugadores en vivo simultáneamente
- Contador visible compartido
- Presión de tiempo real

### **Scoring en PvP**

**Ejemplo de resultados:**

| Jugador | Pares | Puntos | Intentos | Resultado |
|---------|-------|--------|----------|-----------|
| A | 10/10 | 120 | 18 | ✅ **Gana** (más puntos) |
| B | 10/10 | 95 | 16 | ❌ Pierde |

| Jugador | Pares | Puntos | Intentos | Resultado |
|---------|-------|--------|----------|-----------|
| A | 9/10 | 150 | 15 | ❌ Pierde (menos pares) |
| B | 10/10 | 95 | 20 | ✅ **Gana** (completó todo) |

### **Recompensas (propuesta)**

**Victoria:**
- +15 MMR
- +50 moneda suave
- 10% chance carta temporal (Conquista)

**Derrota:**
- -10 MMR (mínimo 0)
- +10 moneda suave (participación)

**Empate perfecto:**
- Sin cambio MMR
- +25 moneda a ambos

---

## ❓ **Preguntas frecuentes**

### **¿Puedo perder progreso?**
No. Si fallas un grado, simplemente lo repites. No bajas de nivel.

### **¿Hay límite de tiempo?**
No en Nivel 1. Puedes pensar lo necesario.

### **¿Qué pasa si cierro el navegador?**
Tu grado actual se guarda en LocalStorage (MVP). Cuando vuelves, continúas donde estabas.

### **¿Puedo saltar grados?**
No. Debes completar cada grado en orden.

### **¿El límite de intentos es justo?**
Sí. Con factor 2.2, tienes más del doble de intentos que pares. Es generoso pero requiere eficiencia.

### **¿Cuándo llega el modo PvP?**
Es prioridad #1 post-MVP. Estimado: 2-3 semanas después del lanzamiento.

---

## 🔮 **Modos futuros (roadmap)**

- **Quick Mode:** Contra reloj, sin límite de intentos
- **Memory Nivel 2:** Variantes visuales (2+ imágenes por objeto)
- **Memory Nivel 3:** Objetos similares mezclados + contra reloj
- **Battle A/D:** Comparación de atributos ataque/defensa
- **Enciclopedia:** Explorar cartas sin presión

---

**Última actualización:** Enero 2025 (Nivel 1 estabilizado)
