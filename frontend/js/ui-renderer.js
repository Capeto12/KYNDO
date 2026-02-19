/**
 * KYNDO Memory - Renderizador de UI
 * 
 * Maneja toda la interacción con el DOM y presentación visual.
 * Separado de la lógica del juego para mejor mantenibilidad.
 * 
 * @version 1.0
 */

import { CARD_STATES, RESULT_DELAY_MS } from './config.js';
import { MESSAGES, STAT_LABELS } from './constants.js';

/**
 * Clase que maneja la actualización del HUD
 */
export class HUDRenderer {
  constructor(elements) {
    this.elements = elements;
  }

  /**
   * Actualiza todos los elementos del HUD con el estado actual
   * @param {Object} gameState - Estado actual del juego
   */
  update(gameState) {
    this.elements.matches.textContent = String(gameState.matches);
    this.elements.pairs.textContent = String(gameState.totalPairs);
    this.elements.attempts.textContent = String(gameState.attempts);
    this.elements.maxAttempts.textContent = String(gameState.maxAttempts);
    this.elements.streak.textContent = String(gameState.streak);
    this.elements.score.textContent = String(gameState.score);
    this.elements.grade.textContent = String(gameState.grade);
  }
}

/**
 * Clase que maneja el overlay de foco (carta grande)
 */
export class FocusOverlay {
  constructor(elements) {
    this.overlay = elements.overlay;
    this.focusImage = elements.focusImage;
    this.focusName = elements.focusName;
    this.focusAtk = elements.focusAtk;
    this.focusDef = elements.focusDef;
  }

  /**
   * Abre el overlay con información de una carta
   * @param {number} objectId - ID del objeto a mostrar
   */
  open(objectId) {
    // Contenido ficticio para pruebas (será reemplazado con datos reales)
    const fakeName = `AVE ${objectId + 1}`;
    const fakeAtk = 10 + (objectId % 9);
    const fakeDef = 10 + ((objectId + 3) % 9);

    this.focusImage.textContent = `🜁 ${objectId + 1}`;
    this.focusName.textContent = fakeName;
    this.focusAtk.textContent = `ATK ${fakeAtk}`;
    this.focusDef.textContent = `DEF ${fakeDef}`;

    this.overlay.classList.add('active');
  }

  /**
   * Cierra el overlay
   */
  close() {
    this.overlay.classList.remove('active');
  }

  /**
   * Verifica si el overlay está abierto
   * @returns {boolean}
   */
  isOpen() {
    return this.overlay.classList.contains('active');
  }
}

/**
 * Clase que maneja el overlay de resultados
 */
export class ResultOverlay {
  constructor(elements, callbacks) {
    this.overlay = elements.overlay;
    this.elements = {
      title: elements.title,
      subtitle: elements.subtitle,
      pairs: elements.pairs,
      attempts: elements.attempts,
      score: elements.score,
      maxStreak: elements.maxStreak,
      btnPrimary: elements.btnPrimary,
      btnSecondary: elements.btnSecondary
    };
    this.callbacks = callbacks;
  }

  /**
   * Muestra el overlay de resultados
   * @param {Object} gameState - Estado final del juego
   * @param {boolean} passed - Si el jugador pasó el nivel
   */
  show(gameState, passed) {
    // Actualizar métricas
    this.elements.pairs.textContent = `${gameState.matches}/${gameState.totalPairs}`;
    this.elements.attempts.textContent = `${gameState.attempts}/${gameState.maxAttempts}`;
    this.elements.score.textContent = String(gameState.score);
    this.elements.maxStreak.textContent = String(gameState.maxStreakSeen);

    if (passed) {
      this.elements.title.textContent = MESSAGES.RESULT_PASSED_TITLE;
      this.elements.subtitle.textContent = MESSAGES.RESULT_PASSED_SUBTITLE;
      this.elements.btnPrimary.textContent = MESSAGES.RESULT_PASSED_BTN_PRIMARY;
      this.elements.btnSecondary.textContent = MESSAGES.RESULT_PASSED_BTN_SECONDARY;
    } else {
      this.elements.title.textContent = MESSAGES.RESULT_FAILED_TITLE;
      this.elements.subtitle.textContent = MESSAGES.RESULT_FAILED_SUBTITLE;
      this.elements.btnPrimary.textContent = MESSAGES.RESULT_FAILED_BTN_PRIMARY;
      this.elements.btnSecondary.textContent = MESSAGES.RESULT_FAILED_BTN_SECONDARY;
    }

    // Configurar callbacks de botones
    this.elements.btnPrimary.onclick = () => {
      this.close();
      this.callbacks.onPrimary(passed);
    };

    this.elements.btnSecondary.onclick = () => {
      this.close();
      this.callbacks.onSecondary(passed);
    };

    this.overlay.classList.add('active');
  }

