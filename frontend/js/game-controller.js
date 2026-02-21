/**
 * KYNDO Memory - Controlador Principal
 * 
 * Orquesta la lógica del juego y la presentación.
 * Separa claramente responsabilidades según principios de ARCHITECTURE.md
 * 
 * @version 1.0
 */

import { GRADE_CONFIG, CARD_STATES } from './config.js';
import { DOM_IDS, MESSAGES } from './constants.js';
import {
  MemoryGameState,
  computeColumns,
  buildObjectIds,
  isValidGrade,
  getNextGrade,
  canonicalPairKey
} from './game-engine.js';
import {
  HUDRenderer,
  FocusOverlay,
  ResultOverlay,
  BoardRenderer,
  showResultWithDelay,
  showRewardNotification
} from './ui-renderer.js';
import { progressStorage } from './storage.js';
import {
  errorHandler,
  validateElement,
  validateRequiredElements,
  ValidationError
} from './error-handler.js';
import { checkStreakReward, getGradePassReward } from './rewards.js';
import { deckManager } from './deck-manager.js';

/**
 * Controlador principal del juego Memory
 */
export class MemoryGameController {
  constructor(elements) {
    // Estado del juego
    this.gameState = null;
    this.currentGrade = this.loadGrade();

    // Renderizadores de UI
    this.hudRenderer = new HUDRenderer({
      matches: elements.hudMatches,
      pairs: elements.hudPairs,
      attempts: elements.hudAttempts,
      maxAttempts: elements.hudMaxAttempts,
      streak: elements.hudStreak,
      score: elements.hudScore,
      grade: elements.hudGrade
    });

    this.focusOverlay = new FocusOverlay({
      overlay: elements.overlay,
      focusImage: elements.focusImage,
      focusName: elements.focusName,
      focusAtk: elements.focusAtk,
      focusDef: elements.focusDef
    });

    this.resultOverlay = new ResultOverlay({
      overlay: elements.resultOverlay,
      title: elements.resultTitle,
      subtitle: elements.resultSub,
      pairs: elements.resultPairs,
      attempts: elements.resultAttempts,
      score: elements.resultScore,
      maxStreak: elements.resultMaxStreak,
      btnPrimary: elements.btnPrimary,
      btnSecondary: elements.btnSecondary
    }, {
      onPrimary: (passed) => this.handlePrimaryButton(passed),
      onSecondary: (passed) => this.handleSecondaryButton(passed)
    });

    this.boardRenderer = new BoardRenderer(elements.board);

    // Estado temporal
    this.revealedCards = [];
    this.pendingLock = false;

    // Configurar eventos globales
    this.setupGlobalEvents(elements);
  }

  /**
   * Carga el grado guardado o retorna el default
   * @returns {number} Grado actual
   */
  loadGrade() {
    const grade = progressStorage.getGrade(1);
    return isValidGrade(grade) ? grade : 1;
  }

  /**
   * Guarda el grado actual
   */
  saveGrade() {
    progressStorage.saveGrade(this.currentGrade);
  }

  /**
   * Configura eventos globales (overlay, tablero)
   * @param {Object} elements - Elementos del DOM
   */
  setupGlobalEvents(elements) {
    // Click en overlay cierra el foco y evalúa par si hay 2 cartas
    elements.overlay.addEventListener('click', () => {
      this.handleOverlayClick();
    });

    // Click en el tablero (fuera de cartas) limpia pending
    elements.board.addEventListener('click', (ev) => {
      if (ev.target === elements.board) {
        this.clearPendingCards();
      }
    });
  }

