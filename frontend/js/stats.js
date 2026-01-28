/**
 * KYNDO Memory - Sistema de Estadísticas
 * 
 * Recopila y analiza métricas de juego para mejorar la experiencia.
 * Preparado para integración futura con backend.
 * 
 * @version 1.0
 */

import { logger } from './utils.js';
import { STORAGE_KEY } from './config.js';

/**
 * Clase para gestionar estadísticas del juego
 */
export class GameStats {
  constructor() {
    this.currentSession = {
      startTime: Date.now(),
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      totalAttempts: 0,
      totalMatches: 0,
      maxStreak: 0
    };
    
    this.loadHistorical();
  }

  /**
   * Carga estadísticas históricas
   */
  loadHistorical() {
    try {
      const key = `${STORAGE_KEY}_stats`;
      const data = localStorage.getItem(key);
      this.historical = data ? JSON.parse(data) : this.getDefaultHistorical();
    } catch (error) {
      logger.warn('No se pudieron cargar estadísticas históricas');
      this.historical = this.getDefaultHistorical();
    }
  }

  /**
   * Obtiene estructura de estadísticas históricas por defecto
   * @returns {Object}
   */
  getDefaultHistorical() {
    return {
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      byGrade: {
        1: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        2: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        3: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        4: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        5: { played: 0, won: 0, bestScore: 0, bestTime: Infinity }
      },
      achievements: [],
      lastPlayed: null
    };
  }

  /**
   * Registra una partida completada
   * @param {Object} gameResult - Resultado de la partida
   */
  recordGame(gameResult) {
    const {
      grade,
      passed,
      score,
      matches,
      attempts,
      maxStreak,
      totalPairs,
      maxAttempts,
      duration
    } = gameResult;

    // Actualizar sesión actual
    this.currentSession.gamesPlayed++;
    if (passed) this.currentSession.gamesWon++;
    this.currentSession.totalScore += score;
    this.currentSession.totalAttempts += attempts;
    this.currentSession.totalMatches += matches;
    this.currentSession.maxStreak = Math.max(this.currentSession.maxStreak, maxStreak);

    // Actualizar histórico
    this.historical.totalGames++;
    if (passed) this.historical.totalWins++;
    this.historical.totalScore += score;
    this.historical.lastPlayed = Date.now();

    // Actualizar estadísticas por grado
    const gradeStats = this.historical.byGrade[grade];
    if (gradeStats) {
      gradeStats.played++;
      if (passed) gradeStats.won++;
      if (score > gradeStats.bestScore) {
        gradeStats.bestScore = score;
      }
      if (duration && duration < gradeStats.bestTime) {
        gradeStats.bestTime = duration;
      }
    }

    // Verificar logros
    this.checkAchievements(gameResult);

    // Guardar
    this.save();

    logger.info('Partida registrada:', gameResult);
  }

  /**
   * Verifica y desbloquea logros
   * @param {Object} gameResult - Resultado de la partida
   */
  checkAchievements(gameResult) {
    const achievements = [];

    // Logro: Primera victoria
    if (this.historical.totalWins === 1) {
      achievements.push({
        id: 'first_win',
        name: 'Primera Victoria',
        description: 'Completa tu primer nivel',
        timestamp: Date.now()
      });
    }

    // Logro: Perfección (sin errores)
    if (gameResult.matches === gameResult.totalPairs && 
        gameResult.attempts === gameResult.totalPairs) {
      achievements.push({
        id: 'perfect_memory',
        name: 'Memoria Perfecta',
        description: 'Completa un nivel sin errores',
        timestamp: Date.now()
      });
    }

    // Logro: Racha máxima
    if (gameResult.maxStreak >= gameResult.totalPairs) {
      achievements.push({
        id: 'full_streak',
        name: 'Racha Completa',
        description: 'Completa todos los pares en racha',
        timestamp: Date.now()
      });
    }

    // Logro: Victoria ajustada
    if (gameResult.passed && 
        gameResult.attempts === gameResult.maxAttempts) {
      achievements.push({
        id: 'close_call',
        name: 'Por los Pelos',
        description: 'Gana usando exactamente todos los intentos',
        timestamp: Date.now()
      });
    }

    // Logro: 10 victorias
    if (this.historical.totalWins === 10) {
      achievements.push({
        id: 'veteran',
        name: 'Veterano',
        description: 'Gana 10 partidas',
        timestamp: Date.now()
      });
    }

    // Agregar nuevos logros
    achievements.forEach(achievement => {
      const exists = this.historical.achievements.find(a => a.id === achievement.id);
      if (!exists) {
        this.historical.achievements.push(achievement);
        logger.info('¡Logro desbloqueado!', achievement);
      }
    });
  }

