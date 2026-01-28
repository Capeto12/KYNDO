# 📚 DOCUMENTACIÓN TÉCNICA — KYNDO

Índice completo de la documentación del proyecto.

---

## 🎯 **Por dónde empezar**

**Si eres nuevo:**
1. Lee [Manual Maestro](Manual-Maestro.md) — Visión general congelada
2. Lee [Game Rules](GAME_RULES.md) — Reglas jugables (no técnicas)
3. Prueba el juego: `/frontend/memory/index.html`

**Si vas a programar:**
1. [Manual Técnico](Manual-Tecnico.md) — Arquitectura ejecutable
2. [Architecture](ARCHITECTURE.md) — Flujo del código actual
3. [Balance Parameters](BALANCE_PARAMETERS.md) — Valores editables

**Si vas a diseñar:**
1. [Manual UX/UI](Manual-UX-UI.md) — Estados y pantallas
2. [Game Rules](GAME_RULES.md) — Mecánicas y feedback

**Si vas a implementar backend:**
1. [Esquema BD](Esquema-BD.md) — Tablas y relaciones
2. [Checklist Endpoints](Checklist-Endpoints.md) — API mínima
3. [Checklist Implementación](Checklist-Implementacion.md) — Validación por tabla

---

## 📖 **Documentos principales**

### **🎮 Diseño del sistema (CORE)**

| Documento | Versión | Estado | Descripción |
|-----------|---------|--------|-------------|
| [Manual-Maestro.md](Manual-Maestro.md) | v1.02 | **Congelado** | Fuente única de verdad. Principios no negociables. |
| [Manual-Tecnico.md](Manual-Tecnico.md) | v1.2 | Estable | Arquitectura técnica ejecutable. Runtime vs content-time. |
| [Manual-UX-UI.md](Manual-UX-UI.md) | v1.0 | Estable | Pantallas, estados, transiciones. Qué ve el jugador. |

---

### **🎲 Diseño de juego (RULES)**

| Documento | Versión | Estado | Descripción |
|-----------|---------|--------|-------------|
| [GAME_RULES.md](GAME_RULES.md) | v1.0 | Activo | Reglas del Memory Nivel 1 para humanos (no código). |
| [BALANCE_PARAMETERS.md](BALANCE_PARAMETERS.md) | v1.0 | Vivo | Parámetros editables. Guía de balanceo. |

---

### **🏗️ Arquitectura técnica (CODE)**

| Documento | Versión | Estado | Descripción |
|-----------|---------|--------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | v1.0 | Activo | Flujo real del código. Estados, eventos, validaciones. |
| [Esquema-BD.md](Esquema-BD.md) | v1.2 | Estable | Tablas, claves, constraints. Preparado para MVP. |

---

### **⚙️ Implementación (BACKEND)**

| Documento | Versión | Estado | Descripción |
|-----------|---------|--------|-------------|
| [Checklist-Endpoints.md](Checklist-Endpoints.md) | v1.0 | Vinculante | Endpoints mínimos del MVP. Si no está aquí, no existe. |
| [Checklist-Implementacion.md](Checklist-Implementacion.md) | v1.0 | Vinculante | Checklist por tabla. Define "listo" para cada entidad. |

---

### **📅 Planificación (ROADMAP)**

| Documento | Versión | Estado | Descripción |
|-----------|---------|--------|-------------|
| [Roadmap-MVP.md](Roadmap-MVP.md) | v1.2 | Activo | Qué se construye primero. Qué se excluye explícitamente. |

---

## 📊 **Jerarquía de autoridad**

Cuando hay conflicto entre documentos:
```
1. Manual Maestro (congelado) ← MÁXIMA AUTORIDAD
2. Manual Técnico (estable)
3. Esquema BD / Checklists (vinculantes para MVP)
4. Documentos específicos (GAME_RULES, ARCHITECTURE, etc.)
```

