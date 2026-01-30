# 🎨 GUÍA DE CREACIÓN DE CONTENIDO — KYNDO

## 0. Propósito del documento

Esta guía documenta **el proceso completo de creación de contenido** para KYNDO, incluyendo:
- Generación de imágenes con IA (servicios como Replicate, Leonardo.ai, Stable Diffusion)
- Diseño de marcos SVG con Figma
- Optimización de assets
- Integración en el catálogo

**Nota sobre servicios IA:** Esta guía usa "NanoBanana" como placeholder genérico en algunos ejemplos, pero los procesos descritos aplican a cualquier servicio de generación de imágenes por IA (Replicate, Leonardo.ai, Midjourney, Stable Diffusion local, etc.).

---

## 1. Resumen del Estado Actual del Proyecto

### 1.1 ¿Qué está implementado? ✅

**Frontend:**
- ✅ Memory Nivel 1 completamente funcional (Grado 1-5)
- ✅ Sistema de intentos limitados con castigo por repetición
- ✅ Sistema de racha con bonos acumulativos
- ✅ Overlay de foco para visualizar cartas
- ✅ Pantalla de resultados (victoria/no superado)
- ✅ Persistencia local (LocalStorage) del grado actual
- ✅ Grid dinámico escalable (20 → 72 cartas)
- ✅ Responsive mobile-first
- ✅ Interface HTML/CSS/JavaScript vanilla (sin dependencias)

**Contenido:**
- ✅ Estructura JSON para packs de cartas (`pack-1.json`)
- ✅ Catálogo expandido con 40 aves únicas (Guacamaya Roja, Cóndor Andino, Tucán, Quetzal, Águila Harpía, Loro Orejiamarillo, etc.)
- ✅ Estructura de carpetas para contenido (`content/content/birds/`)
- ✅ Suficientes aves para todos los grados del juego (1-5)

**Documentación:**
- ✅ Manual Maestro (principios no negociables)
- ✅ Manual Técnico (arquitectura ejecutable)
- ✅ Manual UX/UI (interfaz y estados)
- ✅ Esquema de Base de Datos (tablas completas)
- ✅ Balance Parameters (valores editables)
- ✅ Game Rules (reglas jugables)
- ✅ Architecture (flujo del código)
- ✅ Roadmap MVP (planificación detallada)

### 1.2 ¿Qué falta por implementar? ⏳

**Backend:**
- ❌ API RESTful (planeado: Node.js o Python)
- ❌ Base de datos en servidor (planeado: PostgreSQL/Supabase)
- ❌ Autenticación de usuarios
- ❌ Sincronización multi-dispositivo
- ❌ Sistema de progreso persistente en servidor

**Contenido:**
- ✅ **40 aves únicas disponibles** (suficiente para todos los grados)
- ⚠️ **Mínimo 2 variantes visuales por objeto** (regla cognitiva - PRIORIDAD)
- ⚠️ Imágenes optimizadas a WebP
- ⚠️ Marco SVG base para cartas (actualmente solo placeholder)
- ⚠️ Factores de Ataque/Defensa asignados a todos los objetos

**Modos de juego:**
- ❌ Memory Nivel 2 (variantes visuales, movimientos de tablero)
- ❌ Memory Nivel 3 (objetos similares, contra reloj)
- ❌ Modo Battle A/D (comparación táctica)
- ❌ Modo Enciclopedia (exploración sin presión)
- ❌ Sistema de colección visual

**Features avanzadas:**
- ❌ Animaciones complejas (partículas, efectos)
- ❌ Sistema de logros
- ❌ Estadísticas históricas
- ❌ Monetización (tienda, packs)
- ❌ Social (amigos, ranking)

### 1.3 Prioridades Inmediatas (según Roadmap MVP v1.2)

**🔥 CRÍTICO para MVP:**

1. **Generación de contenido visual (Fase 1 — Semana 1-2)**
   - Generar 40+ imágenes IA con NanoBanana (2 por objeto × 20 objetos)
   - Diseñar marco SVG base con Figma
   - Optimizar todas las imágenes a WebP
   - Popular catálogo JSON

2. **Base de datos (Fase 1 — Semana 1-2)**
   - Crear esquema completo en PostgreSQL/Supabase
   - Popular tablas: `objects`, `object_images`, `cards`
   - Asignar factores A/D a todos los objetos

3. **Pulido de Memory (Fase 2 — Semana 3-4)**
   - Ya está funcional, solo requiere testing exhaustivo
   - Validar en dispositivos móviles reales

**📊 Progreso estimado del MVP:**
- **Fase 1 (Fundaciones):** 30% completado
- **Fase 2 (Memory Core):** 90% completado ✅
- **Fase 3 (Colección):** 0% no iniciado
- **Fase 4 (Preparación A/D):** 0% no iniciado
- **Fase 5 (Pulido):** 0% no iniciado

**Total:** ~24% del MVP completado

---

## 2. Pipeline de Contenido (Content-Time)

Este proceso se ejecuta **ANTES** de integrar contenido en la app. No ocurre durante runtime.

### 2.1 Visión General del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                  PIPELINE DE CREACIÓN DE CONTENIDO               │
└─────────────────────────────────────────────────────────────────┘

1. INVESTIGACIÓN
   ↓
   → Seleccionar objetos del dominio (ej: 20 aves)
   → Investigar nombres científicos, características
   → Definir factores A/D por objeto (0-10)

