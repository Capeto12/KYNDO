/**
 * KYNDO Memory - Sistema de Animaciones
 * 
 * Maneja animaciones y efectos visuales del juego.
 * Separado de ui-renderer para mejor organización.
 * 
 * @version 1.0
 */

import { wait } from './utils.js';

/**
 * Clase para gestionar animaciones de cartas
 */
export class CardAnimations {
  /**
   * Anima el flip de una carta
   * @param {HTMLElement} card - Elemento de carta
   * @param {number} duration - Duración en ms
   * @returns {Promise}
   */
  static async flip(card, duration = 200) {
    card.style.transition = `transform ${duration}ms ease`;
    card.style.transform = 'rotateY(180deg)';
    await wait(duration);
    card.style.transform = 'rotateY(0deg)';
  }

  /**
   * Anima un match exitoso
   * @param {HTMLElement} cardA - Primera carta
   * @param {HTMLElement} cardB - Segunda carta
   * @returns {Promise}
   */
  static async matchSuccess(cardA, cardB) {
    const cards = [cardA, cardB];
    
    // Pulso de éxito
    cards.forEach(card => {
      card.style.animation = 'matchPulse 300ms ease';
    });
    
    await wait(300);
    
    // Limpiar animación
    cards.forEach(card => {
      card.style.animation = '';
    });
  }

  /**
   * Anima un error (miss)
   * @param {HTMLElement} cardA - Primera carta
   * @param {HTMLElement} cardB - Segunda carta
   * @returns {Promise}
   */
  static async matchFail(cardA, cardB) {
    const cards = [cardA, cardB];
    
    // Shake de error
    cards.forEach(card => {
      card.style.animation = 'shake 400ms ease';
    });
    
    await wait(400);
    
    // Limpiar animación
    cards.forEach(card => {
      card.style.animation = '';
    });
  }

  /**
   * Anima el hover de una carta
   * @param {HTMLElement} card - Elemento de carta
   */
  static hoverIn(card) {
    card.style.transform = 'scale(1.05) translateY(-2px)';
  }

  /**
   * Anima el hover out de una carta
   * @param {HTMLElement} card - Elemento de carta
   */
  static hoverOut(card) {
    card.style.transform = '';
  }
}

/**
 * Clase para efectos de partículas simples
 */
export class ParticleEffects {
  /**
   * Crea confetti simple en una posición
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} count - Número de partículas
   */
  static confetti(x, y, count = 10) {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: ${colors[i % colors.length]};
        border-radius: 50%;
        pointer-events: none;
        left: ${x}px;
        top: ${y}px;
        z-index: 1000;
      `;
      
      document.body.appendChild(particle);
      
      // Animar
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 100 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 200;
      
      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        { 
          transform: `translate(${vx}px, ${vy}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'cubic-bezier(.17,.67,.83,.67)'
      }).finished.then(() => {
        particle.remove();
      });
    }
  }

  /**
   * Crea efecto de brillo en un elemento
   * @param {HTMLElement} element - Elemento a brillar
   * @param {number} duration - Duración en ms
   */
  static async shine(element, duration = 500) {
    element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    await wait(duration);
    element.style.boxShadow = '';
  }

  /**
   * Crea efecto de pulsación
   * @param {HTMLElement} element - Elemento a pulsar
   * @param {number} count - Número de pulsos
   */
  static async pulse(element, count = 1) {
    for (let i = 0; i < count; i++) {
      element.style.transform = 'scale(1.1)';
      await wait(150);
      element.style.transform = 'scale(1)';
      await wait(150);
    }
  }
}

/**
 * Clase para animaciones de UI
 */
export class UIAnimations {
  /**
   * Anima la aparición de un elemento
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} type - Tipo de animación
   * @returns {Promise}
   */
  static async fadeIn(element, type = 'fade') {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    if (type === 'fade') {
      await element.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration: 200,
        fill: 'forwards'
      }).finished;
    } else if (type === 'slide') {
      await element.animate([
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 300,
        fill: 'forwards'
      }).finished;
    } else if (type === 'scale') {
      await element.animate([
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 250,
        fill: 'forwards'
      }).finished;
    }
    
    element.style.opacity = '';
  }

  /**
   * Anima la desaparición de un elemento
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} type - Tipo de animación
   * @returns {Promise}
   */
  static async fadeOut(element, type = 'fade') {
    if (type === 'fade') {
      await element.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 200,
        fill: 'forwards'
      }).finished;
    } else if (type === 'slide') {
      await element.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-20px)' }
      ], {
        duration: 300,
        fill: 'forwards'
      }).finished;
    } else if (type === 'scale') {
      await element.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.8)' }
      ], {
        duration: 250,
        fill: 'forwards'
      }).finished;
    }
    
    element.style.display = 'none';
    element.style.opacity = '';
  }

  /**
   * Anima un número incrementándolo
   * @param {HTMLElement} element - Elemento que contiene el número
   * @param {number} from - Número inicial
   * @param {number} to - Número final
   * @param {number} duration - Duración en ms
   */
  static async animateNumber(element, from, to, duration = 500) {
    const startTime = performance.now();
    const difference = to - from;
    
    return new Promise(resolve => {
      function update() {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + difference * eased);
        
        element.textContent = String(current);
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      }
      
      update();
    });
  }

  /**
   * Anima texto escribiéndose
   * @param {HTMLElement} element - Elemento de texto
   * @param {string} text - Texto a escribir
   * @param {number} speed - Velocidad en ms por caracter
   */
  static async typeWriter(element, text, speed = 50) {
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      await wait(speed);
    }
  }
}

/**
 * Clase para transiciones de página
 */
export class PageTransitions {
  /**
   * Transición de fade entre páginas
   * @param {HTMLElement} oldPage - Página actual
   * @param {HTMLElement} newPage - Página nueva
   * @returns {Promise}
   */
  static async fade(oldPage, newPage) {
    await UIAnimations.fadeOut(oldPage);
    await UIAnimations.fadeIn(newPage);
  }

  /**
   * Transición de slide entre páginas
   * @param {HTMLElement} oldPage - Página actual
   * @param {HTMLElement} newPage - Página nueva
   * @param {string} direction - Dirección ('left', 'right')
   * @returns {Promise}
   */
  static async slide(oldPage, newPage, direction = 'left') {
    const translateOut = direction === 'left' ? '-100%' : '100%';
    const translateIn = direction === 'left' ? '100%' : '-100%';
    
    newPage.style.transform = `translateX(${translateIn})`;
    newPage.style.display = 'block';
    
    await Promise.all([
      oldPage.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(${translateOut})` }
      ], {
        duration: 300,
        fill: 'forwards'
      }).finished,
      
      newPage.animate([
        { transform: `translateX(${translateIn})` },
        { transform: 'translateX(0)' }
      ], {
        duration: 300,
        fill: 'forwards'
      }).finished
    ]);
    
    oldPage.style.display = 'none';
    oldPage.style.transform = '';
    newPage.style.transform = '';
  }
}

/**
 * CSS adicional para animaciones (para incluir en styles.css)
 */
export const ANIMATION_CSS = `
@keyframes matchPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
