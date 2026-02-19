/**
 * BATTLE CONTROLLER
 * Orchestrates BattleGame engine + BattleUIRenderer
 * Handles events, state management, and user interactions
 */

import { BattleGame, BattleCard, getSampleDeck } from './battle-engine.js';
import { BattleUIRenderer, ComparisonView } from './battle-ui.js';
import { getKombatSetWinReward, getKombatMatchWinReward } from './rewards.js';
import { progressStorage } from './storage.js';
import { showRewardNotification } from './ui-renderer.js';
import { MESSAGES } from './constants.js';

const PACK_PATH = '../content/content/birds/pack-1.json';

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
    this.playerDrawPile = [];
    this.opponentDrawPile = [];
    this.playerPrep = [];
    this.opponentPrep = [];
    this.playerReady = false;
    this.opponentReady = false;
    this._lastPlayerGameWins = 0;
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
    this.playerDrawPile = []; // se llena al iniciar batalla
    this.opponentDrawPile = this.fullOpponentDeck.slice(5);

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
    const autoBattleBtn = this.containerElement.querySelector('#autoBattleBtn');
    const readyBtn = this.containerElement.querySelector('#readyBtn');
    const battleBtn = this.containerElement.querySelector('#battleBtn');
    const cont4 = this.containerElement.querySelector('.cont4');

    if (autoBattleBtn) {
      autoBattleBtn.addEventListener('click', () => {
        if (!this.game && this.playerReady && this.opponentReady) {
          this.startBattleFromPrep();
        }
        this.autoBattle();
      });
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
        if (!this.game && this.playerReady && this.opponentReady) {
          this.startBattleFromPrep();
        } else if (this.game && this.game.status === 'ongoing' && !this.isPlayingRound) {
          this.playNextRound();
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
      if (this.game) {
        if (this.game.playerDeck.length >= 5) return;
        const [card] = this.fullPlayerDeck.splice(index, 1);
        if (card) {
          this.game.playerDeck.push(card);
          // también sacamos de pile si estuviera ahí
          const pileIdx = this.playerDrawPile.findIndex(c => c.cardId === card.cardId);
          if (pileIdx >= 0) this.playerDrawPile.splice(pileIdx, 1);
        }
        this.renderer.renderDeckList(this.fullPlayerDeck, 0);
        this.renderer.renderPrepList(this.game.playerDeck);
      } else {
        if (this.playerPrep.length >= 5) return;
        const [card] = this.fullPlayerDeck.splice(index, 1);
        if (card) this.playerPrep.push(card);
        this.renderer.renderDeckList(this.fullPlayerDeck, 0);
        this.renderer.renderPrepList(this.playerPrep);
        this.updateReadyStates();
      }
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
      if (this.game) {
        const [card] = this.game.playerDeck.splice(idx, 1);
        if (card) {
          this.fullPlayerDeck.push(card);
          this.playerDrawPile.push(card);
        }
        this.renderer.renderDeckList(this.fullPlayerDeck, 0);
        this.renderer.renderPrepList(this.game.playerDeck);
      } else {
        const [card] = this.playerPrep.splice(idx, 1);
        if (card) this.fullPlayerDeck.push(card);
        this.renderer.renderDeckList(this.fullPlayerDeck, 0);
        this.renderer.renderPrepList(this.playerPrep);
        this.updateReadyStates();
      }
    });
  }

  pullFromPlayerPile() {
    if (!this.playerDrawPile.length) return null;
    const idx = Math.floor(Math.random() * this.playerDrawPile.length);
    const [card] = this.playerDrawPile.splice(idx, 1);
    const stagingIdx = this.fullPlayerDeck.findIndex(c => c.cardId === card.cardId);
    if (stagingIdx >= 0) this.fullPlayerDeck.splice(stagingIdx, 1);
    return card;
  }

  pullFromOpponentPile() {
    if (!this.opponentDrawPile.length) return null;
    const idx = Math.floor(Math.random() * this.opponentDrawPile.length);
    const [card] = this.opponentDrawPile.splice(idx, 1);
    return card;
  }

  refillQueues() {
    // Mantener prep de jugador en 5 si hay mazo
    while (this.game && this.game.playerDeck.length < 5 && this.playerDrawPile.length) {
      const card = this.pullFromPlayerPile();
      if (card) this.game.playerDeck.push(card);
    }

    // Mantener prep de oponente
    while (this.game && this.game.opponentDeck.length < 5 && this.opponentDrawPile.length) {
      const card = this.pullFromOpponentPile();
      if (card) this.game.opponentDeck.push(card);
    }
  }

  updateReadyStates() {
    const readyBtn = this.containerElement.querySelector('#readyBtn');
    const battleBtn = this.containerElement.querySelector('#battleBtn');
    const autoBattleBtn = this.containerElement.querySelector('#autoBattleBtn');
    const attackerBadge = this.containerElement.querySelector('#attackerBadge');

    const readyToStart = this.playerReady && this.opponentReady;
    const hasGame = !!this.game;
    const ongoing = hasGame && this.game.status === 'ongoing';
    const busy = this.isPlayingRound || this.isAutoPlaying;

    if (readyBtn) {
      readyBtn.disabled = this.playerPrep.length < 5 || hasGame;
    }

    if (battleBtn) {
      if (!hasGame) {
        battleBtn.textContent = 'Battle';
        battleBtn.disabled = !readyToStart || busy;
      } else {
        battleBtn.textContent = 'Ronda';
        battleBtn.disabled = !ongoing || busy;
      }
    }

    if (autoBattleBtn) {
      autoBattleBtn.disabled = (!ongoing && !readyToStart) || busy;
    }

    if (attackerBadge) {
      attackerBadge.textContent = hasGame ? 'ATK' : 'DEF';
      attackerBadge.classList.toggle('attacker', !!hasGame);
    }
  }

  startBattleFromPrep() {
    if (this.game) return;
    if (this.playerPrep.length !== 5 || this.opponentPrep.length !== 5) return;

    const totalPlayerCards = this.playerPrep.length + this.fullPlayerDeck.length;
    const totalOpponentCards = this.opponentPrep.length + this.opponentDrawPile.length;
    this.game = new BattleGame(this.playerPrep, this.opponentPrep, {
      environment: 'neutral',
      totalPlayerCards,
      totalOpponentCards
    });

    // Configuramos mazos vivos y pilas de robo
    this.playerDrawPile = [...this.fullPlayerDeck];
    this.opponentDrawPile = this.fullOpponentDeck.slice(5);

    this.renderer.updateRoundNumber(1, this.game.maxGames, 1, this.game.roundsPerGame, this.game.playerGameWins, this.game.opponentGameWins, this.game.drawGames);
    this.renderer.setButtonsEnabled(true);
    this.renderer.renderPrepList(this.game.playerDeck);
    this.renderer.renderOpponentPrep(this.game.opponentDeck);
    this.updateReadyStates();
  }

  /**
   * Display current round's cards
   */
  displayCurrentCards() {
    // Arena simplificada: solo mostramos ganador, no precolocamos cartas
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
    this.updateReadyStates();

    // Revelar info del oponente al iniciar la ronda
    const playerCard = this.game.playerDeck[0];
    const opponentCard = this.game.opponentDeck[0];
    this.renderer.revealOpponentCard(opponentCard);

    // Simulate card flip delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Play round
    const roundResult = this.game.playRound();

    if (roundResult) {
      // Show result
      this.renderer.displayRoundResult(roundResult);

      // Alimentar colas (la carta jugada sale del mazo)
      this.refillQueues();
      this.renderer.renderPrepList(this.game.playerDeck);
      this.renderer.renderOpponentPrep(this.game.opponentDeck.map(() => ({ back: true })));

      // Update stats
      const summary = this.game.getSummary();
      this.renderer.updateStats(
        summary.totalRounds,
        summary.playerWins,
        summary.draws
      );

      // Update round counter
      this.renderer.updateRoundNumber(
        roundResult.gameNumber,
        roundResult.maxGames,
        roundResult.roundInGame,
        roundResult.roundsPerGame,
        roundResult.playerGameWins,
        roundResult.opponentGameWins,
        roundResult.drawGames
      );

      // Detectar sets ganados: recompensar por cada set que ganó el jugador
      const newSetWins = roundResult.playerGameWins - this._lastPlayerGameWins;
      if (newSetWins > 0) {
        this._lastPlayerGameWins = roundResult.playerGameWins;
        for (let i = 0; i < newSetWins; i++) {
          const setReward = getKombatSetWinReward();
          progressStorage.addReward(setReward);
        }
        showRewardNotification(MESSAGES.REWARD_KOMBAT_SET_CARD);
      }

      // Refresh deck list state (staging) con las cartas restantes manuales
      this.renderer.renderDeckList(this.fullPlayerDeck, 0);

      // Wait before displaying next cards
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Display next cards or end game
      if (this.game.status === 'ongoing') {
        this.displayCurrentCards();
      } else {
        this.endBattle();
      }
    }

    this.isPlayingRound = false;
    this.renderer.setLoading(false);
    this.renderer.setButtonsEnabled(this.game.status === 'ongoing');
    this.updateReadyStates();
  }

  /**
   * Auto-play entire battle
   */
  async autoBattle() {
    if (this.isAutoPlaying) return; // prevent double-start
    this.isAutoPlaying = true;
    if (!this.game || this.game.status !== 'ongoing') {
      this.isAutoPlaying = false;
      return;
    }
    this.renderer.setButtonsEnabled(false);
    this.updateReadyStates();

    while (this.game.status === 'ongoing') {
      await this.playNextRound();
    }

    this.isAutoPlaying = false;
    this.updateReadyStates();
  }

  /**
   * End battle and show results
   */
  endBattle() {
    const summary = this.game.getSummary();
    this.renderer.showBattleEnd(summary);
    this.renderer.setButtonsEnabled(false);

    // Recompensa por ganar la partida completa de Kombat
    if (summary.status === 'playerWon') {
      const matchReward = getKombatMatchWinReward();
      progressStorage.addReward(matchReward);
      showRewardNotification(MESSAGES.REWARD_KOMBAT_MATCH_PACK);
    }

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
    this._lastPlayerGameWins = 0;
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
    const packDeck = await this.loadPackDeck();
    const sampleDeck = packDeck && packDeck.length ? packDeck : this.buildDemoDeck(40);
    const opponentDeck = this.buildOpponentDeck(sampleDeck);

    await this.initializePreBattle(sampleDeck, opponentDeck);

    return this.containerElement;
  }

  async loadPackDeck() {
    try {
      const response = await fetch(PACK_PATH);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.assets || !data.assets.length) return [];
      return this.buildDeckFromPack(data.assets, data.count || 40);
    } catch (err) {
      console.warn('No se pudo cargar pack de tienda para batalla:', err);
      return [];
    }
  }

  buildDeckFromPack(assets, size = 40) {
    const rarityList = ['abundante', 'frecuente', 'rara', 'excepcional'];
    const cleanPath = (p = '') => {
      return p
        .replace('content/content/birds/content/birds/', '../content/birds/')
        .replace('content/content/birds/', '../content/birds/')
        .replace('content/birds/', '../content/birds/');
    };

    const factorFor = (id, salt) => {
      let acc = 0;
      for (let i = 0; i < id.length; i++) acc += id.charCodeAt(i) + salt;
      return 3 + (acc % 7); // 3..9
    };

    const cards = assets.map((asset, idx) => {
      const rarity = rarityList[idx % rarityList.length];
      const id = asset.id || asset.cardId || `card-${idx}`;
      return {
        cardId: id,
        name: asset.title || id,
        image: cleanPath(asset.image_url || asset.imageUrl || ''),
        rarity,
        attackFactors: {
          P: factorFor(id, 1),
          S: factorFor(id, 3),
          W: factorFor(id, 5),
          H: factorFor(id, 7),
          A: factorFor(id, 9)
        },
        defenseFactors: {
          AD: factorFor(id, 2),
          C: factorFor(id, 4),
          E: factorFor(id, 6),
          SD: factorFor(id, 8),
          R: factorFor(id, 10)
        }
      };
    });

    if (cards.length >= size) return cards.slice(0, size);
    const out = [];
    for (let i = 0; i < size; i++) {
      out.push({ ...cards[i % cards.length], cardId: `${cards[i % cards.length].cardId}-${Math.floor(i / cards.length) + 1}` });
    }
    return out;
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

    // Override battle button to show tutorial messages
    const battleBtn = this.containerElement.querySelector('#battleBtn');
    if (battleBtn) {
      const originalClick = battleBtn.onclick;
      battleBtn.onclick = () => {
        this.showTutorialMessage();
        if (originalClick) originalClick();
      };
    }

    return this.containerElement;
  }
}
