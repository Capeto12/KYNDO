# KYNDO Frontend - Guía Segura de Cambios CSS

## 🎯 TL;DR (Resumen Ultra-Rápido)

**El archivo `frontend/styles.css` es ESTABLE. Si necesitas cambios:**

1. ❌ **NO** reescribas el CSS desde cero
2. ✅ **SÍ** usa Find & Replace para colores específicos
3. ✅ **SÍ** testea en navegador después
4. ✅ **SÍ** mantén un backup antes

---

## 📋 Secciones Críticas del CSS (NO Tocar)

```css
/* Estos 4 estados de cartas DEBEN estar presentes */
.card.hidden { }        /* Estado inicial - "K" visible */
.card.revealed { }      /* Cuando se voltea - muestra contenido */
.card.pending { }       /* Cuando está seleccionada - borde punteado */
.card.matched { }       /* Cuando encuentra pareja - desaparece */

/* Estas animaciones SON CRÍTICAS */
@keyframes cardReveal { }   /* Efecto al voltear */
@keyframes cardMatch { }    /* Efecto al encontrar pareja */

/* Estos selectores son usados por JavaScript */
#board              /* El tablero - manipulado por JS */
#overlay            /* Carta expandida - activada por JS */
#resultOverlay      /* Pantalla de fin de juego */
```

**Si eliminas o cambias radicalmente cualquiera de estos, el juego se rompe.**

---

## 🎨 Cosas SEGURAS de Cambiar

### Color de Fondo del Body
```css
body {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  /* ↓ Puedes cambiar estos colores sin riesgo */
}
```

### Color del Header
```css
header {
  background: #ffffff;
  /* ↓ Cambiar a otro color es seguro */
}
```

### Padding y Márgenes (Espaciado)
```css
header {
  padding: 20px 12px 16px;
  /* ↓ Puedes ajustar esto para compactar/expandir */
}
```

### Tamaños de Fuente
```css
h1 {
  font-size: clamp(48px, 10vw, 64px);
  /* ↓ Ajustar estos valores es seguro */
}
```

### Colores de Texto (excepto cartas)
```css
body {
  color: #111;
  /* ↓ Puedes cambiar, pero testea en todas las páginas */
}
```

---

## ⚠️ Cosas PELIGROSAS

### NO cambiar color de texto de las cartas
```css
.card {
  color: rgba(0, 0, 0, 0.75);  /* ← NO cambies esto a blanco/amarillo */
  /* Si lo haces, el texto de la carta será invisible */
}
```

### NO eliminar .card.revealed
```css
/* ❌ SI ELIMINAS ESTO, las cartas no se ven cuando se voltean */
.card.revealed {
  background: #ffffff;
  border: 1px solid #999;
  animation: cardReveal 0.2s ease;
}
```

### NO cambiar el aspect-ratio de las cartas
```css
.card {
  aspect-ratio: 1 / 1;  /* ← CRÍTICO - mantiene cards cuadradas */
  /* Si lo cambias, las cartas se deforman */
}
```

---

## 🔄 Proceso Seguro para Cambios

### Paso 1: Hacer Backup
```powershell
Copy-Item frontend/styles.css -Destination frontend/styles-FECHA.backup.css
```

### Paso 2: Hacer Cambio Específico
Identifica exactamente QUÉ cambiar:
```css
/* ANTES */
padding: 20px 12px 16px;

/* DESPUÉS */
padding: 10px 12px 8px;  /* Más compacto */
```

### Paso 3: Testear
1. Abre `frontend/index.html` en navegador (F5 para refrescar)
2. Prueba esto:
   - ¿Las cartas aparecen?
   - ¿Se voltean al clickear?
   - ¿Hacen match cuando aciertas?
   - ¿Avanza el grado?
   - ¿Se ve bien en móvil? (redimensiona ventana)

### Paso 4: Si Algo Falla
```powershell
Copy-Item frontend/styles-FECHA.backup.css -Destination frontend/styles.css -Force
```

---

## 🎯 Cambios Específicos que Necesitas

### Si quieres compactar el header:
```css
header {
  padding: 20px 12px 16px;      /* Actual */
  /* Cambiar a: */
  padding: 12px 12px 8px;       /* Más pequeño */
}
```

### Si quieres hacer más grande el HUD:
```css
#hud {
  font-size: 16px;              /* Actual */
  /* Cambiar a: */
  font-size: 18px;              /* Más grande */
}
```

### Si quieres cambiar color del tablero:
```css
body {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  /* Cambiar a: */
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
}
```

---

## 📊 Estructura del Archivo CSS (755 líneas)

```
Líneas 1-50:       Comentarios y variables globales
Líneas 50-150:     Body, header, user info, HUD
Líneas 150-300:    Board (tablero) y .card (estilos base)
Líneas 300-350:    Estados de carta (.hidden, .revealed, .pending, .matched)
Líneas 350-400:    Animaciones (@keyframes)
Líneas 400-550:    #overlay y .focused-card (carta expandida)
Líneas 550-700:    #resultOverlay (pantalla de fin de grado)
Líneas 700-755:    Media queries (responsive design)
```

**SI necesitas cambiar algo, sabe en qué sección está.**

---

## ✅ El CSS Está Correcto Ahora

**Resumen:**
- ✅ Light theme (blanco/gris)
- ✅ Todos los estados de cartas presentes
- ✅ Todas las animaciones funcionando
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Game logic 100% funcional

**Recomendación:** No toques este archivo a menos que necesites cambios específicos documentados. Si necesitas algo, pregunta primero en lugar de modificar.

---

**Última Actualización:** 31-ENE-2026
**Estado:** ✅ ESTABLE - Juego funcionando correctamente
**Backup Original:** `frontend/styles.backup.css` (preservado)
