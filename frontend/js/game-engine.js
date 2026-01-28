/**
 * KYNDO Memory - Motor de Juego
 * 
 * Lógica pura del juego, separada de la presentación.
 * Implementa las mecánicas core de Memory Nivel 1.
 * 
 * @version 1.0
 */

import {
  STREAK_BASE_BONUS,
  REPEAT_MISS_EXTRA_ATTEMPTS,
  REPEAT_MISS_POINT_PENALTY,
  ATTEMPT_FACTOR,
  MATCH_BASE_POINTS,
  GRADE_CONFIG,
  CARD_STATES
} from './config.js';
import { validateGrade, validateNumber, ConfigError } from './error-handler.js';

/**
 * Calcula el número de columnas del grid basado en el total de cartas
 * @param {number} totalCards - Número total de cartas
 * @returns {number} Número de columnas
 */
export function computeColumns(totalCards) {
  return Math.ceil(Math.sqrt(totalCards));
}

/**
 * Crea una clave canónica para un par de IDs
 * El orden no importa: (2,7) y (7,2) producen la misma clave
 * @param {number|string} id1 - Primer ID
 * @param {number|string} id2 - Segundo ID
 * @returns {string} Clave canónica "minId-maxId"
 */
export function canonicalPairKey(id1, id2) {
  const a = Number(id1);
  const b = Number(id2);
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Asegura que un número no sea negativo
 * @param {number} n - Número a validar
 * @returns {number} El número si es positivo, 0 si es negativo
 */
export function clampNonNegative(n) {
  return n < 0 ? 0 : n;
}

/**
 * Genera un array de IDs de objetos mezclados para el tablero
 * Cada ID aparece exactamente 2 veces (para formar pares)
 * @param {number} totalPairs - Número de pares
 * @returns {number[]} Array mezclado de IDs
 */
export function buildObjectIds(totalPairs) {
  const ids = [];
  for (let i = 0; i < totalPairs; i++) {
    ids.push(i);
    ids.push(i);
  }
  
  // Fisher–Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  
  return ids;
}

/**
 * Calcula el límite máximo de intentos para un grado
 * @param {number} totalPairs - Número de pares
 * @returns {number} Máximo de intentos permitidos
 */
export function calculateMaxAttempts(totalPairs) {
  return Math.ceil(totalPairs * ATTEMPT_FACTOR);
}

/**
 * Calcula el bono de puntos por racha
 * @param {number} currentStreak - Racha actual
 * @returns {number} Puntos de bono
 */
export function calculateStreakBonus(currentStreak) {
  return STREAK_BASE_BONUS * (currentStreak - 1);
}

/**
 * Clase que representa el estado del juego Memory
 */
export class MemoryGameState {
  constructor(grade) {
    // Validar grado
    validateGrade(grade, GRADE_CONFIG);
    
    this.grade = grade;
    this.totalCards = GRADE_CONFIG[grade];
    
    // Validar que las cartas sean un número par
    if (this.totalCards % 2 !== 0) {
      throw new ConfigError(`El grado ${grade} tiene un número impar de cartas: ${this.totalCards}`);
    }
    
    this.totalPairs = this.totalCards / 2;
    this.maxAttempts = calculateMaxAttempts(this.totalPairs);
    
    // Progreso actual
    this.score = 0;
    this.matches = 0;
    this.attempts = 0;
    
    // Sistema de racha
    this.streak = 0;
    this.maxStreakSeen = 0;
    
    // Estado temporal
    this.revealedCardIds = [];
    this.missedPairs = new Set();
  }

  /**
   * Registra que una carta fue revelada
   * @param {string} cardId - ID de la carta revelada
   */
  revealCard(cardId) {
    if (this.revealedCardIds.length < 2) {
      this.revealedCardIds.push(cardId);
    }
  }

  /**
   * Resuelve un par de cartas y actualiza el estado
   * @param {number} objectId1 - ID del objeto de la primera carta
   * @param {number} objectId2 - ID del objeto de la segunda carta
   * @returns {Object} Resultado de la resolución {isMatch, scoreChange, streakChange, attemptsPenalty}
   */
  resolvePair(objectId1, objectId2) {
    // Incrementar intentos base
    this.attempts += 1;
    
    const isMatch = objectId1 === objectId2;
    let scoreChange = 0;
    let streakChange = 0;
    let attemptsPenalty = 0;

    if (isMatch) {
      // MATCH EXITOSO
      this.matches += 1;
      this.streak += 1;
      
      if (this.streak > this.maxStreakSeen) {
        this.maxStreakSeen = this.streak;
      }
      
      // Puntos base
      scoreChange = MATCH_BASE_POINTS;
      
      // Bono por racha
      const bonus = calculateStreakBonus(this.streak);
      scoreChange += bonus;
      
      this.score += scoreChange;
      streakChange = this.streak;
    } else {
      // MISS - Racha se rompe
      this.streak = 0;
      streakChange = 0;
      
      // Verificar si es un par repetido
      const key = canonicalPairKey(objectId1, objectId2);
      const isRepeated = this.missedPairs.has(key);
      
      if (isRepeated) {
        // Castigo por repetir error
        attemptsPenalty = REPEAT_MISS_EXTRA_ATTEMPTS;
        this.attempts += attemptsPenalty;
        
        scoreChange = -REPEAT_MISS_POINT_PENALTY;
        this.score = clampNonNegative(this.score + scoreChange);
      } else {
        // Primera vez que falla este par
        this.missedPairs.add(key);
      }
    }
    
    // Limpiar cartas reveladas
    this.revealedCardIds = [];
    
    return {
      isMatch,
      scoreChange,
      streakChange,
      attemptsPenalty,
      isRepeatedMiss: !isMatch && attemptsPenalty > 0
    };
  }

  /**
   * Verifica si el nivel ha terminado
   * @returns {boolean} true si todos los pares fueron encontrados
   */
  isLevelComplete() {
    return this.matches === this.totalPairs;
  }

  /**
   * Verifica si el jugador pasó el nivel (encontró todos los pares dentro del límite)
   * @returns {boolean} true si pasó el nivel
   */
  didPassLevel() {
    return this.isLevelComplete() && this.attempts <= this.maxAttempts;
  }

  /**
   * Obtiene una copia del estado actual
   * @returns {Object} Estado actual del juego
   */
  getState() {
    return {
      grade: this.grade,
      totalCards: this.totalCards,
      totalPairs: this.totalPairs,
      maxAttempts: this.maxAttempts,
      score: this.score,
      matches: this.matches,
      attempts: this.attempts,
      streak: this.streak,
      maxStreakSeen: this.maxStreakSeen,
      isComplete: this.isLevelComplete(),
      didPass: this.didPassLevel()
    };
  }
}

/**
 * Valida que un grado existe en la configuración
 * @param {number} grade - Grado a validar
 * @returns {boolean} true si el grado es válido
 */
export function isValidGrade(grade) {
  return grade in GRADE_CONFIG;
}

/**
 * Obtiene el siguiente grado, o el actual si ya es el máximo
 * @param {number} currentGrade - Grado actual
 * @returns {number} Siguiente grado
 */
export function getNextGrade(currentGrade) {
  const next = currentGrade + 1;
  return isValidGrade(next) ? next : currentGrade;
}
