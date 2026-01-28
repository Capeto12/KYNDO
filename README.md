# 🎮 KYNDO — Cognitive Card Game Engine

**Motor de juegos cognitivos que convierte reconocimiento superficial en comprensión estratégica progresiva.**

> *KYNDO no premia terminar. Premia recordar, corregir y ser eficiente.*

---

## 🎯 **¿Qué es KYNDO?**

Sistema de cartas enciclopédicas + juegos combinados con:

- ✅ **Progresión basada en eficiencia** (no solo completar)
- ✅ **Castigo por repetir errores** (aprendizaje real)
- ✅ **Sistema de racha** con bonos acumulativos
- ✅ **Un mazo universal** para múltiples modos de juego
- ✅ **Escalabilidad cognitiva** (20 → 120+ cartas)

**Filosofía:** El conocimiento se gana jugando. El valor se ve antes de entenderse. La complejidad se desbloquea, no se impone.

---

## 📂 **Estructura del proyecto**
```
kyndo/
├── frontend/              # App web (HTML/JS/CSS)
│   └── memory/
│       └── index.html     # Memory Nivel 1 (MVP actual)
├── backend/               # API + lógica servidor (futuro)
├── content/               # Catálogo de cartas
│   └── pack-1.json        # Primer pack (aves)
├── docs/                  # Documentación técnica completa
│   ├── Manual-Maestro.md
│   ├── Manual-Tecnico.md
│   ├── Esquema-BD.md
│   └── ... (ver docs/README.md)
├── legacy/                # Archivos históricos
└── index.html             # Entry point raíz
```

---

## 🚀 **Quick Start**

### **Probar el juego localmente:**
```bash
# Clonar repo
git clone https://github.com/tuusuario/kyndo.git
cd kyndo

# Abrir en navegador
open frontend/memory/index.html
# O usar Live Server en VS Code
```

**No requiere instalación, compilación ni dependencias.**

---

## 🎮 **Estado actual: Memory Nivel 1 (MVP)**

### **✅ FUNCIONAL Y ESTABILIZADO**

**Concepto:** Memory avanzado con límite de intentos, castigo por repetición y sistema de racha.

#### **Sistema de Grados (dentro de Nivel 1):**

| Grado | Cartas | Pares | Intentos máx | Grid |
|-------|--------|-------|--------------|------|
| 1     | 20     | 10    | 22           | 5×4  |
| 2     | 30     | 15    | 33           | 6×5  |
| 3     | 42     | 21    | 46           | 7×6  |
| 4     | 56     | 28    | 62           | 8×7  |
| 5     | 72     | 36    | 79           | 9×8  |

#### **Mecánicas implementadas:**

- **Límite de intentos:** `totalPares × 2.2`
- **Castigo por repetir error:** `+1 intento` + `-2 puntos` (desde primera repetición)
- **Sistema de racha:** Bono acumulativo `5 × (racha - 1)` por paso
- **Condición de ascenso:** Completar todos los pares + mantenerse dentro del límite

**Puntos base por match:** `+10 puntos`

---

## 📖 **Documentación completa**

Ver [`/docs/README.md`](docs/README.md) para el índice completo.

### **Documentos principales:**

#### **Diseño del sistema:**
- [Manual Maestro](docs/Manual-Maestro.md) — Fuente única de verdad (congelado)
- [Manual Técnico](docs/Manual-Tecnico.md) — Arquitectura ejecutable
- [Manual UX/UI](docs/Manual-UX-UI.md) — Interfaz y estados del jugador
- [**Guía de Creación de Contenido**](docs/CONTENT_CREATION_GUIDE.md) — **Pipeline completo con servicios IA y Figma**

#### **Base de datos y backend:**
- [Esquema de BD](docs/Esquema-BD.md) — Tablas, relaciones, constraints
- [Checklist Endpoints](docs/Checklist-Endpoints.md) — API MVP
- [Checklist Implementación](docs/Checklist-Implementacion.md) — Validación por tabla

#### **Diseño de juego:**
- [Game Rules](docs/GAME_RULES.md) — Reglas jugables (humanos)
- [Balance Parameters](docs/BALANCE_PARAMETERS.md) — Valores editables
- [Architecture](docs/ARCHITECTURE.md) — Flujo del código actual

#### **Planificación:**
- [Roadmap MVP](docs/Roadmap-MVP.md) — Fases y priorización

---

## 🛠️ **Stack tecnológico**

### **Frontend (actual):**
- HTML5 + CSS3 + Vanilla JavaScript
- Sin dependencias externas
- PWA-ready (instalable como app)
- Mobile-first responsive

### **Backend (planeado):**
- Node.js o Python (TBD)
- PostgreSQL o Supabase
- API RESTful server-authoritative

