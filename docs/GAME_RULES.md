## 🎲 **Sistema de grados**

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