  /**
   * Inicia una nueva partida con el grado actual
   */
  startRun() {
    // Crear nuevo estado de juego
    this.gameState = new MemoryGameState(this.currentGrade);

    // Resetear UI
    this.boardRenderer.clear();
    this.revealedCards = [];
    this.pendingLock = false;

    // Configurar grid
    const columns = computeColumns(this.gameState.totalCards);
    this.boardRenderer.setupGrid(columns);

    // Obtener cartas desde el mazo o generar aleatorias
    let objectIds = [];
    const pairsDeck = deckManager.getDeck(1); // Deck 1 is 'Mazo Pairs'

    if (pairsDeck && pairsDeck.cards.length >= this.gameState.totalPairs) {
      // Usar cartas del mazo (primeras N necesarias)
      const deckCardIds = pairsDeck.cards.slice(0, this.gameState.totalPairs);
      // Duplicar y barajar
      objectIds = [...deckCardIds, ...deckCardIds];
      for (let i = objectIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [objectIds[i], objectIds[j]] = [objectIds[j], objectIds[i]];
      }
      console.log("Iniciando con mazo personalizado:", pairsDeck.name);
    } else {
      // Fallback a IDs numéricos aleatorios
      objectIds = buildObjectIds(this.gameState.totalPairs);
      console.log("Iniciando con cartas aleatorias (mazo insuficiente o no cargado)");
    }

    for (let i = 0; i < this.gameState.totalCards; i++) {
      const cardId = `card-${i}`;
      const objectId = objectIds[i]; // Aquí objectId podría ser el cardId (string) del catálogo

      this.boardRenderer.createCard(
        cardId,
        objectId,
        (card) => this.handleCardClick(card)
      );
    }

    // Actualizar HUD
    this.hudRenderer.update(this.gameState.getState());
  }

  /**
   * Maneja el click en una carta
   * @param {HTMLElement} card - Elemento de carta clickeado
   */
  handleCardClick(card) {
    if (this.pendingLock) return;

    // CRÍTICO: Si hay pending, limpiarlas primero
    if (this.clearPendingCards()) {
      return; // Click consumido en limpieza
    }

    // Validar que la carta se puede revelar
    const cardState = this.boardRenderer.getCardState(card);
    if (cardState !== CARD_STATES.HIDDEN) return;
    if (this.revealedCards.length >= 2) return;

    // Revelar carta
    const cardId = this.boardRenderer.getCardId(card);
    this.boardRenderer.updateCardState(cardId, CARD_STATES.REVEALED);
    this.revealedCards.push(card);

    // Abrir overlay de foco
    const objectId = this.boardRenderer.getCardObjectId(card);
    this.focusOverlay.open(objectId);
  }

  /**
   * Maneja el click en el overlay
   */
  handleOverlayClick() {
    this.focusOverlay.close();

    // Si hay 2 cartas reveladas, resolver el par
    if (this.revealedCards.length === 2) {
      this.resolvePair();
    }
  }

  /**
   * Resuelve un par de cartas reveladas
   */
  resolvePair() {
    const [cardA, cardB] = this.revealedCards;

    const objectIdA = this.boardRenderer.getCardObjectId(cardA);
    const objectIdB = this.boardRenderer.getCardObjectId(cardB);

    const cardIdA = this.boardRenderer.getCardId(cardA);
    const cardIdB = this.boardRenderer.getCardId(cardB);

    // Resolver en el game state
    const result = this.gameState.resolvePair(objectIdA, objectIdB);

    // Actualizar UI según resultado
    if (result.isMatch) {
      // MATCH: Marcar como matched
      this.boardRenderer.updateCardState(cardIdA, CARD_STATES.MATCHED);
      this.boardRenderer.updateCardState(cardIdB, CARD_STATES.MATCHED);
    } else {
      // MISS: Marcar como pending
      this.boardRenderer.updateCardState(cardIdA, CARD_STATES.PENDING);
      this.boardRenderer.updateCardState(cardIdB, CARD_STATES.PENDING);
    }

    // Limpiar cartas reveladas
    this.revealedCards = [];

    // Actualizar HUD
    this.hudRenderer.update(this.gameState.getState());

    // Comprobar si la racha actual genera una recompensa de carta
    if (result.isMatch) {
      const streakReward = checkStreakReward(this.gameState.streak);
      if (streakReward) {
        progressStorage.addReward(streakReward);
        showRewardNotification(MESSAGES.REWARD_STREAK_CARD);
      }
    }

    // Verificar fin de nivel
    this.checkEndOfLevel();
  }

  /**
   * Limpia las cartas pending (las vuelve hidden)
   * @returns {boolean} true si se limpiaron cartas
   */
  clearPendingCards() {
    const pending = this.boardRenderer.getPendingCards();

    if (pending.length === 2) {
      pending.forEach(card => {
        const cardId = this.boardRenderer.getCardId(card);
        this.boardRenderer.updateCardState(cardId, CARD_STATES.HIDDEN);
      });
      return true;
    }

    return false;
  }

