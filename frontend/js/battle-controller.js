/**
 * BATTLE CONTROLLER
 * Orchestrates BattleGame engine + BattleUIRenderer
 * Handles events, state management, and user interactions
 */

import { BattleGame, BattleCard, getSampleDeck } from './battle-engine.js';
import { BattleUIRenderer, ComparisonView } from './battle-ui.js';

export class BattleController {
  constructor() {
    this.game = null;
    this.renderer = new BattleUIRenderer();
    this.comparisonView = new ComparisonView();
    this.isAutoPlaying = false;
    this.containerElement = null;
    this.isPlayingRound = false;
  }

  /**
   * Initialize new battle
   */
  async initializeBattle(playerDeck, opponentDeck, options = {}) {
    // Create game engine
    this.game = new BattleGame(playerDeck, opponentDeck, {
      environment: options.environment || 'neutral',
      playerHealth: options.playerHealth || 100
    });

    // Mount UI
    this.containerElement = this.renderer.mountBattle(playerDeck, opponentDeck);

    // Setup event listeners
    this.setupEventListeners();

    // Update initial UI
    this.renderer.updateHealth(
      this.game.playerHealth,
      this.game.opponentHealth,
      this.game.maxHealth
    );

    this.renderer.updateRoundNumber(1, this.game.playerDeck.length);

    // Render deck order and show opponent card for round 1
    this.renderer.renderDeckList(this.game.playerDeck, this.game.currentRoundIndex);
    this.displayCurrentCards();

    return this.containerElement;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const playRoundBtn = this.containerElement.querySelector('#playRoundBtn');
    const autoBattleBtn = this.containerElement.querySelector('#autoBattleBtn');

    if (playRoundBtn) {
      playRoundBtn.addEventListener('click', () => this.playNextRound());
    }

    if (autoBattleBtn) {
      autoBattleBtn.addEventListener('click', () => this.autoBattle());
    }

    this.setupDragAndDrop();
  }

  /**
   * Drag & drop handlers for deck ordering and playing
   */
  setupDragAndDrop() {
    const deckList = this.containerElement.querySelector('#playerDeckList');
    const playerSlot = this.containerElement.querySelector('#playerCardSlot');

    if (!deckList || !playerSlot) return;

    deckList.addEventListener('dragstart', (event) => {
      const cardEl = event.target.closest('.deck-card');
      if (!cardEl) return;
      const index = Number(cardEl.dataset.index);
      // Block dragging cards ya jugadas
      if (index < this.game.currentRoundIndex) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
      cardEl.classList.add('dragging');
    });

    deckList.addEventListener('dragend', (event) => {
      const cardEl = event.target.closest('.deck-card');
      if (cardEl) {
        cardEl.classList.remove('dragging');
      }
    });

    // Reordenar dentro del mazo
    deckList.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    deckList.addEventListener('drop', (event) => {
      event.preventDefault();
      const targetCard = event.target.closest('.deck-card');
      if (!targetCard) return;
      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      const toIndex = Number(targetCard.dataset.index);
      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;
      this.swapDeckCards(fromIndex, toIndex);
    });

    // Jugar carta arrastrándola al tablero
    playerSlot.addEventListener('dragover', (event) => {
      event.preventDefault();
      playerSlot.classList.add('dropping');
    });

    playerSlot.addEventListener('dragleave', () => {
      playerSlot.classList.remove('dropping');
    });

    playerSlot.addEventListener('drop', (event) => {
      event.preventDefault();
      playerSlot.classList.remove('dropping');
      const index = Number(event.dataTransfer.getData('text/plain'));
      if (Number.isNaN(index)) return;
      this.handleCardDrop(index);
    });
  }

  /**
   * Display current round's cards
   */
  displayCurrentCards() {
    if (!this.game || this.game.status !== 'ongoing') return;

    const opponentCard = this.game.opponentDeck[this.game.currentRoundIndex];

    this.renderer.resetPlayerSlot();

    if (opponentCard) {
      this.renderer.displayCard(opponentCard, 'opponentCardSlot');
    }
  }

  /**
   * Swap two cards inside the player's deck (reorder)
   */
  swapDeckCards(fromIndex, toIndex) {
    if (!this.game || this.game.status !== 'ongoing') return;
    if (fromIndex === toIndex) return;
    if (fromIndex < this.game.currentRoundIndex || toIndex < this.game.currentRoundIndex) return;

    const temp = this.game.playerDeck[fromIndex];
    this.game.playerDeck[fromIndex] = this.game.playerDeck[toIndex];
    this.game.playerDeck[toIndex] = temp;

    this.renderer.renderDeckList(this.game.playerDeck, this.game.currentRoundIndex);
  }

