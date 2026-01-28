# KYNDO — MANUAL MAESTRO v1.02

## 0. Propósito del documento

Este manual es la **fuente única de verdad** de KYNDO.

- Congela decisiones de diseño, arquitectura y reglas.
- Tiene numeración fija.
- Cualquier cambio futuro requiere **nueva versión**.

---

## 1. Visión general del sistema

**Propósito operativo (one-liner):** KYNDO es un motor de juego que convierte el reconocimiento superficial de objetos reales en **comprensión estratégica progresiva**, usando memoria, reglas explícitas y competencia justa.

**Para quién:** Jugadores que aprenden jugando y compiten entendiendo, no memorizando reglas ocultas.

**Qué problema resuelve:** Evita el aprendizaje pasivo y la ventaja opaca; toda superioridad debe ganarse mediante progreso cognitivo verificable.

---

## 2. Arquitectura conceptual

- **Una sola app**
- **Un solo motor (KYNDO Engine)**
- **Múltiples dominios internos** (aves, fauna, transporte, etc.)

**Flujo lógico del sistema:** Usuario → Dominio activo → Modos (Memory / A/D) → Progresión → Economía → Colección

El usuario solo interactúa con **un dominio activo**. No existe ruido cruzado.

---

## 3. Sistema de cartas (núcleo)

Cada objeto del catálogo global tiene **tres cartas** (A/B/C) registradas en base de datos desde el inicio.

### 3.1 Carta A
- Siempre existe en el catálogo, pero puede requerir **descubrimiento** para ser visible al jugador.
- Muestra información básica del objeto.

### 3.2 Carta B
- Se desbloquea progresando en Memory
- Explica **cómo se forma** el Ataque y la Defensa
- Revela subatributos (factores P/S/W/H/A y AD/C/E/SD/R)

### 3.3 Carta C
- Se desbloquea en niveles altos de Memory
- Activa:
  - Habilidades especiales
  - Bonos situacionales
  - Modificadores tácticos

**Regla:** Esta separación permite escalar el catálogo sin afectar el ritmo de progresión.

---

## 4. Juego Memory (modo cognitivo)

KYNDO **no** usa el memory clásico de parejas simples.

### 4.1 Escalabilidad visual

**Límites por nivel:**

- **Nivel 1 (fundacional):** hasta ~40 cartas por tablero
- **Nivel 2 (avanzado):** hasta ~80 cartas por tablero
- **Nivel 3 (experto):** hasta ~120 cartas por tablero

**Límite práctico:** ~40px por carta en pantalla móvil.

**Nota:** Los "niveles" son modos de juego diferentes. Dentro de cada nivel existen "grados" que aumentan la cantidad de cartas progresivamente.

### 4.2 Mecánicas avanzadas

- Rotaciones dinámicas de:
  - Filas
  - Columnas
  - Bloques
- Cambios siempre **razonables y explicables visualmente**

La dificultad aumenta por:
- Cantidad de cartas
- Movimiento del tablero (Nivel 2+)
- Reducción de intentos
- Similitud visual entre objetos (Nivel 3)

### 4.3 Progresión

El progreso en Memory desbloquea:
- Cartas B
- Cartas C
- Acceso táctico al modo A/D

**Criterio de fallo:**
- Fallar un nivel de Memory **no elimina progreso previo**.
- Aplica penalización temporal (intentos reducidos / enfriamiento).
- Los desbloqueos ya obtenidos no se pierden.

**Objetivo del castigo:** Aumentar foco, no castigar el aprendizaje.

---

## 5. Sistema Ataque / Defensa (A/D)

Sistema **matemáticamente cerrado**.

**Principio de balance:** Ningún objeto debe ser dominante en todos los entornos. La ventaja surge de contexto, habilidad y elección, no de supremacía absoluta.

### 5.1 Factores de Ataque (0–10)

- **P** — Depredación
- **S** — Velocidad
- **W** — Anatomía ofensiva (Weapons)
- **H** — Estrategia de caza (Hunt strategy)
- **A** — Agresividad

### 5.2 Factores de Defensa (0–10)

- **AD** — Adaptabilidad
- **C** — Camuflaje
- **E** — Evasión
- **SD** — Defensa social (Social defense)
- **R** — Robustez

### 5.3 Cálculo

- Pesos fijos (definidos en `rulesets`)
- Normalización a escala 0–99
- Bonos por entorno como porcentajes
- Habilidades (Carta C) aplican **deltas discretos**

**Fórmula base:**
```
Ataque = Σ(Factor × Peso) normalizado a [0, 99]
Defensa = Σ(Factor × Peso) normalizado a [0, 99]
```