  /**
   * Cierra el overlay
   */
  close() {
    this.overlay.classList.remove('active');
  }
}

/**
 * Clase que maneja el tablero de cartas
 */
export class BoardRenderer {
  constructor(boardElement) {
    this.board = boardElement;
    this.cards = new Map(); // Map de cardId -> HTMLElement
  }

  /**
   * Configura el grid dinámico del tablero
   * @param {number} columns - Número de columnas
   */
  setupGrid(columns) {
    this.board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  /**
   * Crea una carta en el DOM
   * @param {string} cardId - ID único de la carta
   * @param {number} objectId - ID del objeto que representa
   * @param {Function} onClick - Callback al hacer click
   * @returns {HTMLElement} Elemento de carta creado
   */
  createCard(cardId, objectId, onClick) {
    const card = document.createElement('div');
    card.className = `card ${CARD_STATES.HIDDEN}`;
    card.dataset.state = CARD_STATES.HIDDEN;
    card.dataset.objectId = String(objectId);
    card.dataset.cardId = cardId;

    card.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onClick(card);
    });

    this.board.appendChild(card);
    this.cards.set(cardId, card);
    
    return card;
  }

  /**
   * Actualiza el estado visual de una carta
   * @param {string} cardId - ID de la carta
   * @param {string} newState - Nuevo estado (hidden, revealed, pending, matched)
   */
  updateCardState(cardId, newState) {
    const card = this.cards.get(cardId);
    if (!card) return;

    const oldState = card.dataset.state;
    card.dataset.state = newState;
    
    // Actualizar clases CSS
    Object.values(CARD_STATES).forEach(state => {
      card.classList.remove(state);
    });
    card.classList.add(newState);
  }

  /**
   * Obtiene todas las cartas en estado pending
   * @returns {HTMLElement[]} Array de cartas pending
   */
  getPendingCards() {
    return Array.from(this.board.querySelectorAll(`.${CARD_STATES.PENDING}`));
  }

  /**
   * Limpia el tablero completamente
   */
  clear() {
    this.board.innerHTML = '';
    this.cards.clear();
  }

  /**
   * Obtiene el objectId de una carta
   * @param {HTMLElement} cardElement - Elemento de carta
   * @returns {number} ID del objeto
   */
  getCardObjectId(cardElement) {
    return Number(cardElement.dataset.objectId);
  }

  /**
   * Obtiene el cardId de una carta
   * @param {HTMLElement} cardElement - Elemento de carta
   * @returns {string} ID de la carta
   */
  getCardId(cardElement) {
    return cardElement.dataset.cardId;
  }

  /**
   * Obtiene el estado de una carta
   * @param {HTMLElement} cardElement - Elemento de carta
   * @returns {string} Estado actual
   */
  getCardState(cardElement) {
    return cardElement.dataset.state;
  }
}

/**
 * Muestra el overlay de resultados con una pausa cognitiva
 * @param {ResultOverlay} resultOverlay - Instancia del overlay de resultados
 * @param {Object} gameState - Estado del juego
 * @param {boolean} passed - Si pasó el nivel
 */
export function showResultWithDelay(resultOverlay, gameState, passed) {
  setTimeout(() => {
    resultOverlay.show(gameState, passed);
  }, RESULT_DELAY_MS);
}

/**
 * Muestra una notificación temporal de recompensa al jugador.
 * Se inserta en el DOM y se elimina automáticamente tras unos segundos.
 *
 * @param {string} message - Mensaje a mostrar
 * @param {number} [durationMs=3000] - Duración de la notificación en ms
 */
export function showRewardNotification(message, durationMs = 3000) {
  const notification = document.createElement('div');
  notification.className = 'reward-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Forzar reflow para que la transición CSS se active correctamente
  void notification.offsetHeight;
  notification.classList.add('reward-notification--visible');

  setTimeout(() => {
    notification.classList.remove('reward-notification--visible');
    notification.addEventListener('transitionend', () => notification.remove(), { once: true });
  }, durationMs);
}
