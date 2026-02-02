/**
 * KYNDO Memory - Configuración de Balance
 * 
 * Todos los parámetros editables del juego están centralizados aquí.
 * Ver docs/BALANCE_PARAMETERS.md para más información.
 * 
 * @version 1.0
 */

// =========================
// PARÁMETROS DE BALANCE
// =========================

/**
 * Configuración del sistema de racha
 * @type {number}
 */
export const STREAK_BASE_BONUS = 5;

/**
 * Intentos extra por repetir un par fallado
 * @type {number}
 */
export const REPEAT_MISS_EXTRA_ATTEMPTS = 1;

/**
 * Puntos restados por repetir un par fallado
 * @type {number}
 */
export const REPEAT_MISS_POINT_PENALTY = 2;

/**
 * Factor multiplicador para calcular el límite de intentos
 * Formula: maxAttempts = ceil(totalPares × ATTEMPT_FACTOR)
 * @type {number}
 */
export const ATTEMPT_FACTOR = 2.2;

/**
 * Puntos base otorgados por cada match correcto
 * @type {number}
 */
export const MATCH_BASE_POINTS = 10;

// =========================
// CONFIGURACIÓN DE GRADOS
// =========================

/**
 * Configuración de cartas por grado
 * Cada grado define el número total de cartas (siempre par)
 * @type {Object.<number, number>}
 */
export const GRADE_CONFIG = {
  1: 20,  // 5×4 grid, 10 pares, 22 intentos
  2: 30,  // 6×5 grid, 15 pares, 33 intentos
  3: 42,  // 7×6 grid, 21 pares, 46 intentos
  4: 56,  // 8×7 grid, 28 pares, 62 intentos
  5: 72   // 9×8 grid, 36 pares, 79 intentos
};

// =========================
// CONFIGURACIÓN DE PERSISTENCIA
// =========================

/**
 * Clave para almacenar el progreso en LocalStorage
 * @type {string}
 */
export const STORAGE_KEY = 'kyndo_memory_v1';

// =========================
// CONFIGURACIÓN VISUAL
// =========================

/**
 * Tiempo de pausa antes de mostrar el resultado final (ms)
 * @type {number}
 */
export const RESULT_DELAY_MS = 350;

/**
 * Nombres de clases CSS para estados de carta
 * @type {Object.<string, string>}
 */
export const CARD_STATES = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  PENDING: 'pending',
  MATCHED: 'matched'
};

// =========================
// CONFIGURACIÓN DE BATTLE
// =========================

/**
 * Battle Mode (Kombate) - Configuración del sistema A/D
 * Ver docs/Manual-Maestro.md § 5 para la teoría completa
 */

/**
 * Pesos para cálculo de Ataque
 * Suma total: ~2.5 (normalizado después a 0-99)
 */
export const BATTLE_CONFIG = {
  // Pesos de factores de ataque (P, S, W, H, A)
  ATTACK_WEIGHTS: {
    P: 0.5,  // Predación
    S: 0.4,  // Velocidad
    W: 0.5,  // Weapons (anatomía ofensiva)
    H: 0.3,  // Hunt strategy
    A: 0.2   // Agresividad
  },

  // Pesos de factores de defensa (AD, C, E, SD, R)
  DEFENSE_WEIGHTS: {
    AD: 0.4, // Adaptabilidad
    C: 0.3,  // Camuflaje
    E: 0.4,  // Evasión
    SD: 0.2, // Social defense
    R: 0.6   // Robustez
  },

  // Salud inicial de cada jugador (batalla termina cuando llega a 0)
  STARTING_HEALTH: 100,

  // Bonos por entorno (% adicional a defensa)
  ENVIRONMENT_BONUSES: {
    neutral: 0,
    water: 15,      // Ventaja para aves acuáticas
    forest: 10,     // Ventaja para aves forestales
    mountain: 12,   // Ventaja para aves de montaña
    sky: 8          // Ventaja para aves voladoras
  },

  // Multiplicadores de rareza (aplican a todos los factores)
  // Escala oficial: Excepcional, Rara, Frecuente, Abundante
  RARITY_MULTIPLIERS: {
    excepcional: 1.5,  // Morado  #7B3EFF
    rara: 1.25,        // Rojo    #FF2E2E
    frecuente: 1.1,    // Azul    #2E8BFF
    abundante: 1.0     // Verde   #2ECC71
  },

  // Configuración de ligas (futuro)
  LEAGUES: {
    bronze: { minMMR: 0, maxMMR: 999, reward: 10 },
    silver: { minMMR: 1000, maxMMR: 1999, reward: 25 },
    gold: { minMMR: 2000, maxMMR: 2999, reward: 50 },
    platinum: { minMMR: 3000, maxMMR: 4999, reward: 100 },
    diamond: { minMMR: 5000, maxMMR: Infinity, reward: 200 }
  },

  // Configuración de matchmaking
  MATCHMAKING: {
    MMR_CHANGE_WIN: 25,
    MMR_CHANGE_LOSS: -15,
    MMR_CHANGE_DRAW: 0,
    K_FACTOR: 32 // Elo coefficient for rating changes
  },

  // Tutorial/Demo
  DEMO_MODE_ENABLED: true,
  DEMO_DECK_SIZE: 3
};

/**
 * Equivalencias de factores A/D (para UI)
 */
export const FACTOR_NAMES = {
  P: 'Predación',
  S: 'Velocidad',
  W: 'Anatomía',
  H: 'Estrategia',
  A: 'Agresividad',
  AD: 'Adaptabilidad',
  C: 'Camuflaje',
  E: 'Evasión',
  SD: 'Defensa Social',
  R: 'Robustez'
};