2. DISEÑO SVG BASE (Figma)
   ↓
   → Diseñar marco de carta vectorial
   → Definir estructura, iconografía, tipografía
   → Exportar SVG optimizado

3. GENERACIÓN IA (NanoBanana)
   ↓
   → Crear prompt maestro consistente
   → Generar 2+ variantes por objeto
   → Calidad: PNG 1024×1024 mínimo

4. OPTIMIZACIÓN
   ↓
   → Convertir PNG → WebP
   → Comprimir (calidad 85-90)
   → Validar tamaño (<100KB por imagen ideal)

5. CATÁLOGO
   ↓
   → Registrar en JSON (pack-X.json)
   → Asignar IDs únicos
   → Vincular rutas de archivos

6. BASE DE DATOS (futuro)
   ↓
   → Popular tablas: objects, object_images, cards
   → Insertar factores A/D
   → Crear relaciones

7. TESTING
   ↓
   → Probar carga en app
   → Validar visualización
   → Verificar consistencia cognitiva

8. ESCALAR
   ↓
   → Repetir proceso para nuevos objetos
   → Mantener consistencia visual
```

### 2.2 Reglas Obligatorias

1. **Mínimo 2 variantes visuales por objeto** (regla cognitiva)
2. **Consistencia de estilo** entre todas las imágenes del dominio
3. **Optimización obligatoria** (WebP, <100KB ideal)
4. **Naming convention**: `{objeto-id}-{variant}.webp`
5. **Todos los objetos existen en BD desde el inicio** (no se agregan en runtime)

---

## 3. Diseño de Marcos SVG con Figma

### 3.1 ¿Por qué Figma?

Figma es la herramienta recomendada para diseñar el marco base de las cartas por:
- ✅ Vectores escalables (SVG export)
- ✅ Colaboración en tiempo real
- ✅ Componentes reutilizables
- ✅ Prototipado rápido
- ✅ Gratis para uso personal

**Alternativa:** Inkscape (open source, local)

### 3.2 Estructura del Marco de Carta

```
┌─────────────────────────────┐
│     MARCO CARTA KYNDO       │  ← Header (opcional)
├─────────────────────────────┤
│                             │
│                             │
│      [ARTE CENTRAL IA]      │  ← Contenedor 3:4 ratio
│                             │     (aquí va la imagen generada)
│                             │
├─────────────────────────────┤
│    Nombre del Objeto        │  ← Nombre común
├─────────────────────────────┤
│   ATK: 15    DEF: 12        │  ← Stats (Carta A)
└─────────────────────────────┘
```

**Componentes del SVG base:**

1. **Marco exterior**
   - Borde redondeado (border-radius: 10-12px)
   - Color según rareza (futuro: común/raro/épico/legendario)
   - Sombra sutil

2. **Contenedor de imagen central**
   - Aspect ratio: 2:3 (carta vertical estándar)
   - Área reservada para arte IA
   - Background: gris neutro (#e0e0e0) como placeholder

3. **Sección de nombre**
   - Tipografía: Sans-serif bold
   - Tamaño: 14-16px
   - Color: #111 (alto contraste)
   - Align: center

4. **Sección de stats**
   - Layout: flex horizontal
   - Iconos: ATK (⚔️) / DEF (🛡️)
   - Valores numéricos (0-99)

5. **Iconografía fija** (opcional)
   - Logo KYNDO discreto
   - Indicador de rareza
   - Tipo de carta (A/B/C)

### 3.3 Guía Paso a Paso en Figma

#### **Paso 1: Crear archivo base**
```
1. Abrir Figma → New Design File
2. Crear Frame: 300×450px (ratio 2:3)
3. Nombrar: "KYNDO-Card-Base-v1"
```

#### **Paso 2: Diseñar marco exterior**
```
1. Rectangle → 300×450px
2. Border-radius: 12px
3. Fill: Linear gradient (sutil)
   - Top: #f5f5f5
   - Bottom: #e8e8e8
4. Stroke: 2px, #bdbdbd
5. Effects → Drop Shadow:
   - Y: 4px, Blur: 8px, Color: rgba(0,0,0,0.15)
```

#### **Paso 3: Contenedor de imagen**
```
1. Rectangle → 280×320px
2. Position: X:10, Y:10
3. Border-radius: 8px
4. Fill: #e0e0e0 (placeholder)
5. Nombrar capa: "IMAGE_PLACEHOLDER"
```

#### **Paso 4: Sección de nombre**
```
1. Rectangle → 280×50px
2. Position: X:10, Y:340
3. Fill: #ffffff
4. Stroke top: 1px, #cccccc
5. Text:
   - Content: "Nombre del Ave"
   - Font: Inter Bold 15px
   - Color: #111
   - Align: Center, Middle
```

#### **Paso 5: Sección de stats**
```
1. Frame → 280×50px
2. Position: X:10, Y:390
3. Layout: Auto layout horizontal
4. Gap: 20px, Padding: 12px
5. Fill: #fafafa
6. Agregar 2 textos:
   - "ATK: 15" (Left)
   - "DEF: 12" (Right)
   - Font: Inter Medium 13px
   - Color: #333
```

#### **Paso 6: Crear componente reutilizable**
```
1. Seleccionar todo el frame
2. Right-click → "Create Component"
3. Nombrar: "CardBase"
4. Crear variantes:
   - Common (borde gris)
   - Rare (borde azul)
   - Epic (borde morado)
   - Legendary (borde dorado)
