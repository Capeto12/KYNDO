/**
 * KYNDO Memory - Gestión de Persistencia
 * 
 * Maneja el almacenamiento y recuperación del progreso del jugador.
 * Usa LocalStorage para el MVP, preparado para migrar a backend.
 * 
 * @version 1.0
 */

import { STORAGE_KEY } from './config.js';
import { StorageError, errorHandler } from './error-handler.js';
import { logger } from './utils.js';

/**
 * Clase que maneja la persistencia del progreso
 */
export class ProgressStorage {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Carga el progreso guardado
   * @returns {Object} Objeto con el progreso guardado
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      const storageError = new StorageError('Error al cargar progreso desde localStorage');
      errorHandler.handleError(storageError);
      logger.warn('No se pudo cargar el progreso, usando valores por defecto');
      return {};
    }
  }

  /**
   * Guarda el progreso actual
   * @param {Object} progress - Objeto con el progreso a guardar
   * @returns {boolean} true si se guardó correctamente
   */
  save(progress) {
    try {
      const data = JSON.stringify(progress);
      localStorage.setItem(this.storageKey, data);
      logger.info('Progreso guardado correctamente');
      return true;
    } catch (error) {
      const storageError = new StorageError('Error al guardar progreso en localStorage');
      errorHandler.handleError(storageError);
      logger.error('No se pudo guardar el progreso');
      return false;
    }
  }

  /**
   * Obtiene el grado actual guardado
   * @param {number} defaultGrade - Grado por defecto si no hay guardado
   * @returns {number} Grado guardado o default
   */
  getGrade(defaultGrade = 1) {
    const progress = this.load();
    return typeof progress.memoryGrade === 'number' ? progress.memoryGrade : defaultGrade;
  }

  /**
   * Guarda el grado actual
   * @param {number} grade - Grado a guardar
   * @returns {boolean} true si se guardó correctamente
   */
  saveGrade(grade) {
    const progress = this.load();
    progress.memoryGrade = grade;
    return this.save(progress);
  }

  /**
   * Carga el inventario de recompensas del jugador
   * @returns {Object[]} Array de recompensas guardadas
   */
  loadRewards() {
    const progress = this.load();
    return Array.isArray(progress.rewards) ? progress.rewards : [];
  }

  /**
   * Guarda el inventario de recompensas del jugador
   * @param {Object[]} rewards - Array de recompensas a persistir
   * @returns {boolean} true si se guardó correctamente
   */
  saveRewards(rewards) {
    const progress = this.load();
    progress.rewards = rewards;
    return this.save(progress);
  }

  /**
   * Agrega una recompensa al inventario persistido
   * @param {Object} reward - Recompensa a agregar
   * @returns {boolean} true si se guardó correctamente
   */
  addReward(reward) {
    const rewards = this.loadRewards();
    rewards.push(reward);
    return this.saveRewards(rewards);
  }

  /**
   * Limpia todo el progreso guardado
   * @returns {boolean} true si se limpió correctamente
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      logger.info('Progreso limpiado correctamente');
      return true;
    } catch (error) {
      const storageError = new StorageError('Error al limpiar progreso');
      errorHandler.handleError(storageError);
      logger.error('No se pudo limpiar el progreso');
      return false;
    }
  }

  // --- BATTLE HISTORY ---

  /**
   * Carga el historial de batallas (Kombate)
   */
  loadBattleHistory() {
    try {
      const data = localStorage.getItem('kyndo_battle_history_v1');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error cargando historial de batalla', e);
      return [];
    }
  }

  /**
   * Guarda un nuevo registro en el historial de batallas
   * { date, result: 'victoria'|'derrota'|'empate', gamesWon, gamesLost, roundsPlayed, score }
   */
  saveBattleMatch(matchData) {
    try {
      const history = this.loadBattleHistory();
      history.unshift({
        ...matchData,
        date: new Date().toISOString()
      });
      // Mantener solo los últimos 50
      if (history.length > 50) history.length = 50;
      localStorage.setItem('kyndo_battle_history_v1', JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Error guardando historial de batalla', e);
      return false;
    }
  }
}

/**
 * Instancia singleton del storage
 */
export const progressStorage = new ProgressStorage();