  /**
   * Handle dropping a card onto the player slot to play the round
   */
  handleCardDrop(selectedIndex) {
    if (!this.game || this.game.status !== 'ongoing') return;
    if (selectedIndex < this.game.currentRoundIndex) return; // ya jugada
    const targetIndex = this.game.currentRoundIndex;

    if (selectedIndex !== targetIndex) {
      const temp = this.game.playerDeck[targetIndex];
      this.game.playerDeck[targetIndex] = this.game.playerDeck[selectedIndex];
      this.game.playerDeck[selectedIndex] = temp;
    }

    // Mostrar la carta elegida y jugar automáticamente
    const playerCard = this.game.playerDeck[targetIndex];
    if (playerCard) {
      this.renderer.displayCard(playerCard, 'playerCardSlot');
    }

    this.playNextRound();
  }

  /**
   * Play single round
   */
  async playNextRound() {
    if (!this.game || this.game.status !== 'ongoing') return;
    if (this.isPlayingRound) return;

    this.isPlayingRound = true;

    this.renderer.setLoading(true);
    this.renderer.setButtonsEnabled(false);

    // Si el jugador no arrastró, usamos la carta en la posición actual
    const playerCard = this.game.playerDeck[this.game.currentRoundIndex];
    if (playerCard) {
      this.renderer.displayCard(playerCard, 'playerCardSlot');
    }

    // Simulate card flip delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Play round
    const roundResult = this.game.playRound();

    if (roundResult) {
      // Show result
      this.renderer.displayRoundResult(roundResult);

      // Update health
      this.renderer.updateHealth(
        this.game.playerHealth,
        this.game.opponentHealth,
        this.game.maxHealth
      );

      // Update stats
      const summary = this.game.getSummary();
      this.renderer.updateStats(
        summary.totalRounds,
        summary.playerWins,
        summary.draws
      );

      // Update round counter
      this.renderer.updateRoundNumber(
        this.game.currentRoundIndex + 1,
        this.game.playerDeck.length
      );

      // Refresh deck list state
      this.renderer.renderDeckList(this.game.playerDeck, this.game.currentRoundIndex);

      // Wait before displaying next cards
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Display next cards or end game
      if (this.game.status === 'ongoing') {
        this.displayCurrentCards();
      } else {
        this.endBattle();
      }
    }

    this.renderer.setLoading(false);
    this.renderer.setButtonsEnabled(this.game.status === 'ongoing');
    this.isPlayingRound = false;
  }

  /**
   * Auto-play entire battle
   */
  async autoBattle() {
    if (!this.game || this.game.status !== 'ongoing') return;

    this.isAutoPlaying = true;
    this.renderer.setButtonsEnabled(false);

    while (this.game.status === 'ongoing') {
      await this.playNextRound();
    }

    this.isAutoPlaying = false;
  }

  /**
   * End battle and show results
   */
  endBattle() {
    const summary = this.game.getSummary();
    this.renderer.showBattleEnd(summary);
    this.renderer.setButtonsEnabled(false);

    // Calculate and store battle stats
    const battleStats = this.game.getBattleStats();
    return {
      result: summary.status,
      stats: battleStats,
      history: summary.history
    };
  }

  /**
   * Reset battle (for rematch)
   */
  reset() {
    this.game = null;
    this.isAutoPlaying = false;
    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }
  }

  /**
   * Get current game state (for persistence)
   */
  getGameState() {
    if (!this.game) return null;

    return {
      status: this.game.status,
      currentRound: this.game.currentRoundIndex,
      playerHealth: this.game.playerHealth,
      opponentHealth: this.game.opponentHealth,
      rounds: this.game.rounds.map(r => r.getResults()),
      environment: this.game.environment
    };
  }

  /**
   * Restore game state (for resuming)
   */
  restoreGameState(state) {
    // This is more complex - would require reconstructing the game
    // For now, just log the state
    console.log('Game state to restore:', state);
  }
}

/**
 * Demo Battle Controller
 * Used for tutorials and testing
 */
export class DemoBattleController extends BattleController {
  /**
   * Start demo battle with sample decks
   */
  async startDemo() {
    const sampleDeck = this.buildDemoDeck(40);
    const opponentDeck = this.buildOpponentDeck(sampleDeck);

    await this.initializeBattle(sampleDeck, opponentDeck, {
      environment: 'neutral',
      playerHealth: 100
    });

    return this.containerElement;
  }

