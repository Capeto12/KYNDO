/**
 * BATTLE ENGINE
 * Pure logic for Attack/Defense (A/D) card battles
 * No DOM access - fully testable and deterministic
 */

import { BATTLE_CONFIG } from './config.js';

/**
 * Attack/Defense calculation
 * All factors normalized to 0-99 scale
 */
export class BattleCard {
  constructor(cardData) {
    this.cardId = cardData.cardId;
    this.name = cardData.name;
    this.image = cardData.image;
    this.strengths = cardData.strengths || { primaryStrength: 'P', secondaryStrength: 'AD' };
    
    // Attack factors (0-10 each)
    this.attackFactors = {
      P: cardData.attackFactors?.P || 5,    // Predación
      S: cardData.attackFactors?.S || 5,    // Velocidad
      W: cardData.attackFactors?.W || 5,    // Weapons (anatomía ofensiva)
      H: cardData.attackFactors?.H || 5,    // Hunt strategy
      A: cardData.attackFactors?.A || 5     // Agresividad
    };

    // Defense factors (0-10 each)
    this.defenseFactors = {
      AD: cardData.defenseFactors?.AD || 5, // Adaptabilidad
      C: cardData.defenseFactors?.C || 5,   // Camuflaje
      E: cardData.defenseFactors?.E || 5,   // Evasión
      SD: cardData.defenseFactors?.SD || 5, // Social defense
      R: cardData.defenseFactors?.R || 5    // Robustez
    };

    // Rarity affects base stats
    this.rarity = cardData.rarity || 'abundante';
    this.applyRarityBonus();
  }

  applyRarityBonus() {
    const multiplier = BATTLE_CONFIG.RARITY_MULTIPLIERS[this.rarity] || 1.0;

    // Apply rarity bonus to all factors (capped at 10)
    Object.keys(this.attackFactors).forEach(key => {
      this.attackFactors[key] = Math.min(10, this.attackFactors[key] * multiplier);
    });

    Object.keys(this.defenseFactors).forEach(key => {
      this.defenseFactors[key] = Math.min(10, this.defenseFactors[key] * multiplier);
    });
  }

  /**
   * Calculate total attack score (0-99)
   * Uses weighted formula from Manual-Maestro
   */
  calculateAttack(environment = 'neutral') {
    const weights = BATTLE_CONFIG.ATTACK_WEIGHTS;
    
    let totalAttack = 0;
    totalAttack += this.attackFactors.P * weights.P;
    totalAttack += this.attackFactors.S * weights.S;
    totalAttack += this.attackFactors.W * weights.W;
    totalAttack += this.attackFactors.H * weights.H;
    totalAttack += this.attackFactors.A * weights.A;

    // Normalize to 0-99 scale
    const atkBase010 =
      this.attackFactors.P * weights.P +
      this.attackFactors.S * weights.S +
      this.attackFactors.W * weights.W +
      this.attackFactors.H * weights.H +
      this.attackFactors.A * weights.A;

    let atkBase099 = Math.round((atkBase010 / 10) * 99);
    atkBase099 = Math.min(99, Math.max(0, atkBase099));

    const env = BATTLE_CONFIG.ENVIRONMENT_BONUSES[environment] || { atk: 0, def: 0 };
    const envAtk = Math.round(atkBase099 * (env.atk / 100));
    const atkFinal = Math.min(99, Math.max(0, atkBase099 + envAtk));
    return atkFinal;
  }

  /**
   * Calculate total defense score (0-99)
   */
  calculateDefense(environment = 'neutral') {
    const weights = BATTLE_CONFIG.DEFENSE_WEIGHTS;
    
    let totalDefense = 0;
    totalDefense += this.defenseFactors.AD * weights.AD;
    totalDefense += this.defenseFactors.C * weights.C;
    totalDefense += this.defenseFactors.E * weights.E;
    totalDefense += this.defenseFactors.SD * weights.SD;
    totalDefense += this.defenseFactors.R * weights.R;

    // Normalize to 0-99 scale
    const defBase010 =
      this.defenseFactors.AD * weights.AD +
      this.defenseFactors.C * weights.C +
      this.defenseFactors.E * weights.E +
      this.defenseFactors.SD * weights.SD +
      this.defenseFactors.R * weights.R;

    let defBase099 = Math.round((defBase010 / 10) * 99);
    defBase099 = Math.min(99, Math.max(0, defBase099));

    const env = BATTLE_CONFIG.ENVIRONMENT_BONUSES[environment] || { atk: 0, def: 0 };
    const envDef = Math.round(defBase099 * (env.def / 100));
    const defFinal = Math.min(99, Math.max(0, defBase099 + envDef));
    return defFinal;
  }

