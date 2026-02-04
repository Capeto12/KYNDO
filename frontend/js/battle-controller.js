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
    this.fullPlayerDeck = [];
    this.fullOpponentDeck = [];
    this.playerPrep = [];
    this.opponentPrep = [];
    this.playerReady = false;
    this.opponentReady = false;
  }

  /**
   * Initialize pre-battle board (no combat yet)
   */
  async initializePreBattle(playerDeck, opponentDeck) {
    this.fullPlayerDeck = playerDeck.map(card => new BattleCard(card));
    this.fullOpponentDeck = opponentDeck.map(card => new BattleCard(card));
    this.playerPrep = [];
    this.opponentPrep = this.fullOpponentDeck.slice(0, 5);
    this.playerReady = false;
    this.opponentReady = true; // demo: máquina ya tiene 5

    this.containerElement = this.renderer.mountBattle();
    this.setupEventListeners();
    this.setupPrebattleDragAndDrop();

    this.renderer.renderDeckList(this.fullPlayerDeck, 0);
    this.renderer.renderPrepList(this.playerPrep);
    this.renderer.renderOpponentPrep(this.opponentPrep);
    this.updateReadyStates();

    return this.containerElement;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const playRoundBtn = this.containerElement.querySelector('#playRoundBtn');
    const autoBattleBtn = this.containerElement.querySelector('#autoBattleBtn');
    const readyBtn = this.containerElement.querySelector('#readyBtn');
    const battleBtn = this.containerElement.querySelector('#battleBtn');
    const cont4 = this.containerElement.querySelector('.cont4');

    if (playRoundBtn) {
      playRoundBtn.addEventListener('click', () => this.playNextRound());
    }

    if (autoBattleBtn) {
      autoBattleBtn.addEventListener('click', () => this.autoBattle());
    }

    if (readyBtn) {
      readyBtn.addEventListener('click', () => {
        if (this.playerPrep.length === 5) {
          this.playerReady = true;
          this.updateReadyStates();
        }
      });
    }

    if (battleBtn) {
      battleBtn.addEventListener('click', () => {
        if (this.playerReady && this.opponentReady) {
          this.startBattleFromPrep();
        }
      });
    }

    if (cont4) {
      cont4.addEventListener('click', () => {
        cont4.classList.toggle('expanded');
      });
    }
  }

  /**
   * Drag & drop handlers for deck ordering and playing
   */
  setupPrebattleDragAndDrop() {
    const stagingList = this.containerElement.querySelector('#playerStagingList');
    const prepList = this.containerElement.querySelector('#playerPrepList');

    if (!stagingList || !prepList) return;

    stagingList.addEventListener('dragstart', (event) => {
      const cardEl = event.target.closest('.staging-card');
      if (!cardEl) return;
      const index = Number(cardEl.dataset.index);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('staging-index', String(index));
    });

    // Tap/click to send to prep (mobile friendly)
    stagingList.addEventListener('click', (event) => {
      const cardEl = event.target.closest('.staging-card');
      if (!cardEl) return;
      const index = Number(cardEl.dataset.index);
      if (Number.isNaN(index)) return;
      if (this.playerPrep.length >= 5) return;
      const [card] = this.fullPlayerDeck.splice(index, 1);
      if (card) this.playerPrep.push(card);
      this.renderer.renderDeckList(this.fullPlayerDeck, 0);
      this.renderer.renderPrepList(this.playerPrep);
      this.updateReadyStates();
    });

    prepList.addEventListener('dragstart', (event) => {
      const cardEl = event.target.closest('.prep-card');
      if (!cardEl) return;
      const index = Number(cardEl.dataset.index);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('prep-index', String(index));
    });

    prepList.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    prepList.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromStaging = event.dataTransfer.getData('staging-index');
      const fromPrep = event.dataTransfer.getData('prep-index');

      if (fromStaging && this.playerPrep.length < 5) {
        const idx = Number(fromStaging);
        if (!Number.isNaN(idx)) {
          const [card] = this.fullPlayerDeck.splice(idx, 1);
          if (card) {
            this.playerPrep.push(card);
          }
        }
      }

      if (fromPrep) {
        const idx = Number(fromPrep);
        if (!Number.isNaN(idx)) {
          const [card] = this.playerPrep.splice(idx, 1);
          if (card) {
            this.fullPlayerDeck.push(card);
          }
        }
      }

      this.renderer.renderDeckList(this.fullPlayerDeck, 0);
      this.renderer.renderPrepList(this.playerPrep);
      this.updateReadyStates();
    });

    // Click to remove from prep
    prepList.addEventListener('click', (event) => {
      const cardEl = event.target.closest('.prep-card');
      if (!cardEl) return;
      const idx = Number(cardEl.dataset.index);
      if (Number.isNaN(idx)) return;
      const [card] = this.playerPrep.splice(idx, 1);
      if (card) this.fullPlayerDeck.push(card);
      this.renderer.renderDeckList(this.fullPlayerDeck, 0);
      this.renderer.renderPrepList(this.playerPrep);
      this.updateReadyStates();
    });
  }

  updateReadyStates() {
    const readyBtn = this.containerElement.querySelector('#readyBtn');
    const battleBtn = this.containerElement.querySelector('#battleBtn');
    const attackerBadge = this.containerElement.querySelector('#attackerBadge');

    if (readyBtn) {
      readyBtn.disabled = this.playerPrep.length < 5;
    }

    if (battleBtn) {
      battleBtn.disabled = !(this.playerReady && this.opponentReady);
    }

    if (attackerBadge) {
      attackerBadge.textContent = this.game ? 'ATK' : 'DEF';
      attackerBadge.classList.toggle('attacker', !!this.game);
    }
  }

  startBattleFromPrep() {
    if (this.game) return;
    if (this.playerPrep.length !== 5 || this.opponentPrep.length !== 5) return;

    this.game = new BattleGame(this.playerPrep, this.opponentPrep, {
      environment: 'neutral',
      playerHealth: 100
    });

    this.renderer.updateHealth(
      this.game.playerHealth,
      this.game.opponentHealth,
      this.game.maxHealth
    );

    this.renderer.updateRoundNumber(1, this.game.playerDeck.length);
    this.displayCurrentCards();

    this.renderer.setButtonsEnabled(true);
    this.updateReadyStates();
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
  handleCardDrop() { /* replaced by prebattle drag logic */ }

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
    // No need to place in arena; reveal handled after result

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
    this.playerPrep = [];
    this.opponentPrep = [];
    this.playerReady = false;
    this.opponentReady = false;
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

    await this.initializePreBattle(sampleDeck, opponentDeck);

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