  buildDemoDeck(size = 40) {
    const base = getSampleDeck();
    const deck = [];

    for (let i = 0; i < size; i++) {
      const template = base[i % base.length];
      const boost = i % 3; // small variation to avoid identical stats

      deck.push({
        cardId: `${template.cardId}-${i + 1}`,
        name: `${template.name} #${i + 1}`,
        image: template.image,
        rarity: template.rarity,
        attackFactors: {
          P: Math.min(10, (template.attackFactors.P || 0) + boost),
          S: Math.min(10, (template.attackFactors.S || 0) + (boost === 2 ? 1 : 0)),
          W: Math.min(10, (template.attackFactors.W || 0)),
          H: Math.min(10, (template.attackFactors.H || 0) + (boost > 0 ? 1 : 0)),
          A: Math.min(10, (template.attackFactors.A || 0))
        },
        defenseFactors: {
          AD: Math.min(10, (template.defenseFactors.AD || 0) + (boost === 1 ? 1 : 0)),
          C: Math.min(10, (template.defenseFactors.C || 0)),
          E: Math.min(10, (template.defenseFactors.E || 0) + boost),
          SD: Math.min(10, (template.defenseFactors.SD || 0)),
          R: Math.min(10, (template.defenseFactors.R || 0) + (boost > 0 ? 1 : 0))
        }
      });
    }

    return deck;
  }

  buildOpponentDeck(playerDeck) {
    return playerDeck.map((card, idx) => {
      const bump = (idx % 4) + 1; // modest difficulty bump
      const rarityShift = ['abundante', 'frecuente', 'rara', 'excepcional'];
      const nextRarity = rarityShift[Math.min(rarityShift.length - 1, rarityShift.indexOf(card.rarity) + 1)] || card.rarity;

      const plus = (v) => Math.min(10, v + bump * 0.2);

      return {
        ...card,
        cardId: `${card.cardId}-opp`,
        name: `${card.name} (AI)` ,
        rarity: nextRarity,
        attackFactors: {
          P: plus(card.attackFactors.P || 0),
          S: plus(card.attackFactors.S || 0),
          W: plus(card.attackFactors.W || 0),
          H: plus(card.attackFactors.H || 0),
          A: plus(card.attackFactors.A || 0)
        },
        defenseFactors: {
          AD: plus(card.defenseFactors.AD || 0),
          C: plus(card.defenseFactors.C || 0),
          E: plus(card.defenseFactors.E || 0),
          SD: plus(card.defenseFactors.SD || 0),
          R: plus(card.defenseFactors.R || 0)
        }
      };
    });
  }
}

/**
 * Tutorial Battle Controller
 * Explains mechanics step by step
 */
export class TutorialBattleController extends DemoBattleController {
  constructor() {
    super();
    this.tutorialStep = 0;
    this.tutorialMessages = [
      {
        title: 'Bienvenido a Batalla',
        content: 'Compara tus cartas contra un oponente usando Ataque vs Defensa.'
      },
      {
        title: 'Cómo funciona',
        content: 'Tu Ataque se compara contra la Defensa del oponente. Ganas si tu ataque es mayor.'
      },
      {
        title: 'Factores A/D',
        content: 'Cada carta tiene 5 factores de ataque y 5 de defensa. El total se normaliza a 0-99.'
      },
      {
        title: 'Daño',
        content: 'El daño = tu ataque - su defensa. Reduce la salud del oponente a 0 para ganar.'
      }
    ];
  }

  /**
   * Show tutorial message
   */
  showTutorialMessage() {
    if (this.tutorialStep < this.tutorialMessages.length) {
      const msg = this.tutorialMessages[this.tutorialStep];
      console.log(`${msg.title}: ${msg.content}`);
      this.tutorialStep++;
      return msg;
    }
    return null;
  }

  /**
   * Start tutorial
   */
  async startTutorial() {
    // Show intro message
    this.showTutorialMessage();

    // Start demo battle
    await this.startDemo();

    // Override play button to show tutorial messages
    const playBtn = this.containerElement.querySelector('#playRoundBtn');
    if (playBtn) {
      const originalClick = playBtn.onclick;
      playBtn.onclick = () => {
        this.showTutorialMessage();
        if (originalClick) originalClick();
      };
    }

    return this.containerElement;
  }
}
