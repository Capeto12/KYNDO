/**
 * KYNDO - Sistema de Recompensas
 *
 * Lógica pura para calcular y gestionar recompensas:
 *   - Carta por racha de 3 en Memory
 *   - Paquete (5 cartas) al pasar un grado
 *   - 1 carta al ganar un set de Kombat
 *   - Paquete (5 cartas) al ganar una partida de Kombat
 *   - Cartas bloqueadas por nivel (solo visibles al alcanzar cierto grado)
 *
 * Módulo puro: sin acceso al DOM.
 *
 * @version 1.0
 */

import {
  STREAK_CARD_REWARD_THRESHOLD,
  PACK_SIZES,
  KOMBAT_SET_WIN_CARDS,
  LEVEL_LOCKED_MIN_GRADE
} from './config.js';

// =============================================================
// CONSTANTES DE TIPO
// =============================================================

/**
 * Tipos de recompensa
 * @enum {string}
 */
export const REWARD_TYPE = {
  CARD: 'card',
  PACK: 'pack'
};

/**
 * Orígenes de la recompensa
 * @enum {string}
 */
export const REWARD_SOURCE = {
  PURCHASED: 'purchased',       // Paquete comprado (40 cartas)
  GRADE_PASS: 'grade_pass',     // Pasar un grado en Memory (5 cartas)
  STREAK: 'streak',             // Racha de 3 en Memory (1 carta)
  KOMBAT_SET: 'kombat_set',     // Ganar un set de Kombat (1 carta)
  KOMBAT_MATCH: 'kombat_match'  // Ganar una partida de Kombat (5 cartas)
};

// =============================================================
// FUNCIONES DE CREACIÓN DE RECOMPENSAS
// =============================================================

/**
 * Crea un objeto de recompensa de tipo paquete
 * @param {string} source - Origen de la recompensa (REWARD_SOURCE)
 * @param {number} size - Cantidad de cartas en el paquete
 * @returns {Object} Objeto de recompensa
 */
export function createPackReward(source, size) {
  return {
    type: REWARD_TYPE.PACK,
    source,
    size,
    earnedAt: Date.now()
  };
}

/**
 * Crea un objeto de recompensa de tipo carta individual
 * @param {string} source - Origen de la recompensa (REWARD_SOURCE)
 * @returns {Object} Objeto de recompensa
 */
export function createCardReward(source) {
  return {
    type: REWARD_TYPE.CARD,
    source,
    size: 1,
    earnedAt: Date.now()
  };
}

// =============================================================
// LÓGICA DE OTORGAMIENTO
// =============================================================

/**
 * Evalúa si la racha actual genera una recompensa de carta.
 * Se premia en cada múltiplo del umbral (3, 6, 9, …) para mantener
 * al jugador motivado a sostener rachas largas.
 *
 * @param {number} currentStreak - Racha actual tras un match exitoso
 * @returns {Object|null} Recompensa o null si no corresponde
 */
export function checkStreakReward(currentStreak) {
  if (currentStreak > 0 && currentStreak % STREAK_CARD_REWARD_THRESHOLD === 0) {
    return createCardReward(REWARD_SOURCE.STREAK);
  }
  return null;
}

/**
 * Devuelve la recompensa por pasar un grado en Memory.
 *
 * @param {number} grade - Grado que fue superado
 * @returns {Object} Recompensa de tipo paquete
 */
export function getGradePassReward(grade) {
  return createPackReward(REWARD_SOURCE.GRADE_PASS, PACK_SIZES.GRADE_PASS);
}

/**
 * Devuelve la recompensa por ganar un set (juego parcial) en Kombat.
 *
 * @returns {Object} Recompensa de 1 carta
 */
export function getKombatSetWinReward() {
  return createCardReward(REWARD_SOURCE.KOMBAT_SET);
}

/**
 * Devuelve la recompensa por ganar la partida completa de Kombat.
 *
 * @returns {Object} Recompensa de paquete de 5 cartas
 */
export function getKombatMatchWinReward() {
  return createPackReward(REWARD_SOURCE.KOMBAT_MATCH, PACK_SIZES.KOMBAT_MATCH);
}

// =============================================================
// CARTAS BLOQUEADAS POR NIVEL
// =============================================================

/**
 * Indica si una carta está disponible para el grado actual del jugador.
 * Las cartas con `minGrade` definido solo se desbloquean al alcanzar ese grado.
 *
 * @param {number|undefined} cardMinGrade - Grado mínimo de la carta (undefined = siempre visible)
 * @param {number} playerGrade - Grado actual del jugador
 * @returns {boolean} true si la carta está desbloqueada para el jugador
 */
export function isCardUnlockedForGrade(cardMinGrade, playerGrade) {
  if (cardMinGrade === undefined || cardMinGrade === null) return true;
  return playerGrade >= cardMinGrade;
}

/**
 * Filtra un array de cartas retornando solo las visibles para el grado del jugador.
 *
 * @param {Array<{minGrade?: number}>} cards - Lista de cartas del catálogo
 * @param {number} playerGrade - Grado actual del jugador
 * @returns {Array} Cartas visibles para el jugador
 */
export function filterCardsForGrade(cards, playerGrade) {
  return cards.filter(card => isCardUnlockedForGrade(card.minGrade, playerGrade));
}

// =============================================================
// UTILIDADES DE INVENTARIO
// =============================================================

/**
 * Agrega una recompensa al inventario del jugador (objeto simple, sin DOM).
 *
 * @param {Object[]} inventory - Inventario actual
 * @param {Object} reward - Nueva recompensa a agregar
 * @returns {Object[]} Inventario actualizado (nuevo array)
 */
export function addRewardToInventory(inventory, reward) {
  return [...inventory, reward];
}

/**
 * Calcula el total de cartas que el jugador ha ganado (sin contar compras).
 *
 * @param {Object[]} inventory - Inventario de recompensas
 * @returns {number} Total de cartas ganadas
 */
export function countEarnedCards(inventory) {
  return inventory.reduce((sum, r) => sum + (r.size || 0), 0);
}