```

#### **Paso 7: Exportar SVG**
```
1. Seleccionar componente base
2. Export settings:
   - Format: SVG
   - Outline stroke: ✓
   - Include "id" attribute: ✓
   - Simplify stroke: ✓
3. Export → "card-base.svg"
```

### 3.4 Optimización del SVG Exportado

Después de exportar desde Figma, optimizar el SVG:

```bash
# Usar SVGO (SVG Optimizer)
npm install -g svgo

# Optimizar archivo
svgo card-base.svg -o card-base-optimized.svg

# Flags recomendados:
svgo card-base.svg \
  --multipass \
  --pretty \
  --precision=2 \
  -o card-base-optimized.svg
```

**Resultado esperado:**
- Tamaño original: ~15-30KB
- Tamaño optimizado: ~5-10KB
- Pérdida visual: 0%

### 3.5 Integración SVG + Imagen IA

El SVG base actúa como **contenedor**. La imagen IA se inserta en el placeholder:

```html
<!-- Estructura HTML/CSS para composición -->
<div class="card">
  <svg class="card-frame">
    <!-- SVG optimizado del marco -->
  </svg>
  <img 
    src="path/to/generated-image.webp" 
    class="card-image"
    alt="Nombre del objeto"
  />
  <div class="card-name">Águila Real</div>
  <div class="card-stats">
    <span>ATK: 18</span>
    <span>DEF: 14</span>
  </div>
</div>
```

**Ventajas de esta separación:**
- Marco SVG se carga una vez (reutilizable)
- Imágenes IA se pueden actualizar sin tocar el marco
- Facilita mantenimiento y escalabilidad

---

## 4. Generación de Imágenes con NanoBanana

### 4.1 ¿Qué es NanoBanana?

**NanoBanana** es un ejemplo de servicio de generación de imágenes por IA basado en Stable Diffusion usado en esta guía.

**IMPORTANTE:** El nombre exacto del servicio puede variar. Servicios reales disponibles incluyen:
- **Replicate** (replicate.com) - API de Stable Diffusion pay-per-use
- **Stability AI** (platform.stability.ai) - API oficial de Stable Diffusion
- **Midjourney** (midjourney.com) - Generación por Discord
- **RunPod** (runpod.io) - GPU en la nube para Stable Diffusion
- **Leonardo.ai** (leonardo.ai) - Generación con créditos gratis

Esta guía usa "NanoBanana" como placeholder. **Adapta los pasos a tu servicio elegido.**

**Características:**
- ✅ API REST fácil de usar
- ✅ Modelos pre-entrenados de alta calidad
- ✅ Consistencia de estilo
- ✅ Resolución configurable (hasta 1024×1024)
- ✅ Batch generation (múltiples imágenes por request)

**Servicios reales recomendados:**
- **Replicate** (https://replicate.com) - $0.002-0.02 por imagen
- **Stability AI** (https://platform.stability.ai) - $0.002-0.01 por imagen
- **Leonardo.ai** (https://leonardo.ai) - Incluye créditos gratuitos
- **Midjourney** (https://midjourney.com) - $10/mes básico (200 imágenes)

**Alternativas gratuitas:**
- Stable Diffusion local (gratis pero requiere GPU)
- Google Colab con Stable Diffusion (gratis con limitaciones)

### 4.2 Configuración Inicial

#### **Opción A: Replicate API (Recomendado para producción)**

Replicate ofrece acceso a Stable Diffusion y otros modelos via API REST simple.

1. Crear cuenta en https://replicate.com
2. Obtener API Token desde Dashboard
3. Instalar cliente:

```bash
npm install replicate
# o
pip install replicate
```

4. Configurar credenciales:

```bash
# .env
REPLICATE_API_TOKEN=tu_token_aqui
```

#### **Opción B: Leonardo.ai (Gratis para empezar)**

Leonardo.ai incluye créditos gratuitos diarios.

1. Crear cuenta en https://leonardo.ai
2. Obtener API Key (si usas API)
3. O usar interfaz web (no requiere programación)

#### **Opción C: Stable Diffusion Local (Para testing)**

```bash
# Requiere: GPU NVIDIA, 8GB+ VRAM, Python 3.10+

# Clonar Automatic1111 WebUI
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui

# Instalar
bash webui.sh

# Acceder a: http://localhost:7860
```

### 4.3 Creación del Prompt Maestro

**Reglas de oro para prompts consistentes:**

1. **Estructura fija** para todo el dominio
2. **Keywords consistentes** (estilo, iluminación, encuadre)
3. **Negative prompts** para evitar elementos no deseados
4. **Seed control** para variaciones predecibles

#### **Ejemplo: Prompt Maestro para Dominio Aves**

```
# PROMPT BASE (POSITIVO)
A highly detailed digital illustration of a [NOMBRE_AVE] bird, 
full body view, centered composition, wildlife photography style, 
natural habitat background softly blurred, vibrant colors, 
photorealistic textures, professional nature documentary quality, 
studio lighting with soft shadows, sharp focus on subject, 
8K resolution, trending on Artstation