### **Content pipeline:**
- SVG vectorial (marcos y estructura)
- AI-generated images (Replicate, Leonardo.ai, Stable Diffusion)
- WebP optimizado
- JSON/SQLite catálogo maestro
- **Ver [Guía de Creación de Contenido](docs/CONTENT_CREATION_GUIDE.md) para detalles completos**

---

## 📅 **Roadmap de desarrollo**

### ✅ **Fase 1: Memory Nivel 1 (COMPLETADA)**
- [x] Tablero dinámico por grados
- [x] Sistema de intentos con límite escalado
- [x] Castigo por repetir errores
- [x] Sistema de racha acumulativo
- [x] Overlay de foco (carta grande)
- [x] Pantalla de resultados
- [x] Estabilización de interacciones pending

### 🚧 **Fase 2: Pulido y expansión (EN PROGRESO)**
- [ ] Animaciones de transición suaves
- [ ] Feedback visual mejorado (partículas, efectos)
- [ ] Estadísticas históricas por jugador
- [ ] Sistema de logros
- [ ] Integración con backend (progreso persistente)

### 📋 **Fase 3: Modos adicionales (PLANEADO)**
- [ ] Memory Nivel 2 (variantes visuales)
- [ ] Memory Nivel 3 (objetos similares + contra reloj)
- [ ] Modo Battle (comparación A/D)
- [ ] Modo Enciclopedia (exploración sin presión)
- [ ] Conquista Temporal de Cartas (sistema económico)

### 🎯 **Fase 4: Escalamiento (FUTURO)**
- [ ] Múltiples dominios (aves, fauna, transporte, etc.)
- [ ] Sistema de ligas y ranking
- [ ] Matchmaking MMR
- [ ] Monetización (freemium / suscripción)

---

## 🎨 **Filosofía de diseño**

### **Principios no negociables:**

1. **Una app, un motor** — No apps separadas por dominio
2. **El conocimiento se gana jugando** — No tutoriales pasivos
3. **El valor se ve antes de entenderse** — Las cartas son hermosas antes de ser útiles
4. **La complejidad se desbloquea** — Carta A → B → C, no todo a la vez
5. **Todo debe escalar** — 12,000+ objetos sin romper nada
6. **Nada se explica antes de experimentarse** — Show, don't tell

### **Sobre el nombre:**

**KYNDO** es un nombre no descriptivo por diseño. Se acompaña de descriptor contextual:
- "KYNDO: Cognitive Bird Cards" (dominio aves)
- "KYNDO: Wildlife Memory Engine" (dominio fauna)
- etc.

El motor es uno. Las presentaciones son muchas.

---

## 🤝 **Contribuir**

Ver [DEVELOPMENT.md](docs/DEVELOPMENT.md) para guía técnica completa.

### **Reglas de oro:**
1. ❌ No rediseñar mecánicas core sin discusión previa
2. ✅ Testear en mobile antes de commit
3. ✅ Documentar cambios de balance en CHANGELOG.md
4. ✅ Mantener separación runtime vs content-time
5. ✅ Priorizar estabilidad sobre features

### **Branching:**
- `main` — Producción estable
- `develop` — Integración continua
- `feature/*` — Nuevas funcionalidades
- `fix/*` — Correcciones de bugs

---

## 📊 **Métricas de éxito (MVP)**

El Memory Nivel 1 es exitoso si:
- ≥60% de jugadores completan Grado 1-2
- ≥30% llegan a Grado 3+
- ≥10% alcanzan Grado 5
- Tiempo promedio por grado: 3-7 minutos
- No existen exploits evidentes

---

## 🔐 **Arquitectura de seguridad**

### **Principios:**
- **Server-authoritative** — El servidor decide la verdad
- **Client-side validation** — Solo para UX, no para lógica
- **Determinismo auditable** — Todas las partidas usan seeds reproducibles
- **Event logging** — Registro completo para detección de anomalías

**El cliente NUNCA envía:**
- Valores calculados (puntos, intentos, etc.)
- Estados de cartas
- Progresión

**El cliente SOLO envía:**
- Acciones del usuario (clicks, selecciones)
- IDs de contexto (memory_run_id, battle_id)

---

## 📄 **Licencia**

[Pendiente definir]

---

## 👤 **Autor**

Proyecto personal en desarrollo activo.

**Contacto:** [Tu información]

---

## 🔗 **Enlaces útiles**

- [Documentación técnica](docs/)
- [Issues](https://github.com/tuusuario/kyndo/issues)
- [Roadmap detallado](docs/Roadmap-MVP.md)
- [Cambios recientes](CHANGELOG.md)

---

**Última actualización:** Enero 2025 · Memory Nivel 1 estabilizado
