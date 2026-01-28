/**
 * KYNDO Memory - Sistema de Performance Timing
 * 
 * Mide y registra tiempos de ejecución para optimización.
 * 
 * @version 1.0
 */

import { logger } from './utils.js';

/**
 * Clase para medir tiempos de ejecución
 */
export class PerformanceTimer {
  constructor() {
    this.timings = new Map();
    this.marks = new Map();
  }

  /**
   * Inicia un temporizador
   * @param {string} label - Etiqueta del temporizador
   */
  start(label) {
    this.marks.set(label, performance.now());
  }

  /**
   * Detiene un temporizador y registra el tiempo
   * @param {string} label - Etiqueta del temporizador
   * @returns {number} Tiempo transcurrido en ms
   */
  end(label) {
    const startTime = this.marks.get(label);
    if (!startTime) {
      logger.warn(`Timer "${label}" no fue iniciado`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Guardar timing
    if (!this.timings.has(label)) {
      this.timings.set(label, []);
    }
    this.timings.get(label).push(duration);
    
    // Limpiar marca
    this.marks.delete(label);
    
    logger.debug(`Timer "${label}": ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Obtiene estadísticas de un timer
   * @param {string} label - Etiqueta del temporizador
   * @returns {Object|null} Estadísticas o null si no existe
   */
  getStats(label) {
    const times = this.timings.get(label);
    if (!times || times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      count: times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      total: sum
    };
  }

  /**
   * Obtiene todas las estadísticas
   * @returns {Object}
   */
  getAllStats() {
    const stats = {};
    for (const [label, times] of this.timings.entries()) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }

  /**
   * Limpia todos los timers
   */
  clear() {
    this.timings.clear();
    this.marks.clear();
  }

  /**
   * Exporta estadísticas como string formateado
   * @returns {string}
   */
  report() {
    const stats = this.getAllStats();
    let report = '=== Performance Report ===\n\n';

    for (const [label, data] of Object.entries(stats)) {
      if (!data) continue;
      
      report += `${label}:\n`;
      report += `  Count: ${data.count}\n`;
      report += `  Min: ${data.min.toFixed(2)}ms\n`;
      report += `  Max: ${data.max.toFixed(2)}ms\n`;
      report += `  Avg: ${data.avg.toFixed(2)}ms\n`;
      report += `  Median: ${data.median.toFixed(2)}ms\n`;
      report += `  Total: ${data.total.toFixed(2)}ms\n\n`;
    }

    return report;
  }
}

/**
 * Timer global de la aplicación
 */
export const perfTimer = new PerformanceTimer();

/**
 * Decorator para medir tiempo de funciones
 * @param {string} label - Etiqueta para el timing
 * @returns {Function} Decorated function
 */
export function timed(label) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const timerLabel = label || `${target.constructor.name}.${propertyKey}`;
      perfTimer.start(timerLabel);
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        perfTimer.end(timerLabel);
      }
    };

    return descriptor;
  };
}

/**
 * Wrapper de función para medir tiempo
 * @param {Function} fn - Función a medir
 * @param {string} label - Etiqueta para el timing
 * @returns {Function} Función wrapped
 */
export function withTiming(fn, label) {
  return async function(...args) {
    const timerLabel = label || fn.name;
    perfTimer.start(timerLabel);
    
    try {
      return await fn.apply(this, args);
    } finally {
      perfTimer.end(timerLabel);
    }
  };
}

/**
 * Mide el FPS actual
 */
export class FPSMeter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.isRunning = false;
  }

  /**
   * Inicia la medición de FPS
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frames = 0;
    this.lastTime = performance.now();
    this.measure();
  }

  /**
   * Detiene la medición de FPS
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Función de medición recursiva
   */
  measure() {
    if (!this.isRunning) return;

    this.frames++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    // Actualizar FPS cada segundo
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = currentTime;
      
      logger.debug(`FPS: ${this.fps}`);
    }

    requestAnimationFrame(() => this.measure());
  }

  /**
   * Obtiene el FPS actual
   * @returns {number}
   */
  getFPS() {
    return this.fps;
  }
}

/**
 * Medidor de memoria (si está disponible)
 */
export class MemoryMonitor {
  /**
   * Verifica si la API de memoria está disponible
   * @returns {boolean}
   */
  static isAvailable() {
    return !!(performance && performance.memory);
  }

  /**
   * Obtiene información de memoria actual
   * @returns {Object|null}
   */
  static getMemoryInfo() {
    if (!this.isAvailable()) {
      return null;
    }

    const memory = performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)
    };
  }

  /**
   * Formatea información de memoria legible
   * @returns {string}
   */
  static formatMemoryInfo() {
    const info = this.getMemoryInfo();
    if (!info) return 'Memory API no disponible';

    const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);

    return `Memory: ${toMB(info.usedJSHeapSize)}MB / ${toMB(info.jsHeapSizeLimit)}MB (${info.usedPercent}%)`;
  }
}

/**
 * Monitorea el rendimiento general del juego
 */
export class GamePerformanceMonitor {
  constructor() {
    this.fpsMeter = new FPSMeter();
    this.metrics = {
      cardRenders: 0,
      overlayOpens: 0,
      stateUpdates: 0
    };
  }

  /**
   * Inicia el monitoreo
   */
  start() {
    this.fpsMeter.start();
    logger.info('Performance monitoring iniciado');
  }

  /**
   * Detiene el monitoreo
   */
  stop() {
    this.fpsMeter.stop();
    logger.info('Performance monitoring detenido');
  }

  /**
   * Registra una métrica
   * @param {string} metric - Nombre de la métrica
   * @param {number} value - Valor (default: incrementa en 1)
   */
  record(metric, value = 1) {
    if (metric in this.metrics) {
      this.metrics[metric] += value;
    } else {
      this.metrics[metric] = value;
    }
  }

  /**
   * Obtiene reporte completo
   * @returns {Object}
   */
  getReport() {
    return {
      fps: this.fpsMeter.getFPS(),
      memory: MemoryMonitor.getMemoryInfo(),
      metrics: { ...this.metrics },
      timings: perfTimer.getAllStats()
    };
  }

  /**
   * Imprime reporte en consola
   */
  printReport() {
    const report = this.getReport();
    
    console.group('🎮 Game Performance Report');
    console.log('FPS:', report.fps);
    console.log('Memory:', MemoryMonitor.formatMemoryInfo());
    console.log('Metrics:', report.metrics);
    console.log('Timings:');
    console.table(report.timings);
    console.groupEnd();
  }
}

/**
 * Monitor global de performance
 */
export const perfMonitor = new GamePerformanceMonitor();
