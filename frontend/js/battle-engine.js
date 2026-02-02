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
  calculateAttack(environmentBonus = 0) {
    const weights = BATTLE_CONFIG.ATTACK_WEIGHTS;
    
    let totalAttack = 0;
    totalAttack += this.attackFactors.P * weights.P;
    totalAttack += this.attackFactors.S * weights.S;
    totalAttack += this.attackFactors.W * weights.W;
    totalAttack += this.attackFactors.H * weights.H;
    totalAttack += this.attackFactors.A * weights.A;

    // Normalize to 0-99 scale
    let normalizedAttack = Math.round((totalAttack / 50) * 99); // Assuming max sum ~50
    normalizedAttack = Math.min(99, Math.max(0, normalizedAttack));

    // Apply environment bonus
    const bonusAmount = Math.round((normalizedAttack * environmentBonus) / 100);
    return normalizedAttack + bonusAmount;
  }

  /**
   * Calculate total defense score (0-99)
   */
  calculateDefense(environmentBonus = 0) {
    const weights = BATTLE_CONFIG.DEFENSE_WEIGHTS;
    
    let totalDefense = 0;
    totalDefense += this.defenseFactors.AD * weights.AD;
    totalDefense += this.defenseFactors.C * weights.C;
    totalDefense += this.defenseFactors.E * weights.E;
    totalDefense += this.defenseFactors.SD * weights.SD;
    totalDefense += this.defenseFactors.R * weights.R;

    // Normalize to 0-99 scale
    let normalizedDefense = Math.round((totalDefense / 50) * 99);
    normalizedDefense = Math.min(99, Math.max(0, normalizedDefense));

    // Apply environment bonus
    const bonusAmount = Math.round((normalizedDefense * environmentBonus) / 100);
    return normalizedDefense + bonusAmount;
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
    this.environmentBonus = BATTLE_CONFIG.ENVIRONMENT_BONUSES[environment] || 0;

    // Battle mode: compare attack vs defense
    this.playerAttack = playerCard.calculateAttack(0);
    this.opponentDefense = opponentCard.calculateDefense(this.environmentBonus);

    this.opponentAttack = opponentCard.calculateAttack(0);
    this.playerDefense = playerCard.calculateDefense(this.environmentBonus);

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

    this.playerHealth = options.playerHealth || BATTLE_CONFIG.STARTING_HEALTH;
    this.opponentHealth = options.opponentHealth || BATTLE_CONFIG.STARTING_HEALTH;
    this.maxHealth = this.playerHealth;

    this.rounds = [];
    this.currentRoundIndex = 0;
    this.status = 'ongoing'; // ongoing, playerWon, opponentWon, draw
    this.environment = options.environment || 'neutral';
  }

  /**
   * Play next round
   */
  playRound() {
    if (this.status !== 'ongoing') {
      return null;
    }

    const playerCard = this.playerDeck[this.currentRoundIndex];
    const opponentCard = this.opponentDeck[this.currentRoundIndex];

    if (!playerCard || !opponentCard) {
      this.endGame();
      return null;
    }

    const round = new BattleRound(
      playerCard,
      opponentCard,
      this.currentRoundIndex + 1,
      this.environment
    );

    this.rounds.push(round);

    // Apply damage
    if (round.winner === 'player') {
      this.opponentHealth -= round.damageDealt;
    } else if (round.winner === 'opponent') {
      this.playerHealth -= round.damageDealt;
    }

    // Check for early termination
    if (this.playerHealth <= 0 || this.opponentHealth <= 0) {
      this.endGame();
    } else {
      this.currentRoundIndex++;
    }

    return round.getResults();
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
    if (this.playerHealth > this.opponentHealth) {
      this.status = 'playerWon';
    } else if (this.opponentHealth > this.playerHealth) {
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
      playerHealth: Math.max(0, this.playerHealth),
      opponentHealth: Math.max(0, this.opponentHealth),
      totalRounds: this.rounds.length,
      playerWins: this.rounds.filter(r => r.winner === 'player').length,
      opponentWins: this.rounds.filter(r => r.winner === 'opponent').length,
      draws: this.rounds.filter(r => r.winner === 'draw').length,
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
      cardsUsed: this.currentRoundIndex,
      efficiency: this.maxHealth > 0 
        ? Math.round((this.playerHealth / this.maxHealth) * 100)
        : 0
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
      attackFactors: { P: 4, S: 7, W: 6, H: 5, A: 5 },
      defenseFactors: { AD: 6, C: 4, E: 7, SD: 5, R: 5 }
    },
    {
      cardId: 'condor-andino',
      name: 'Cóndor Andino',
      image: 'content/birds/condor-andino-1.webp',
      rarity: 'rara',
      attackFactors: { P: 7, S: 6, W: 8, H: 7, A: 6 },
      defenseFactors: { AD: 7, C: 3, E: 5, SD: 4, R: 8 }
    },
    {
      cardId: 'aguila-arpía',
      name: 'Águila Arpía',
      image: 'content/birds/aguila-harpia-1.webp',
      rarity: 'excepcional',
      attackFactors: { P: 8, S: 8, W: 9, H: 8, A: 7 },
      defenseFactors: { AD: 6, C: 2, E: 6, SD: 3, R: 7 }
    }
  ];
}