  /**
   * Get score (average of attack and defense)
   */
  getScore(environmentBonus = 0) {
    const attack = this.calculateAttack(environmentBonus);
    const defense = this.calculateDefense(environmentBonus);
    return Math.round((attack + defense) / 2);
  }
}

/**
 * Battle Round
 * Single card comparison
 */
export class BattleRound {
  constructor(playerCard, opponentCard, round = 1, environment = 'neutral') {
    this.playerCard = playerCard;
    this.opponentCard = opponentCard;
    this.round = round;
    this.environment = environment;
    this.environmentBonus = BATTLE_CONFIG.ENVIRONMENT_BONUSES[environment] || { atk: 0, def: 0 };

    // Battle mode: compare attack vs defense
    this.playerAttack = playerCard.calculateAttack(environment);
    this.opponentDefense = opponentCard.calculateDefense(environment);

    this.opponentAttack = opponentCard.calculateAttack(environment);
    this.playerDefense = playerCard.calculateDefense(environment);

    this.determineWinner();
  }

  determineWinner() {
    // Calculate damage
    const playerDamage = Math.max(0, this.playerAttack - this.opponentDefense);
    const opponentDamage = Math.max(0, this.opponentAttack - this.playerDefense);

    if (playerDamage > opponentDamage) {
      this.winner = 'player';
      this.damageDealt = playerDamage;
      this.damageTaken = opponentDamage;
    } else if (opponentDamage > playerDamage) {
      this.winner = 'opponent';
      this.damageDealt = opponentDamage;
      this.damageTaken = playerDamage;
    } else {
      this.winner = 'draw';
      this.damageDealt = playerDamage;
      this.damageTaken = opponentDamage;
    }
  }

  /**
   * Get round results for UI
   */
  getResults() {
    return {
      round: this.round,
      playerCard: this.playerCard.name,
      opponentCard: this.opponentCard.name,
      playerCardImage: this.playerCard.image,
      opponentCardImage: this.opponentCard.image,
      playerCardId: this.playerCard.cardId,
      opponentCardId: this.opponentCard.cardId,
      playerRarity: this.playerCard.rarity,
      opponentRarity: this.opponentCard.rarity,
      playerAttack: this.playerAttack,
      opponentDefense: this.opponentDefense,
      opponentAttack: this.opponentAttack,
      playerDefense: this.playerDefense,
      playerDamage: this.damageDealt,
      opponentDamage: this.damageTaken,
      winner: this.winner,
      environment: this.environment,
      environmentBonus: this.environmentBonus
    };
  }
}

/**
 * Battle Game
 * Manages full battle between two decks
 */
export class BattleGame {
  constructor(playerDeck, opponentDeck, options = {}) {
    this.playerDeck = playerDeck.map(card => new BattleCard(card));
    this.opponentDeck = opponentDeck.map(card => new BattleCard(card));

    this.rounds = [];
    this.status = 'ongoing'; // ongoing, playerWon, opponentWon, draw
    this.environment = options.environment || 'neutral';

    this.roundsPerGame = 5;
    // Use totalPlayerCards/totalOpponentCards hints when provided (e.g. when draw pile
    // is managed externally by the controller) so maxGames reflects the full deck size.
    const totalPlayer = options.totalPlayerCards ?? this.playerDeck.length;
    const totalOpponent = options.totalOpponentCards ?? this.opponentDeck.length;
    this.maxGames = Math.min(
      8,
      Math.floor(totalPlayer / this.roundsPerGame),
      Math.floor(totalOpponent / this.roundsPerGame)
    );
    this.currentGame = 0;
    this.roundInGame = 0;
    this.playerGameWins = 0;
    this.opponentGameWins = 0;
    this.drawGames = 0;
    this.currentGameRoundScore = { player: 0, opponent: 0, draw: 0 };
  }

  /**
   * Play next round
   */
  playRound() {
    if (this.status !== 'ongoing') {
      return null;
    }

    if (!this.playerDeck.length || !this.opponentDeck.length) {
      this.endGame();
      return null;
    }

    const playerCard = this.playerDeck.shift();
    const opponentCard = this.opponentDeck.shift();

    const round = new BattleRound(
      playerCard,
      opponentCard,
      this.rounds.length + 1,
      this.environment
    );

    this.rounds.push(round);
    // Track per-game score
    if (round.winner === 'player') this.currentGameRoundScore.player += 1;
    if (round.winner === 'opponent') this.currentGameRoundScore.opponent += 1;
    if (round.winner === 'draw') this.currentGameRoundScore.draw += 1;

    this.roundInGame += 1;
    const roundNumberInGame = this.roundInGame;
    const gameNumber = this.currentGame + 1;

    if (this.roundInGame >= this.roundsPerGame || !this.playerDeck.length || !this.opponentDeck.length) {
      this.completeGame();
    }

    if (this.currentGame >= this.maxGames || !this.playerDeck.length || !this.opponentDeck.length) {
      this.endGame();
    }

    const result = round.getResults();
    result.gameNumber = gameNumber;
    result.roundInGame = roundNumberInGame;
    result.playerGameWins = this.playerGameWins;
    result.opponentGameWins = this.opponentGameWins;
    result.drawGames = this.drawGames;
    result.maxGames = this.maxGames;
    result.roundsPerGame = this.roundsPerGame;
    return result;
  }