# NEGATIVE PROMPT (lo que NO queremos)
cartoon, anime, watermark, text, signature, blurry, low quality, 
distorted, abstract, multiple subjects, cropped, ugly, mutation, 
extra limbs, bad anatomy, humans, buildings, vehicles
```

**Variables a reemplazar por objeto:**
- `[NOMBRE_AVE]`: "Águila Real" / "Halcón Peregrino" / etc.
- `[HABITAT]` (opcional): "mountain cliff" / "tropical forest" / etc.

#### **Ejemplo: Variantes para un mismo objeto**

Para generar 2+ variantes del mismo objeto, modificar:

**Variante 1: Pose frontal**
```
... centered frontal view, wings slightly spread, 
perched on branch, looking at camera ...
```

**Variante 2: Pose lateral**
```
... side profile view, wings folded, 
standing on rocky surface, head turned 45 degrees ...
```

**Variante 3: Pose en vuelo** (opcional, Nivel 2+)
```
... dynamic flying pose, wings fully extended, 
soaring through clear blue sky, motion blur on wingtips ...
```

### 4.4 Script de Generación Batch

Automatizar generación para múltiples objetos usando Replicate API:

```javascript
// generate-birds.js (Node.js example with Replicate)
const Replicate = require('replicate');
const fs = require('fs');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const birds = [
  { id: 'aguila-real', name: 'Águila Real', habitat: 'mountain cliff' },
  { id: 'halcon-peregrino', name: 'Halcón Peregrino', habitat: 'coastal cliff' },
  { id: 'condor-andino', name: 'Cóndor Andino', habitat: 'high mountains' },
  // ... 17 más para completar 20
];

const basePrompt = `A highly detailed digital illustration of a {name} bird, 
full body view, centered composition, wildlife photography style, 
natural habitat ({habitat}) background softly blurred, vibrant colors, 
photorealistic textures, professional nature documentary quality, 
studio lighting with soft shadows, sharp focus on subject, 
8K resolution, trending on Artstation`;

const negativePrompt = `cartoon, anime, watermark, text, signature, blurry, 
low quality, distorted, abstract, multiple subjects, cropped, ugly, 
mutation, extra limbs, bad anatomy, humans, buildings, vehicles`;