**Regla:** Si un documento contradice al Manual Maestro, el Manual Maestro gana. Siempre.

---

## 🔄 **Versionado de documentos**

### **Estados posibles:**

- **Congelado:** No se modifica sin crear nueva versión mayor (v2.0)
- **Estable:** Cambios menores permitidos (typos, clarificaciones)
- **Activo:** Actualización frecuente según desarrollo
- **Vivo:** Cambia constantemente (parámetros de balance)
- **Vinculante:** Define MVP. Cambios requieren discusión de equipo.

### **Formato de versiones:**

- `v1.0` — Primera versión completa
- `v1.1` — Mejoras menores, sin cambios de diseño
- `v1.2` — Cambios significativos pero compatibles
- `v2.0` — Rediseño o cambio de paradigma

---

## 🎯 **Glosario de términos clave**

**Conceptos centrales:**

- **KYNDO Engine** — Motor completo (todos los modos)
- **Dominio** — Categoría temática (aves, fauna, etc.)
- **Objeto** — Entidad del mundo real (ej: "Águila Real")
- **Carta A/B/C** — 3 representaciones por objeto (progresión cognitiva)
- **Memory Nivel 1/2/3** — Modos de juego con dificultad creciente
- **Grado** — Escalón dentro de un nivel (ej: Nivel 1 tiene 5 grados)

**Arquitectura:**

- **Runtime** — Ejecución en vivo (app funcionando)
- **Content-time** — Generación previa (SVG, imágenes, catálogo)
- **Server-authoritative** — El servidor decide la verdad
- **Client-side validation** — Validación en cliente solo para UX

**Base de datos:**

- **Catálogo global** — Objetos, cartas, factores A/D (inmutable en runtime)
- **Estado del jugador** — Progreso, colección, sesión (mutable)
- **Seed** — Valor aleatorio reproducible (para debugging)

---

## 📝 **Cómo actualizar documentación**

### **Cambios menores (typos, clarificaciones):**
```bash
git checkout develop
# Editar documento
git commit -m "docs: fix typo in Game Rules"
git push
```

### **Cambios significativos:**
```bash
# 1. Crear branch
git checkout -b docs/update-balance-params

# 2. Editar + incrementar versión en el documento
# Ej: v1.0 → v1.1

# 3. Actualizar CHANGELOG.md con justificación

# 4. Pull request para revisión
```

### **Nuevos documentos:**
```bash
# 1. Crear documento con header estándar
# 2. Agregarlo a este índice (README.md)
# 3. Linkear desde otros docs relevantes
# 4. Pull request
```

---

## 🔍 **Búsqueda rápida**

**¿Buscas información sobre...?**

| Tema | Documento(s) |
|------|-------------|
| Reglas de juego (no código) | [GAME_RULES.md](GAME_RULES.md) |
| Valores de balance editables | [BALANCE_PARAMETERS.md](BALANCE_PARAMETERS.md) |
| Flujo del código actual | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Principios no negociables | [Manual-Maestro.md](Manual-Maestro.md) |
| Tablas de base de datos | [Esquema-BD.md](Esquema-BD.md) |
| API endpoints mínimos | [Checklist-Endpoints.md](Checklist-Endpoints.md) |
| Pantallas y estados UX | [Manual-UX-UI.md](Manual-UX-UI.md) |
| Qué se excluye del MVP | [Roadmap-MVP.md](Roadmap-MVP.md) |
| Sistema Ataque/Defensa | [Manual-Maestro.md](Manual-Maestro.md#5-sistema-ataque--defensa-ad) |
| Pipeline de imágenes IA | [Manual-Maestro.md](Manual-Maestro.md#a1-sistema-visual-y-pipeline-de-cartas) |

---

## 📞 **Contacto**

Para preguntas sobre documentación:
- Abrir issue en GitHub con tag `documentation`
- Mencionar el documento específico y sección

---

**Última actualización:** Enero 2025
