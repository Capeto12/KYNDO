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

    // Display first cards
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
  }

  /**
   * Display current round's cards
   */
  displayCurrentCards() {
    if (!this.game || this.game.status !== 'ongoing') return;

    const playerCard = this.game.playerDeck[this.game.currentRoundIndex];
    const opponentCard = this.game.opponentDeck[this.game.currentRoundIndex];

    if (playerCard && opponentCard) {
      this.renderer.displayCard(playerCard, 'playerCardSlot');
      this.renderer.displayCard(opponentCard, 'opponentCardSlot');
    }
  }

  /**
   * Play single round
   */
  async playNextRound() {
    if (!this.game || this.game.status !== 'ongoing') return;

    this.renderer.setLoading(true);
    this.renderer.setButtonsEnabled(false);

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
    const sampleDeck = getSampleDeck();
    
    // Create opponent deck (slightly stronger)
    const opponentDeck = [
      {
        cardId: 'halcon-peregrino',
        name: 'Halcón Peregrino',
        image: 'content/birds/halcon-peregrino-1.webp',
        rarity: 'uncommon',
        attackFactors: { P: 6, S: 9, W: 7, H: 6, A: 6 },
        defenseFactors: { AD: 5, C: 5, E: 8, SD: 4, R: 4 }
      },
      {
        cardId: 'aguila-real',
        name: 'Águila Real',
        image: 'content/birds/aguila-real-1.webp',
        rarity: 'rare',
        attackFactors: { P: 7, S: 7, W: 8, H: 7, A: 6 },
        defenseFactors: { AD: 6, C: 4, E: 6, SD: 5, R: 7 }
      },
      {
        cardId: 'buho-real',
        name: 'Búho Real',
        image: 'content/birds/buho-real-1.webp',
        rarity: 'epic',
        attackFactors: { P: 8, S: 6, W: 7, H: 9, A: 5 },
        defenseFactors: { AD: 7, C: 8, E: 4, SD: 6, R: 6 }
      }
    ];

    await this.initializeBattle(sampleDeck, opponentDeck, {
      environment: 'neutral',
      playerHealth: 100
    });

    return this.containerElement;
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