async function generateBirdImages() {
  for (const bird of birds) {
    console.log(`Generando variantes para: ${bird.name}`);
    
    // Generar 2 variantes (frontal + lateral)
    const variants = [
      { suffix: 'variant-1', pose: 'centered frontal view, wings slightly spread' },
      { suffix: 'variant-2', pose: 'side profile view, wings folded' }
    ];
    
    for (const variant of variants) {
      const fullPrompt = basePrompt
        .replace('{name}', bird.name)
        .replace('{habitat}', bird.habitat)
        + `, ${variant.pose}`;
      
      try {
        // Usar modelo Stable Diffusion XL en Replicate
        const output = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              prompt: fullPrompt,
              negative_prompt: negativePrompt,
              width: 1024,
              height: 1024,
              num_inference_steps: 30,
              guidance_scale: 7.5,
            }
          }
        );
        
        // Output es un array con URLs de imágenes
        const imageUrl = output[0];
        
        // Descargar imagen
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        // Guardar imagen
        const filename = `content/birds/img/${bird.id}-${variant.suffix}.png`;
        fs.writeFileSync(filename, buffer);
        console.log(`✓ Guardado: ${filename}`);
        
        // Pausa para no saturar API (respetar rate limits)
        await sleep(5000);
        
      } catch (error) {
        console.error(`✗ Error generando ${bird.id}: ${error.message}`);
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

generateBirdImages().then(() => {
  console.log('✅ Generación completa');
}).catch(err => {
  console.error('Error fatal:', err);
});
```

**Ejecutar:**
```bash
# Instalar dependencias
npm install replicate node-fetch

# Configurar token
export REPLICATE_API_TOKEN=tu_token_aqui

# Ejecutar
node generate-birds.js
```

**Nota:** Adapta el modelo y parámetros según el servicio que uses (Replicate, Leonardo.ai, etc.).

### 4.5 Control de Calidad de Imágenes IA

Después de generar, revisar cada imagen para:

**✅ Criterios de aceptación:**
- Objeto claramente identificable
- Sin mutaciones anatómicas obvias
- Background apropiado (no distrae del sujeto)
- Encuadre correcto (objeto no cortado)
- Colores vibrantes y naturales
- Resolución adecuada (1024×1024 mínimo)

**❌ Rechazar si:**
- Anatomía incorrecta (ej: 3 patas, alas deformadas)
- Texto/watermarks visibles
- Múltiples sujetos confusos
- Desenfoque excesivo
- Colores apagados o artificiales

**Regenerar** imágenes rechazadas con:
- Seed diferente
- Prompt ajustado
- Steps aumentados (30 → 50)
- CFG Scale ajustado (7.5 → 8.5)

---

## 5. Optimización de Assets

### 5.1 Conversión PNG → WebP

**¿Por qué WebP?**
- ✅ 25-35% más pequeño que PNG (misma calidad visual)
- ✅ Soportado en todos los navegadores modernos
- ✅ Mantiene transparencia (alpha channel)
- ✅ Compresión lossy y lossless

#### **Método 1: cwebp (CLI)**

```bash
# Instalar cwebp
# macOS:
brew install webp

# Ubuntu/Debian:
sudo apt-get install webp

# Windows:
# Descargar desde: https://developers.google.com/speed/webp/download

# Convertir imagen individual
cwebp -q 85 input.png -o output.webp

# Batch conversion (bash)
for file in content/birds/img/*.png; do
  cwebp -q 85 "$file" -o "${file%.png}.webp"
done
```

**Parámetros recomendados:**
- `-q 85`: Calidad 85% (balance perfecto)
- `-m 6`: Método 6 (más lento pero mejor compresión)
- `-mt`: Multithread (más rápido)

**Comando optimizado:**
```bash
cwebp -q 85 -m 6 -mt input.png -o output.webp
```

#### **Método 2: squoosh.app (GUI online)**

1. Ir a https://squoosh.app
2. Drag & drop imagen PNG
3. Seleccionar formato: WebP
4. Ajustar quality: 85
5. Comparar lado a lado (original vs comprimido)
6. Download

**Ventajas:**
- No requiere instalación
- Preview visual en tiempo real
- Ajustes precisos de calidad

#### **Método 3: Script Node.js**

```javascript
// optimize-images.js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function optimizeImages(inputDir, outputDir) {
  const files = await fs.readdir(inputDir);
  const pngFiles = files.filter(f => f.endsWith('.png'));
  
  for (const file of pngFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
    
    try {
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);
      
      const inputStats = await fs.stat(inputPath);
      const outputStats = await fs.stat(outputPath);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`✓ ${file} → ${path.basename(outputPath)} (${reduction}% smaller)`);
    } catch (error) {
      console.error(`✗ Error: ${file}`, error.message);
    }
  }
}

// Ejecutar
optimizeImages('content/birds/img', 'content/birds/img-optimized')
  .then(() => console.log('✅ Optimización completa'))
  .catch(err => console.error('Error:', err));
```

**Instalar dependencias:**
```bash
npm install sharp
node optimize-images.js
```

### 5.2 Validación de Tamaño

**Objetivo:** <100KB por imagen (ideal para mobile)

```bash
# Verificar tamaños
du -h content/birds/img/*.webp

# Listar imágenes >100KB
find content/birds/img -name "*.webp" -size +100k -exec ls -lh {} \;
```

**Si una imagen supera 100KB:**
- Reducir quality: 85 → 80 → 75
- Reducir dimensiones: 1024×1024 → 800×800
- Usar `-sharp_yuv` en cwebp para mejor compresión

```bash
cwebp -q 80 -sharp_yuv -m 6 input.png -o output.webp
```

### 5.3 Lazy Loading (Implementación en App)

Para mejorar performance con muchas imágenes:

```html
<!-- HTML con loading lazy -->
<img 
  src="content/birds/img/aguila-real-variant-1.webp"
  alt="Águila Real"
  loading="lazy"
  width="300"
  height="450"
/>
```

**JavaScript para progressive loading:**
```javascript
// Cargar imágenes solo cuando están por ser visibles
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

images.forEach(img => imageObserver.observe(img));
```

---

## 6. Integración en Catálogo JSON

### 6.1 Estructura del Pack JSON

```json
{
  "packId": "birds-pack-1",
  "title": "Aves de América",
  "version": 1,
  "count": 20,
  "assets": [
    {
      "id": "aguila-real",
      "objectId": 1,
      "commonName": "Águila Real",
      "scientificName": "Aquila chrysaetos",
      "variants": [
        {
          "variantId": 1,
          "imageUrl": "content/birds/img/aguila-real-variant-1.webp",
          "pose": "frontal"
        },
        {
          "variantId": 2,
          "imageUrl": "content/birds/img/aguila-real-variant-2.webp",
          "pose": "lateral"
        }
      ],
      "attackFactors": {
        "P": 9,
        "S": 8,
        "W": 9,
        "H": 8,
        "A": 7
      },
      "defenseFactors": {
        "AD": 7,
        "C": 5,
        "E": 8,
        "SD": 4,
        "R": 8
      },
      "calculatedStats": {
        "attack": 82,
        "defense": 64
      },
      "rarity": "epic",
      "domain": "birds"
    }
    // ... 19 objetos más
  ],
  "metadata": {
    "createdAt": "2025-01-28",
    "author": "KYNDO Team",
    "aiModel": "NanoBanana v2.1 / Stable Diffusion XL",
    "totalVariants": 40
  }
}
```

### 6.2 Script de Generación Automática

```javascript
// build-catalog.js
const fs = require('fs');
const path = require('path');

const birdsData = [
  {
    id: 'aguila-real',
    commonName: 'Águila Real',
    scientificName: 'Aquila chrysaetos',
    attackFactors: { P: 9, S: 8, W: 9, H: 8, A: 7 },
    defenseFactors: { AD: 7, C: 5, E: 8, SD: 4, R: 8 },
    rarity: 'epic'
  },
  {
    id: 'halcon-peregrino',
    commonName: 'Halcón Peregrino',
    scientificName: 'Falco peregrinus',
    attackFactors: { P: 8, S: 10, W: 7, H: 9, A: 8 },
    defenseFactors: { AD: 8, C: 6, E: 9, SD: 3, R: 6 },
    rarity: 'rare'
  },
  // ... más aves
];

function calculateStats(factors, ruleset = 'v1.0.0') {
  // Simplificación: promedio ponderado normalizado a 0-99
  const atkSum = Object.values(factors.attack).reduce((a, b) => a + b, 0);
  const defSum = Object.values(factors.defense).reduce((a, b) => a + b, 0);
  
  return {
    attack: Math.round((atkSum / 50) * 99), // 50 = máximo teórico (5 factores × 10)
    defense: Math.round((defSum / 50) * 99)
  };
}

function buildPack(birds, packId = 'birds-pack-1') {
  const assets = birds.map((bird, index) => {
    const variants = [1, 2].map(variantNum => ({
      variantId: variantNum,
      imageUrl: `content/birds/img/${bird.id}-variant-${variantNum}.webp`,
      pose: variantNum === 1 ? 'frontal' : 'lateral'
    }));
    
    return {
      id: bird.id,
      objectId: index + 1,
      commonName: bird.commonName,
      scientificName: bird.scientificName,
      variants,
      attackFactors: bird.attackFactors,
      defenseFactors: bird.defenseFactors,
      calculatedStats: calculateStats({
        attack: bird.attackFactors,
        defense: bird.defenseFactors
      }),
      rarity: bird.rarity,
      domain: 'birds'
    };
  });
  
  const pack = {
    packId,
    title: 'Aves de América',
    version: 1,
    count: birds.length,
    assets,
    metadata: {
      createdAt: new Date().toISOString().split('T')[0],
      author: 'KYNDO Team',
      aiModel: 'NanoBanana v2.1 / Stable Diffusion XL',
      totalVariants: birds.length * 2
    }
  };
  
  return pack;
}

// Generar y guardar
const pack = buildPack(birdsData);
const outputPath = 'content/content/birds/pack-1.json';

fs.writeFileSync(outputPath, JSON.stringify(pack, null, 2));
console.log(`✅ Catálogo generado: ${outputPath}`);
console.log(`   Total objetos: ${pack.count}`);
console.log(`   Total variantes: ${pack.metadata.totalVariants}`);
```

**Ejecutar:**
```bash
node build-catalog.js
```

### 6.3 Validación del Catálogo

```javascript
// validate-catalog.js
const fs = require('fs');
const path = require('path');

function validatePack(packPath) {
  console.log(`Validando: ${packPath}`);
  
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf-8'));
  const errors = [];
  
  // 1. Estructura básica
  if (!pack.packId) errors.push('❌ Falta packId');
  if (!pack.assets || !Array.isArray(pack.assets)) {
    errors.push('❌ Falta assets array');
    return errors;
  }
  
  // 2. Validar cada asset
  pack.assets.forEach((asset, idx) => {
    const prefix = `Asset #${idx + 1} (${asset.id || 'sin id'})`;
    
    // Campos obligatorios
    if (!asset.id) errors.push(`${prefix}: ❌ Falta id`);
    if (!asset.commonName) errors.push(`${prefix}: ❌ Falta commonName`);
    if (!asset.variants || asset.variants.length < 2) {
      errors.push(`${prefix}: ❌ Necesita mínimo 2 variantes (regla cognitiva)`);
    }
    
    // Validar variantes
    asset.variants?.forEach((variant, vIdx) => {
      const vPrefix = `${prefix} Variante #${vIdx + 1}`;
      if (!variant.imageUrl) {
        errors.push(`${vPrefix}: ❌ Falta imageUrl`);
      } else {
        // Verificar que el archivo exista
        const fullPath = path.join(__dirname, variant.imageUrl);
        if (!fs.existsSync(fullPath)) {
          errors.push(`${vPrefix}: ⚠️ Archivo no encontrado: ${variant.imageUrl}`);
        }
      }
    });
    
    // Validar factores A/D
    const requiredAttackFactors = ['P', 'S', 'W', 'H', 'A'];
    const requiredDefenseFactors = ['AD', 'C', 'E', 'SD', 'R'];
    
    requiredAttackFactors.forEach(factor => {
      if (asset.attackFactors?.[factor] === undefined) {
        errors.push(`${prefix}: ❌ Falta attackFactor ${factor}`);
      }
    });
    
    requiredDefenseFactors.forEach(factor => {
      if (asset.defenseFactors?.[factor] === undefined) {
        errors.push(`${prefix}: ❌ Falta defenseFactor ${factor}`);
      }
    });
  });
  
  // 3. Resumen
  if (errors.length === 0) {
    console.log(`✅ Validación exitosa`);
    console.log(`   Objetos: ${pack.assets.length}`);
    console.log(`   Variantes totales: ${pack.assets.reduce((sum, a) => sum + a.variants.length, 0)}`);
  } else {
    console.log(`❌ Encontrados ${errors.length} errores:\n`);
    errors.forEach(err => console.log(`   ${err}`));
  }
  
  return errors;
}

// Ejecutar
const errors = validatePack('content/content/birds/pack-1.json');
process.exit(errors.length > 0 ? 1 : 0);
```

**Ejecutar:**
```bash
node validate-catalog.js
```

---

## 7. Checklist de Creación de Contenido

### 7.1 Checklist por Objeto

Para cada objeto nuevo (ej: "Águila Real"):

- [ ] **Investigación**
  - [ ] Nombre común definido
  - [ ] Nombre científico confirmado
  - [ ] Características relevantes documentadas
  - [ ] Factores A/D asignados (P/S/W/H/A, AD/C/E/SD/R)

- [ ] **Generación IA**
  - [ ] Prompt maestro adaptado para este objeto
  - [ ] Variante 1 generada (pose frontal)
  - [ ] Variante 2 generada (pose lateral)
  - [ ] Variante 3+ generada (opcional para Nivel 2+)
  - [ ] Calidad validada (sin mutaciones, buen encuadre)

- [ ] **Optimización**
  - [ ] Todas las variantes convertidas a WebP
  - [ ] Tamaño validado (<100KB ideal)
  - [ ] Naming convention aplicado (`{id}-variant-{n}.webp`)
  - [ ] Archivos movidos a carpeta correcta

- [ ] **Catálogo**
  - [ ] Objeto agregado a `pack-X.json`
  - [ ] Rutas de imágenes correctas
  - [ ] Factores A/D incluidos
  - [ ] Stats calculados (attack/defense)
  - [ ] Rareza asignada

- [ ] **Validación**
  - [ ] Script de validación ejecutado sin errores
  - [ ] Imágenes cargadas correctamente en app
  - [ ] Visualización verificada en mobile
  - [ ] Consistencia de estilo confirmada

### 7.2 Checklist para Pack Completo

Para completar un pack (ej: "Birds Pack 1" con 20 objetos):

- [ ] **Contenido**
  - [ ] 20+ objetos creados
  - [ ] 40+ variantes generadas (mínimo 2 por objeto)
  - [ ] Todos los objetos optimizados a WebP
  - [ ] Todas las rutas validadas

- [ ] **Marco SVG**
  - [ ] Marco base diseñado en Figma
  - [ ] SVG exportado y optimizado
  - [ ] Componentes reutilizables creados
  - [ ] Variantes de rareza implementadas (común/raro/épico/legendario)

- [ ] **Catálogo**
  - [ ] `pack-1.json` generado
  - [ ] Todos los campos obligatorios presentes
  - [ ] Factores A/D completos para todos los objetos
  - [ ] Metadata del pack incluida

- [ ] **Base de Datos** (cuando backend esté listo)
  - [ ] Tabla `objects` populada
  - [ ] Tabla `object_images` populada
  - [ ] Tabla `cards` creada (A/B/C por objeto)
  - [ ] Tabla `attack_factors` populada
  - [ ] Tabla `defense_factors` populada

- [ ] **Testing**
  - [ ] Pack carga correctamente en app
  - [ ] Memory Nivel 1 funciona con nuevo contenido
  - [ ] Performance validada (grados 1-5)
  - [ ] Visualización en diferentes dispositivos
  - [ ] Consistencia cognitiva confirmada (objetos son distinguibles)

- [ ] **Documentación**
  - [ ] Pack documentado en README
  - [ ] Créditos de generación IA incluidos
  - [ ] Changelog actualizado

---

## 8. Herramientas y Recursos

### 8.1 Software Requerido

| Herramienta | Propósito | Instalación | Costo |
|-------------|-----------|-------------|-------|
| **Figma** | Diseño SVG | https://figma.com | Gratis |
| **Replicate** | Generación IA | https://replicate.com | API Paga ($0.002-0.02/img) |
| **Leonardo.ai** | Generación IA | https://leonardo.ai | Freemium (créditos gratis) |
| **cwebp** | Optimización WebP | `brew install webp` | Gratis |
| **Node.js** | Scripts automatización | https://nodejs.org | Gratis |
| **VS Code** | Editor código | https://code.visualstudio.com | Gratis |
| **Git** | Control versiones | https://git-scm.com | Gratis |

### 8.2 Alternativas Open Source

| Comercial | Open Source | Notas |
|-----------|-------------|-------|
| Figma | **Inkscape** | Vectores, gratis, local |
| Replicate/Leonardo.ai | **Stable Diffusion (local)** | Requiere GPU, más lento |
| Photoshop | **GIMP** | Edición raster |
| Adobe XD | **Penpot** | Diseño web, open source |

### 8.3 Recursos Útiles

**Prompts y tutoriales:**
- Stable Diffusion Prompt Guide: https://prompthero.com/stable-diffusion-prompt-guide
- Lexica Art (inspiración prompts): https://lexica.art

**Optimización de imágenes:**
- Squoosh: https://squoosh.app
- TinyPNG: https://tinypng.com
- ImageOptim (Mac): https://imageoptim.com

**Bancos de referencia (para investigación):**
- iNaturalist: https://www.inaturalist.org
- All About Birds (Cornell Lab): https://www.allaboutbirds.org
- Wikipedia (nombres científicos)

**SVG:**
- SVGO: https://github.com/svg/svgo
- SVG OMG (GUI): https://jakearchibald.github.io/svgomg/

---

## 9. FAQ — Preguntas Frecuentes

### Q1: ¿Cuánto cuesta generar 40 imágenes con servicios IA?

**A:** Costos aproximados:
- **Replicate (Stable Diffusion XL):** ~$0.002-0.02 por imagen → $0.08-$0.80 total
- **Leonardo.ai:** Incluye créditos gratuitos diarios (suficiente para empezar)
- **Midjourney:** $10/mes básico → ~200 imágenes incluidas
- **Stability AI:** ~$0.002-0.01 por imagen → $0.08-$0.40 total

Alternativa gratis: Stable Diffusion local (requiere GPU NVIDIA).

### Q2: ¿Puedo usar imágenes reales en vez de IA?

**A:** Sí, pero con consideraciones:
- ✅ Verificar licencia (Creative Commons, dominio público)
- ✅ Dar crédito al autor
- ⚠️ Difícil mantener consistencia de estilo
- ⚠️ Puede requerir edición para normalizar backgrounds

### Q3: ¿Qué pasa si una imagen IA tiene anatomía incorrecta?

**A:** Opciones:
1. **Regenerar** con seed diferente
2. **Editar** con Photoshop/GIMP (corrección manual)
3. **Descartar** y usar otra variante
4. **Ajustar prompt** para ser más específico

No uses imágenes con errores anatómicos evidentes (confunde el aprendizaje cognitivo).

### Q4: ¿Debo crear el marco SVG primero o las imágenes IA primero?

**A:** Recomendado: **Imágenes IA primero**.

Razón: Las imágenes definen el estilo visual. El marco SVG debe complementarlas, no competir.

Workflow ideal:
1. Generar 5-10 imágenes IA de prueba
2. Evaluar estilo resultante (realista/artístico/ilustrativo)
3. Diseñar marco SVG que armonice con ese estilo
4. Generar resto de imágenes

### Q5: ¿Cuántas variantes necesito realmente por objeto?

**A:** 
- **MVP (Memory Nivel 1):** 2 variantes mínimo
- **Memory Nivel 2:** 3-4 variantes (diferentes poses/ángulos)
- **Memory Nivel 3:** 4+ variantes (diferentes contextos)

Empezar con 2. Escalar después según necesidad.

### Q6: ¿Qué hago si mi GPU no puede correr Stable Diffusion local?

**A:** Opciones:
1. Usar **Replicate API** (pay-per-use, muy accesible)
2. Usar **Leonardo.ai** (créditos gratuitos diarios)
3. Usar **Google Colab** (gratis con GPU en la nube, tiene límites)
4. Usar **RunPod** (GPU en la nube por horas, $0.20-0.50/hora)
5. Usar **Midjourney** (Discord bot, $10/mes plan básico, 200 imágenes)

### Q7: ¿Cómo asigno los factores A/D sin experiencia en balance?

**A:** Guía rápida por objeto (escala 0-10):

**Factores de Ataque:**
- **P (Depredación):** ¿Es depredador? (Águila: 9, Colibrí: 1)
- **S (Velocidad):** ¿Qué tan rápido? (Halcón: 10, Búho: 5)
- **W (Armas):** ¿Garras/pico potentes? (Cóndor: 8, Loro: 3)
- **H (Estrategia):** ¿Cazador inteligente? (Águila: 8, Pelícano: 4)
- **A (Agresividad):** ¿Territorial/agresivo? (Halcón: 9, Paloma: 2)

**Factores de Defensa:**
- **AD (Adaptabilidad):** ¿Sobrevive en varios hábitats? (Cuervo: 9, Pingüino: 5)
- **C (Camuflaje):** ¿Se mimetiza bien? (Búho: 8, Flamenco: 2)
- **E (Evasión):** ¿Esquiva amenazas? (Colibrí: 10, Avestruz: 3)
- **SD (Defensa Social):** ¿Protección grupal? (Pingüino: 9, Águila: 2)
- **R (Robustez):** ¿Resistente físicamente? (Cóndor: 9, Colibrí: 2)

**Usar sentido común y documentación naturalista.**

### Q8: ¿Dónde guardo los archivos fuente (PNG pre-optimización)?

**A:** Estructura recomendada:

```
content/
├── birds/
│   ├── source/           ← PNG originales (no commitear a git)
│   │   ├── aguila-real-variant-1.png
│   │   └── ...
│   ├── img/              ← WebP optimizados (commitear)
│   │   ├── aguila-real-variant-1.webp
│   │   └── ...
│   └── pack-1.json
└── .gitignore            ← Ignorar /source/
```

**`.gitignore`:**
```
content/**/source/
*.png
!*.webp
```

Razón: PNG ocupa mucho espacio en Git. Solo versionar WebP finales.

---

## 10. Próximos Pasos

### 10.1 Para completar MVP (Fase 1)

**Prioridad ALTA:**

1. **✅ 40 objetos únicos completos** (actualmente: 40)
   - [x] Investigar aves adicionales de América Latina
   - [ ] Generar 80 imágenes IA (2 variantes por ave para Memory Nivel 2-3)
   - [ ] Optimizar a WebP
   - [x] Actualizar `pack-1.json`

2. **Diseñar marco SVG base**
   - [ ] Crear diseño en Figma
   - [ ] Exportar y optimizar SVG
   - [ ] Integrar en frontend (reemplazar placeholder actual)

3. **Asignar factores A/D**
   - [ ] Completar tabla de factores para todos los objetos
   - [ ] Validar balance básico
   - [ ] Agregar a `pack-1.json`

### 10.2 Para post-MVP (Fase 2+)

**Prioridad MEDIA:**

1. **Escalar a 50 objetos** (Nivel 1 completo)
2. **Crear pack-2.json** (otro dominio o expansión aves)
3. **Generar variantes adicionales** (3-4 por objeto para Nivel 2)
4. **Crear marcos SVG por rareza** (común/raro/épico/legendario)

**Prioridad BAJA:**

1. Animaciones de desbloqueo de cartas
2. Efectos visuales (partículas, brillo)
3. Sonidos al revelar cartas

---

## 11. Contacto y Soporte

**Para preguntas sobre contenido:**
- Abrir issue en GitHub con tag `content`
- Mencionar este documento: `CONTENT_CREATION_GUIDE.md`

**Para reportar problemas con generación IA:**
- Incluir prompt usado
- Adjuntar imagen problemática
- Describir error específico

**Para sugerir mejoras a este pipeline:**
- Pull request con cambios propuestos
- Documentar razón del cambio

---

## 12. Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2025-01-28 | Documento inicial. Pipeline completo documentado. Incluye Figma, NanoBanana, optimización WebP. |

---

**Última actualización:** Enero 2025

**Estado del MVP:** ~24% completado (Memory funcional, falta contenido y backend)

**Próximo hito:** Completar generación de 20 objetos (Fase 1)

---

**Fin de la Guía de Creación de Contenido v1.0**