  /**
   * Verifica si el nivel terminó y muestra resultado
   */
  checkEndOfLevel() {
    if (!this.gameState.isLevelComplete()) return;

    const passed = this.gameState.didPassLevel();
    const state = this.gameState.getState();

    // Mostrar resultado con delay cognitivo
    showResultWithDelay(this.resultOverlay, state, passed);
  }

  /**
   * Maneja el click en el botón primario del resultado
   * @param {boolean} passed - Si pasó el nivel
   */
  handlePrimaryButton(passed) {
    if (passed) {
      // Otorgar recompensa por pasar el grado antes de subir
      const gradeReward = getGradePassReward(this.currentGrade);
      progressStorage.addReward(gradeReward);
      showRewardNotification(MESSAGES.REWARD_GRADE_PASS_PACK);

      // Subir de grado
      this.currentGrade = getNextGrade(this.currentGrade);
      this.saveGrade();
    }

    // Reiniciar partida con el grado actual (o incrementado)
    this.startRun();
  }

  /**
   * Maneja el click en el botón secundario del resultado
   * @param {boolean} passed - Si pasó el nivel
   */
  handleSecondaryButton(passed) {
    if (passed) {
      // Reintentar el mismo grado
      this.startRun();
    }
    // Si no pasó, solo cerrar (no hace nada más)
  }
}

/**
 * Inicializa el juego cuando el DOM está listo
 */
export function initGame() {
  try {
    // Recolectar todos los elementos del DOM usando constantes
    const elements = {
      board: document.getElementById(DOM_IDS.BOARD),
      overlay: document.getElementById(DOM_IDS.OVERLAY),
      resultOverlay: document.getElementById(DOM_IDS.RESULT_OVERLAY),

      // HUD
      hudMatches: document.getElementById(DOM_IDS.HUD.MATCHES),
      hudPairs: document.getElementById(DOM_IDS.HUD.PAIRS),
      hudAttempts: document.getElementById(DOM_IDS.HUD.ATTEMPTS),
      hudMaxAttempts: document.getElementById(DOM_IDS.HUD.MAX_ATTEMPTS),
      hudStreak: document.getElementById(DOM_IDS.HUD.STREAK),
      hudScore: document.getElementById(DOM_IDS.HUD.SCORE),
      hudGrade: document.getElementById(DOM_IDS.HUD.GRADE),

      // Focus overlay
      focusImage: document.getElementById(DOM_IDS.FOCUS.IMAGE),
      focusName: document.getElementById(DOM_IDS.FOCUS.NAME),
      focusAtk: document.getElementById(DOM_IDS.FOCUS.ATK),
      focusDef: document.getElementById(DOM_IDS.FOCUS.DEF),

      // Result overlay
      resultTitle: document.getElementById(DOM_IDS.RESULT.TITLE),
      resultSub: document.getElementById(DOM_IDS.RESULT.SUBTITLE),
      resultPairs: document.getElementById(DOM_IDS.RESULT.PAIRS),
      resultAttempts: document.getElementById(DOM_IDS.RESULT.ATTEMPTS),
      resultScore: document.getElementById(DOM_IDS.RESULT.SCORE),
      resultMaxStreak: document.getElementById(DOM_IDS.RESULT.MAX_STREAK),
      btnPrimary: document.getElementById(DOM_IDS.RESULT.BTN_PRIMARY),
      btnSecondary: document.getElementById(DOM_IDS.RESULT.BTN_SECONDARY)
    };

    // Validar que todos los elementos críticos existan
    const requiredElements = [
      'board', 'overlay', 'resultOverlay',
      'hudMatches', 'hudPairs', 'hudAttempts', 'hudMaxAttempts',
      'hudStreak', 'hudScore', 'hudGrade'
    ];

    validateRequiredElements(elements, requiredElements);

    // Crear controlador e iniciar juego
    const controller = new MemoryGameController(elements);
    controller.startRun();

    return controller;
  } catch (error) {
    errorHandler.handleError(error);
    errorHandler.showUserError(MESSAGES.ERROR_INIT);
    throw error;
  }
}
