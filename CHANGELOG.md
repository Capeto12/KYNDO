# Changelog

Todos los cambios notables del proyecto KYNDO se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

## [Unreleased]

### Added - Refactorización Mayor (Enero 2025)

#### Arquitectura Modular
- **10 módulos JavaScript separados** con responsabilidades claras:
  - `config.js` - Configuración centralizada de parámetros
  - `constants.js` - Constantes de strings y DOM IDs
  - `utils.js` - Funciones helper reutilizables
  - `error-handler.js` - Sistema de manejo de errores
  - `game-engine.js` - Lógica pura del juego
  - `ui-renderer.js` - Renderizado y DOM
  - `storage.js` - Persistencia de progreso
  - `stats.js` - Estadísticas y logros
  - `performance.js` - Monitoreo de performance
  - `animations.js` - Sistema de animaciones
  - `game-controller.js` - Controlador principal

#### Sistema de Estadísticas (`stats.js`)
- Tracking de partidas jugadas y ganadas
- Estadísticas detalladas por grado (1-5)
- Sistema de logros desbloqueables:
  - Primera Victoria
  - Memoria Perfecta (sin errores)
  - Racha Completa
  - Por los Pelos (victoria ajustada)
  - Veterano (10 victorias)
- Análisis de performance con feedback automático
- Estadísticas de sesión actual vs históricas
- Persistencia automática en localStorage
- Exportación de datos en JSON

#### Sistema de Performance (`performance.js`)
- `PerformanceTimer` para medición precisa de tiempos
- Estadísticas detalladas: min, max, avg, median, total
- `FPSMeter` para monitoreo de frame rate en tiempo real
- `MemoryMonitor` para tracking de uso de memoria JS
- `GamePerformanceMonitor` para monitoring integral
- Decoradores y wrappers para timing automático
- Reportes detallados en consola

#### Sistema de Animaciones (`animations.js`)
- `CardAnimations`:
  - flip() - Animación de volteo
  - matchSuccess() - Pulso de éxito
  - matchFail() - Shake de error
  - hoverIn/Out() - Efectos hover
- `ParticleEffects`:
  - confetti() - Confetti celebratorio
  - shine() - Efecto de brillo
  - pulse() - Pulsación
- `UIAnimations`:
  - fadeIn/Out() - Transiciones de opacidad
  - animateNumber() - Animación de números
  - typeWriter() - Efecto de escritura
- `PageTransitions`:
  - fade() - Transición fade
  - slide() - Transición slide
- 6 animaciones CSS keyframe:
  - matchPulse, shake, bounce, spin, fadeInUp, pendingPulse

#### Sistema de Manejo de Errores (`error-handler.js`)
- Clases de error personalizadas:
  - `GameError` - Errores generales del juego
  - `StorageError` - Errores de persistencia
  - `ValidationError` - Errores de validación
  - `ConfigError` - Errores de configuración
- `ErrorHandler` singleton para manejo centralizado
- Captura automática de errores no manejados
- Captura de promesas rechazadas
- Historial de errores con límite configurable
- Estadísticas de errores por tipo
- Funciones de validación reutilizables:
  - `validateElement()` - Valida elementos DOM
  - `validateRequiredElements()` - Valida múltiples elementos
  - `validateNumber()` - Valida números con opciones
  - `validateGrade()` - Valida grados
  - `validateCardState()` - Valida estados de carta
- Wrapper `withErrorHandling()` para funciones async
- Helper `tryCatch()` para manejo seguro de promesas

#### Utilidades (`utils.js`)
- 20+ funciones helper:
  - Generación de IDs
  - Formateo de números y tiempo
  - Cálculo de porcentajes
  - Deep clone de objetos
  - Clamp de valores
  - Shuffle de arrays
  - Validación de email
  - Detección de dispositivo móvil/táctil
  - Logger con niveles (debug, info, warn, error)
  - Debounce y throttle

#### Constantes (`constants.js`)
- Centralización de DOM IDs
- Mensajes de UI
- Etiquetas de estadísticas
- Iconos emoji
- Atributos data-*
- Clases CSS
- Eventos custom del juego
- Rutas de archivos

#### Mejoras en Estilos (`styles.css`)
- CSS extraído del HTML
- Nuevas animaciones:
  - Hover effects en cartas
  - Backdrop blur en overlays
  - Smooth transitions
  - Responsive improvements