  /**
   * Guarda estadísticas en localStorage
   */
  save() {
    try {
      const key = `${STORAGE_KEY}_stats`;
      localStorage.setItem(key, JSON.stringify(this.historical));
      logger.debug('Estadísticas guardadas');
    } catch (error) {
      logger.error('Error al guardar estadísticas:', error);
    }
  }

  /**
   * Obtiene estadísticas de la sesión actual
   * @returns {Object}
   */
  getSessionStats() {
    const duration = Date.now() - this.currentSession.startTime;
    const winRate = this.currentSession.gamesPlayed > 0
      ? (this.currentSession.gamesWon / this.currentSession.gamesPlayed * 100).toFixed(1)
      : 0;

    return {
      ...this.currentSession,
      duration,
      winRate
    };
  }

  /**
   * Obtiene estadísticas históricas
   * @returns {Object}
   */
  getHistoricalStats() {
    const winRate = this.historical.totalGames > 0
      ? (this.historical.totalWins / this.historical.totalGames * 100).toFixed(1)
      : 0;

    return {
      ...this.historical,
      winRate,
      averageScore: this.historical.totalGames > 0
        ? Math.round(this.historical.totalScore / this.historical.totalGames)
        : 0
    };
  }

  /**
   * Obtiene estadísticas de un grado específico
   * @param {number} grade - Grado a consultar
   * @returns {Object}
   */
  getGradeStats(grade) {
    const gradeStats = this.historical.byGrade[grade];
    if (!gradeStats) return null;

    const winRate = gradeStats.played > 0
      ? (gradeStats.won / gradeStats.played * 100).toFixed(1)
      : 0;

    return {
      ...gradeStats,
      winRate,
      bestTime: gradeStats.bestTime === Infinity ? null : gradeStats.bestTime
    };
  }

  /**
   * Obtiene todos los logros desbloqueados
   * @returns {Array}
   */
  getAchievements() {
    return [...this.historical.achievements];
  }

  /**
   * Limpia todas las estadísticas
   */
  clear() {
    this.currentSession = {
      startTime: Date.now(),
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      totalAttempts: 0,
      totalMatches: 0,
      maxStreak: 0
    };
    this.historical = this.getDefaultHistorical();
    this.save();
    logger.info('Estadísticas limpiadas');
  }

  /**
   * Exporta estadísticas como JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify({
      session: this.getSessionStats(),
      historical: this.getHistoricalStats(),
      byGrade: this.historical.byGrade,
      achievements: this.historical.achievements
    }, null, 2);
  }
}

/**
 * Instancia singleton de estadísticas
 */
export const gameStats = new GameStats();

/**
 * Analiza el rendimiento de una partida y da feedback
 * @param {Object} gameResult - Resultado de la partida
 * @returns {Object} Análisis y recomendaciones
 */
export function analyzePerformance(gameResult) {
  const {
    grade,
    passed,
    score,
    attempts,
    maxAttempts,
    matches,
    totalPairs,
    maxStreak
  } = gameResult;

  const efficiency = (totalPairs / attempts * 100).toFixed(1);
  const streakRate = (maxStreak / totalPairs * 100).toFixed(1);

  let rating = 'good';
  let feedback = [];

  // Evaluar eficiencia
  if (efficiency >= 80) {
    rating = 'excellent';
    feedback.push('Excelente eficiencia en memoria');
  } else if (efficiency >= 60) {
    rating = 'good';
    feedback.push('Buena eficiencia');
  } else {
    rating = 'needs_improvement';
    feedback.push('Intenta mejorar tu eficiencia recordando las posiciones');
  }

  // Evaluar racha
  if (streakRate >= 80) {
    feedback.push('Racha impresionante');
  } else if (streakRate < 30) {
    feedback.push('Trabaja en mantener rachas más largas');
  }

  // Evaluar margen de victoria
  if (passed) {
    const margin = maxAttempts - attempts;
    const marginPercent = (margin / maxAttempts * 100).toFixed(1);
    
    if (marginPercent > 30) {
      feedback.push('Victoria con gran margen');
    } else if (marginPercent < 10) {
      feedback.push('Victoria ajustada');
    }
  }

  return {
    rating,
    efficiency: parseFloat(efficiency),
    streakRate: parseFloat(streakRate),
    feedback
  };
}
