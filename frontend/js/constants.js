/**
 * KYNDO Memory - Constantes
 * 
 * IDs de elementos del DOM y otras constantes de strings.
 * Centraliza todos los "magic strings" del proyecto.
 * 
 * @version 1.0
 */

/**
 * IDs de elementos del DOM
 */
export const DOM_IDS = {
  // Contenedores principales
  BOARD: 'board',
  OVERLAY: 'overlay',
  RESULT_OVERLAY: 'resultOverlay',
  
  // HUD (heads-up display)
  HUD: {
    MATCHES: 'hud-matches',
    PAIRS: 'hud-pairs',
    ATTEMPTS: 'hud-attempts',
    MAX_ATTEMPTS: 'hud-maxAttempts',
    STREAK: 'hud-streak',
    SCORE: 'hud-score',
    GRADE: 'hud-grade'
  },
  
  // Focus overlay
  FOCUS: {
    IMAGE: 'focusImage',
    NAME: 'focusName',
    ATK: 'focusAtk',
    DEF: 'focusDef'
  },
  
  // Result overlay
  RESULT: {
    TITLE: 'resultTitle',
    SUBTITLE: 'resultSub',
    PAIRS: 'resultPairs',
    ATTEMPTS: 'resultAttempts',
    SCORE: 'resultScore',
    MAX_STREAK: 'resultMaxStreak',
    BTN_PRIMARY: 'btnPrimary',
    BTN_SECONDARY: 'btnSecondary'
  }
};

/**
 * Mensajes de la UI
 */
export const MESSAGES = {
  // Resultado - Victoria
  RESULT_PASSED_TITLE: 'Nivel superado',
  RESULT_PASSED_SUBTITLE: 'Eficiencia confirmada. El tablero sube de grado.',
  RESULT_PASSED_BTN_PRIMARY: 'Continuar',
  RESULT_PASSED_BTN_SECONDARY: 'Reintentar (opcional)',
  
  // Resultado - No superado
  RESULT_FAILED_TITLE: 'Nivel completado, pero no superado',
  RESULT_FAILED_SUBTITLE: 'Te pasaste del máximo de intentos. Para subir, debes completarlo dentro del límite.',
  RESULT_FAILED_BTN_PRIMARY: 'Reintentar',
  RESULT_FAILED_BTN_SECONDARY: 'Cerrar',
  
  // Errores
  ERROR_INIT: 'Error al cargar el juego. Por favor, recarga la página.',
  ERROR_STORAGE: 'Error al guardar el progreso',
  ERROR_LOAD: 'Error al cargar el progreso',

  // Recompensas
  REWARD_STREAK_CARD: '¡Racha! Ganaste una carta nueva 🎴',
  REWARD_GRADE_PASS_PACK: '¡Grado superado! Ganaste un paquete de cartas 🎁',
  REWARD_KOMBAT_SET_CARD: '¡Set ganado! Ganaste una carta de Kombat 🃏',
  REWARD_KOMBAT_MATCH_PACK: '¡Victoria! Ganaste un paquete de 5 cartas 🏆'
};

/**
 * Etiquetas de estadísticas
 */
export const STAT_LABELS = {
  PAIRS: 'Pares',
  ATTEMPTS: 'Intentos',
  SCORE: 'Puntaje',
  MAX_STREAK: 'Racha máx.'
};

/**
 * Iconos emoji usados en el HUD
 */
export const ICONS = {
  BRAIN: '🧠',
  REFRESH: '🔁',
  FIRE: '🔥',
  STAR: '⭐',
  BIRD: '🜁'
};

/**
 * Atributos data-* usados en elementos del DOM
 */
export const DATA_ATTRS = {
  STATE: 'data-state',
  OBJECT_ID: 'data-object-id',
  CARD_ID: 'data-card-id'
};

/**
 * Nombres de clases CSS (además de las en config.js)
 */
export const CSS_CLASSES = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  LOADING: 'loading'
};

/**
 * Eventos custom del juego
 */
export const GAME_EVENTS = {
  CARD_REVEALED: 'card:revealed',
  PAIR_RESOLVED: 'pair:resolved',
  MATCH_SUCCESS: 'match:success',
  MATCH_FAILED: 'match:failed',
  STREAK_CHANGED: 'streak:changed',
  LEVEL_COMPLETE: 'level:complete',
  GRADE_CHANGED: 'grade:changed'
};

/**
 * Nombres de sonidos (para futuro)
 */
export const SOUNDS = {
  CARD_FLIP: 'card-flip',
  MATCH: 'match',
  MISS: 'miss',
  STREAK: 'streak',
  LEVEL_UP: 'level-up',
  VICTORY: 'victory'
};

/**
 * Rutas de archivos (para futuro con backend)
 */
export const PATHS = {
  API_BASE: '/api',
  SOUNDS: '/sounds',
  IMAGES: '/images',
  CARDS: '/content/cards'
};
