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