- Animaciones keyframe mejoradas
- Better mobile support

#### Mejoras en Lógica (`game-engine.js`)
- Clase `MemoryGameState` con encapsulación completa
- Validación de configuración en constructor
- Funciones puras donde sea posible
- Mejor separación de responsabilidades
- Invariantes garantizados

#### Mejoras en UI (`ui-renderer.js`)
- Clases especializadas:
  - `HUDRenderer` - Actualización del HUD
  - `FocusOverlay` - Overlay de foco
  - `ResultOverlay` - Overlay de resultados
  - `BoardRenderer` - Gestión del tablero
- Separación completa de lógica y presentación
- Uso de constantes para mensajes

#### Mejoras en Storage (`storage.js`)
- Clase `ProgressStorage` con API clara
- Manejo robusto de errores
- Logging mejorado
- Preparado para migración a backend

#### Documentación
- README.md detallado en `frontend/js/`
- Documentación inline en todos los módulos
- JSDoc comments en funciones públicas
- Ejemplos de uso

### Changed

- **Estructura de archivos** reorganizada:
  ```
  frontend/
  ├── js/           (10 módulos)
  ├── css/          (estilos separados)
  ├── index-v2.html (nueva versión modular)
  └── index.html    (versión original preservada)
  ```

- **Parámetros de balance** ahora en `config.js`:
  - STREAK_BASE_BONUS
  - REPEAT_MISS_EXTRA_ATTEMPTS
  - REPEAT_MISS_POINT_PENALTY
  - ATTEMPT_FACTOR
  - MATCH_BASE_POINTS
  - GRADE_CONFIG

- **Magic strings eliminados** - Todo usa constantes

- **Error handling** ahora es consistente y centralizado

- **Logging** ahora es estructurado con niveles

### Improved

- **Mantenibilidad**: Código más organizado y fácil de entender
- **Testabilidad**: Lógica pura separada de efectos
- **Escalabilidad**: Preparado para nuevas features
- **Performance**: Monitoreo y optimización
- **UX**: Animaciones y feedback visual mejorado
- **Documentación**: Completa y detallada

### Technical Debt Reducido

- ❌ Magic numbers → ✅ Constantes configurables
- ❌ Magic strings → ✅ Constantes centralizadas
- ❌ Código monolítico → ✅ Módulos especializados
- ❌ Lógica mezclada → ✅ Separación clara
- ❌ Errores silenciosos → ✅ Error handling robusto
- ❌ Sin estadísticas → ✅ Tracking completo
- ❌ Sin monitoring → ✅ Performance tracking

### Preparado para Futuro

- ✅ Fácil migración a backend
- ✅ Fácil agregar unit tests
- ✅ Fácil agregar nuevos modos de juego
- ✅ Fácil internacionalización
- ✅ Fácil agregar sonidos
- ✅ Fácil cambiar a React/Vue si es necesario

---

## [1.0.0] - Enero 2025

### Added
- Memory Nivel 1 funcional con 5 grados
- Sistema de intentos con límite escalado
- Castigo por repetir errores
- Sistema de racha acumulativo
- Overlay de foco (carta grande)
- Pantalla de resultados
- Persistencia en LocalStorage
- Grid dinámico responsive
- Estados de carta (hidden, revealed, pending, matched)

### Features Implementadas (Fase 1 del Roadmap)
- [x] Tablero dinámico por grados
- [x] Sistema de intentos con límite escalado
- [x] Castigo por repetir errores
- [x] Sistema de racha acumulativo
- [x] Overlay de foco
- [x] Pantalla de resultados
- [x] Estabilización de interacciones pending

---

## Próximos Pasos (Roadmap)

### Fase 2 - En Progreso
- [ ] Integrar stats.js en UI
- [ ] Integrar animations.js en game flow
- [ ] Crear panel de estadísticas
- [ ] Feedback visual mejorado con partículas
- [ ] Sistema de logros visible

### Fase 3 - Planeado
- [ ] Backend API
- [ ] Sincronización multi-dispositivo
- [ ] Memory Nivel 2 (variantes visuales)
- [ ] Modo Battle (comparación A/D)
- [ ] Modo Enciclopedia

---

**Mantenedores:** Proyecto KYNDO  
**Fecha de última actualización:** Enero 2025