### 5.4 Modo competitivo

Incluye:
- Ligas
- MMR (Matchmaking Rating)
- Matchmaking justo
- Combates por rondas (asíncrono)

---

## 6. Economía y colección

- Sistema de packs
- Rarezas (común, raro, épico, legendario)
- Progresión **no pay-to-win**

**Restricción dura:**
- Existe un límite diario/semanal de obtención directa de recursos clave.
- La inflación está controlada por enfriamientos y rendimientos decrecientes.

**La ventaja estratégica proviene de:**
- Conocimiento
- Desbloqueo cognitivo
- Uso inteligente de cartas C

---

## 7. Arquitectura de la app

### 7.1 Módulos

- **Home** (entry point principal)
- **Colección**
- **Memory** (Nivel 1/2/3)
- **A/D** (Battle)
- **Tienda** (futuro)
- **Packs** (futuro)
- **Perfil**
- **Ranking**
- **Motor de IA** (content-time)
- **Base de datos**

**Onboarding recomendado:** Home → Memory → Colección → A/D → Ranking

---

## 8. Estrategia de mercado

- No se crean apps separadas
- Se usa **segmentación perceptual**

**Ejemplo:**
> "Juego de cartas cognitivas de aves"

Aunque el motor sea KYNDO.

**Razón:** Permite marketing específico por nicho sin fragmentar el desarrollo.

---

## 9. Naming

- **Nombre del sistema:** KYNDO
- **Descriptor actual:** *Cognitive Cards Engine*

**Regla:** KYNDO es un nombre no descriptivo por diseño y siempre se acompaña de descriptor contextual en marketing.

**Ejemplos de uso:**
- "KYNDO: Cognitive Bird Cards" (dominio aves)
- "KYNDO: Wildlife Memory" (dominio fauna)
- "KYNDO: Transport Challenge" (dominio transporte)

El nombre puede evolucionar. El sistema no.

---

## 10. Principios no negociables

1. **Una app, un motor**
2. **El conocimiento se gana jugando**
3. **El valor se ve antes de entenderse**
4. **La complejidad se desbloquea, no se impone**
5. **Todo debe escalar sin romperse**
6. **Nada se explica antes de que el jugador lo experimente**

Estos principios definen KYNDO. Violarlos requiere crear un sistema diferente.

---

## 11. Estado del documento

- **Versión:** v1.02
- **Estado:** **Congelado**
- **Última actualización:** Enero 2025

Cualquier cambio requiere **KYNDO Manual Maestro v1.x o v2.0**.

---

## APÉNDICE A — Elementos complementarios integrados (no núcleo)

Este apéndice incorpora **elementos relevantes** provenientes de documentos históricos que **aportan valor**, sin alterar el núcleo congelado del sistema.

### A.1 Sistema visual y pipeline de cartas

Las cartas se componen de:
- **Marco vectorial SVG fijo** (estructura, rareza, iconografía)
- **Arte central generado por IA**

**Regla cognitiva:** Cada objeto debe contar con **mínimo 2 variantes visuales** para reforzar cognición y evitar memorización mecánica.

**Flujo recomendado (content-time):**
1. Definición del SVG base
2. Generación de imágenes IA (NanoBanana o similar)
3. Optimización (PNG 1024 → WebP)
4. Integración en catálogo (JSON/SQLite)
5. Composición final de carta (SVG + arte + metadata)

Este pipeline es **estándar operativo**, no una regla de juego.

### A.2 Modos adicionales contemplados (post-MVP)

Además de Memory y A/D, KYNDO contempla los siguientes modos, **no obligatorios para el núcleo**:

- **Enciclopedia:** Exploración informativa de objetos
- **Quiz:** Identificación y selección correcta
- **Memory experto:** Objetos visualmente similares mezclados

Estos modos reutilizan el mismo mazo y no introducen nuevas reglas base.

### A.3 Conquista Temporal de Cartas (concepto económico avanzado)

KYNDO contempla un sistema opcional de **posesión temporal de cartas** en modos competitivos avanzados:

- El ganador de un duelo puede obtener **temporalmente** una carta del oponente que no posea.
- La carta puede usarse durante un tiempo o número limitado de partidas.
- Al expirar, la carta regresa a su universo de origen.
- Puede ofrecerse adquisición permanente posterior.

**Estado de este sistema:**
- **No es obligatorio**
- **No altera el balance base**
- Se considera una **extensión económica futura**

---

**Nota final:** Ningún elemento de este apéndice modifica los principios no negociables ni el funcionamiento del núcleo KYNDO.

---

**Fin del Manual Maestro v1.02**
