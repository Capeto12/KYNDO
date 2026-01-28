/**
 * KYNDO Memory - Gestión de Persistencia
 * 
 * Maneja el almacenamiento y recuperación del progreso del jugador.
 * Usa LocalStorage para el MVP, preparado para migrar a backend.
 * 
 * @version 1.0
 */

import { STORAGE_KEY } from './config.js';

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
      console.warn('Error al cargar progreso:', error);
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
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error('Error al guardar progreso:', error);
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
   * Limpia todo el progreso guardado
   * @returns {boolean} true si se limpió correctamente
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error al limpiar progreso:', error);
      return false;
    }
  }
}

/**
 * Instancia singleton del storage
 */
export const progressStorage = new ProgressStorage();
