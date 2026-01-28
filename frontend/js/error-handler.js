/**
 * KYNDO Memory - Manejo de Errores
 * 
 * Sistema centralizado de manejo de errores y logging.
 * 
 * @version 1.0
 */

import { logger } from './utils.js';
import { MESSAGES } from './constants.js';

/**
 * Tipos de error personalizados
 */
export class GameError extends Error {
  constructor(message, type = 'GAME_ERROR') {
    super(message);
    this.name = 'GameError';
    this.type = type;
    this.timestamp = new Date().toISOString();
  }
}

export class StorageError extends GameError {
  constructor(message) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class ValidationError extends GameError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConfigError extends GameError {
  constructor(message) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

/**
 * Manejador global de errores
 */
export class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.setupGlobalHandlers();
  }

  /**
   * Configura manejadores globales de errores
   */
  setupGlobalHandlers() {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message));
    });

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason));
    });
  }

  /**
   * Maneja un error
   * @param {Error} error - Error a manejar
   * @param {Object} context - Contexto adicional del error
   */
  handleError(error, context = {}) {
    // Registrar error
    const errorInfo = {
      message: error.message,
      name: error.name,
      type: error.type || 'UNKNOWN',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    this.errors.push(errorInfo);
    
    // Mantener solo los últimos N errores
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log según severidad
    if (error instanceof ValidationError) {
      logger.warn('Error de validación:', errorInfo);
    } else if (error instanceof StorageError) {
      logger.error('Error de almacenamiento:', errorInfo);
    } else if (error instanceof ConfigError) {
      logger.error('Error de configuración:', errorInfo);
    } else {
      logger.error('Error del juego:', errorInfo);
    }

    // En desarrollo, lanzar errores para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace completo:', error);
    }

    return errorInfo;
  }

  /**
   * Muestra un mensaje de error al usuario
   * @param {string} message - Mensaje a mostrar
   */
  showUserError(message) {
    // Implementación simple con alert (podría mejorarse con un modal)
    alert(message);
  }

  /**
   * Obtiene todos los errores registrados
   * @returns {Array} Lista de errores
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Limpia el historial de errores
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Obtiene estadísticas de errores
   * @returns {Object} Estadísticas
   */
  getStats() {
    const byType = {};
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byType,
      lastError: this.errors[this.errors.length - 1] || null
    };
  }
}

/**
 * Instancia singleton del manejador de errores
 */
export const errorHandler = new ErrorHandler();

/**
 * Wrapper para funciones que pueden lanzar errores
 * @param {Function} fn - Función a ejecutar
 * @param {string} errorMessage - Mensaje de error personalizado
 * @returns {Function} Función wrapped
 */
export function withErrorHandling(fn, errorMessage) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      errorHandler.handleError(error, { 
        function: fn.name,
        args 
      });
      
      if (errorMessage) {
        errorHandler.showUserError(errorMessage);
      }
      
      throw error;
    }
  };
}

/**
 * Valida que un elemento del DOM exista
 * @param {HTMLElement} element - Elemento a validar
 * @param {string} id - ID del elemento (para error message)
 * @throws {ValidationError} Si el elemento no existe
 */
export function validateElement(element, id) {
  if (!element) {
    throw new ValidationError(`Elemento del DOM no encontrado: ${id}`);
  }
}

/**
 * Valida que todos los elementos requeridos existan
 * @param {Object} elements - Objeto con elementos del DOM
 * @param {Array<string>} required - Lista de keys requeridas
 * @throws {ValidationError} Si falta algún elemento
 */
export function validateRequiredElements(elements, required) {
  const missing = [];
  
  required.forEach(key => {
    if (!elements[key]) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Elementos del DOM faltantes: ${missing.join(', ')}`
    );
  }
}

/**
 * Valida un valor numérico
 * @param {*} value - Valor a validar
 * @param {string} name - Nombre del valor (para error message)
 * @param {Object} options - Opciones de validación
 * @throws {ValidationError} Si la validación falla
 */
export function validateNumber(value, name, options = {}) {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${name} debe ser un número válido`);
  }
  
  if (options.min !== undefined && value < options.min) {
    throw new ValidationError(`${name} debe ser >= ${options.min}`);
  }
  
  if (options.max !== undefined && value > options.max) {
    throw new ValidationError(`${name} debe ser <= ${options.max}`);
  }
  
  if (options.integer && !Number.isInteger(value)) {
    throw new ValidationError(`${name} debe ser un entero`);
  }
}

/**
 * Valida una configuración de grado
 * @param {number} grade - Grado a validar
 * @param {Object} config - Configuración de grados
 * @throws {ValidationError} Si el grado es inválido
 */
export function validateGrade(grade, config) {
  validateNumber(grade, 'Grado', { min: 1, integer: true });
  
  if (!(grade in config)) {
    throw new ValidationError(`Grado ${grade} no existe en la configuración`);
  }
}

/**
 * Valida el estado de una carta
 * @param {string} state - Estado a validar
 * @param {Object} validStates - Estados válidos
 * @throws {ValidationError} Si el estado es inválido
 */
export function validateCardState(state, validStates) {
  const valid = Object.values(validStates);
  
  if (!valid.includes(state)) {
    throw new ValidationError(
      `Estado de carta inválido: ${state}. Estados válidos: ${valid.join(', ')}`
    );
  }
}

/**
 * Try-catch seguro que retorna [error, result]
 * @param {Promise} promise - Promesa a ejecutar
 * @returns {Promise<[Error|null, any]>} [error, result]
 */
export async function tryCatch(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}