  completeGame() {
    // Decide game winner
    if (this.currentGameRoundScore.player > this.currentGameRoundScore.opponent) {
      this.playerGameWins += 1;
    } else if (this.currentGameRoundScore.opponent > this.currentGameRoundScore.player) {
      this.opponentGameWins += 1;
    } else {
      this.drawGames += 1;
    }

    this.currentGame += 1;
    this.roundInGame = 0;
    this.currentGameRoundScore = { player: 0, opponent: 0, draw: 0 };
  }

  /**
   * Auto-play entire battle
   */
  autoBattle() {
    const results = [];
    while (this.status === 'ongoing') {
      const roundResult = this.playRound();
      if (roundResult) {
        results.push(roundResult);
      }
    }
    return results;
  }

  /**
   * Determine final winner
   */
  endGame() {
    if (this.playerGameWins > this.opponentGameWins) {
      this.status = 'playerWon';
    } else if (this.opponentGameWins > this.playerGameWins) {
      this.status = 'opponentWon';
    } else {
      this.status = 'draw';
    }
  }

  /**
   * Get battle summary
   */
  getSummary() {
    return {
      status: this.status,
      totalRounds: this.rounds.length,
      playerWins: this.rounds.filter(r => r.winner === 'player').length,
      opponentWins: this.rounds.filter(r => r.winner === 'opponent').length,
      draws: this.rounds.filter(r => r.winner === 'draw').length,
      playerGameWins: this.playerGameWins,
      opponentGameWins: this.opponentGameWins,
      drawGames: this.drawGames,
      environment: this.environment,
      history: this.rounds.map(r => r.getResults())
    };
  }

  /**
   * Calculate battle stats for leaderboard
   */
  getBattleStats() {
    const playerWinRate = this.rounds.length > 0
      ? (this.rounds.filter(r => r.winner === 'player').length / this.rounds.length) * 100
      : 0;

    const totalDamageDealt = this.rounds
      .filter(r => r.winner === 'player')
      .reduce((sum, r) => sum + r.damageDealt, 0);

    const totalDamageTaken = this.rounds
      .filter(r => r.winner === 'opponent')
      .reduce((sum, r) => sum + r.damageTaken, 0);

    return {
      winRate: Math.round(playerWinRate),
      damageDealt: totalDamageDealt,
      damageTaken: totalDamageTaken,
      cardsUsed: this.rounds.length,
      efficiency: 0
    };
  }
}

/**
 * Get sample deck for testing/tutorial
 */
export function getSampleDeck() {
  return [
    {
      cardId: 'guacamaya-roja',
      name: 'Guacamaya Roja',
      image: 'content/birds/guacamaya-roja-1.webp',
      rarity: 'abundante',
      strengths: { primaryStrength: 'S', secondaryStrength: 'C' },
      attackFactors: { P: 4, S: 7, W: 6, H: 5, A: 5 },
      defenseFactors: { AD: 6, C: 4, E: 7, SD: 5, R: 5 }
    },
    {
      cardId: 'condor-andino',
      name: 'Cóndor Andino',
      image: 'content/birds/condor-andino-1.webp',
      rarity: 'rara',
      strengths: { primaryStrength: 'H', secondaryStrength: 'AD' },
      attackFactors: { P: 7, S: 6, W: 8, H: 7, A: 6 },
      defenseFactors: { AD: 7, C: 3, E: 5, SD: 4, R: 8 }
    },
    {
      cardId: 'aguila-arpía',
      name: 'Águila Arpía',
      image: 'content/birds/aguila-harpia-1.webp',
      rarity: 'excepcional',
      strengths: { primaryStrength: 'W', secondaryStrength: 'E' },
      attackFactors: { P: 8, S: 8, W: 9, H: 8, A: 7 },
      defenseFactors: { AD: 6, C: 2, E: 6, SD: 3, R: 7 }
    }
  ];
}
