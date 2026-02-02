/**
 * BATTLE UI RENDERER
 * All DOM manipulation for Battle mode
 * Displays card comparisons, health, rounds, and battle results
 */

import { BATTLE_CONFIG, FACTOR_NAMES } from './config.js';

export class BattleUIRenderer {
  constructor() {
    this.battleContainer = null;
    this.currentCard = null;
    this.opponentCard = null;
    this.playerDeckListEl = null;
  }

  /**
   * Create and mount battle interface
   */
  mountBattle(playerDeck, opponentDeck) {
    const html = `
      <div class="battle-container">
        <div class="battle-grid">
          <aside class="deck-panel">
            <div class="deck-panel-header">
              <div>
                <h4>Organiza tu mazo</h4>
                <p>Arrastra para ordenar. Arrastra una carta al tablero para jugar.</p>
              </div>
              <div class="deck-count">${playerDeck.length} cartas</div>
            </div>
            <div class="deck-list" id="playerDeckList"></div>
          </aside>

          <div class="battle-main">
            <!-- Header -->
            <div class="battle-header">
              <div class="battle-player-info">
                <h3>Tu mazo</h3>
                <div class="deck-count">${playerDeck.length} cartas</div>
              </div>
              <div class="battle-title">⚔️ BATALLA ⚔️</div>
              <div class="battle-opponent-info">
                <h3>Oponente</h3>
                <div class="deck-count">${opponentDeck.length} cartas</div>
              </div>
            </div>

            <!-- Health Bars -->
            <div class="battle-health">
              <div class="health-bar-container">
                <div class="health-label">Salud</div>
                <div class="health-bar">
                  <div class="health-fill player-health" id="playerHealthBar"></div>
                </div>
                <div class="health-value" id="playerHealthValue">100/100</div>
              </div>

              <div class="health-separator">VS</div>

              <div class="health-bar-container">
                <div class="health-label">Salud</div>
                <div class="health-bar">
                  <div class="health-fill opponent-health" id="opponentHealthBar"></div>
                </div>
                <div class="health-value" id="opponentHealthValue">100/100</div>
              </div>
            </div>

            <!-- Card Arena -->
            <div class="battle-arena">
              <div class="card-slot player-slot droppable" id="playerCardSlot">
                <div class="empty-slot">Arrastra aquí tu carta para esta ronda</div>
              </div>

              <div class="battle-vs">
                <span>VS</span>
                <span id="roundNumber">Ronda 1</span>
              </div>

              <div class="card-slot opponent-slot" id="opponentCardSlot">
                <div class="empty-slot">Carta del oponente</div>
              </div>
            </div>

            <!-- Battle Controls -->
            <div class="battle-controls">
              <button id="playRoundBtn" class="btn-primary">⚔️ Siguiente Ronda</button>
              <button id="autoBattleBtn" class="btn-secondary">⏭️ Auto-Batalla</button>
            </div>

            <!-- Round Result -->
            <div class="round-result" id="roundResult" style="display:none;">
              <div class="result-content">
                <div class="result-message" id="resultMessage"></div>
                <div class="damage-display">
                  <span id="damageDealt" class="damage-dealt">+0</span>
                  <span>|</span>
                  <span id="damageTaken" class="damage-taken">-0</span>
                </div>
              </div>
            </div>

            <!-- Stats Panel -->
            <div class="battle-stats" id="battleStats">
              <div class="stat-item">
                <span class="stat-label">Rondas:</span>
                <span class="stat-value" id="roundsPlayed">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Victorias:</span>
                <span class="stat-value" id="playerWins">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Empates:</span>
                <span class="stat-value" id="draws">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.battleContainer = document.createElement('div');
    this.battleContainer.innerHTML = html;
    this.playerDeckListEl = this.battleContainer.querySelector('#playerDeckList');
    return this.battleContainer;
  }

  /**
   * Render player deck list for drag & drop ordering
   */
  renderDeckList(deck, currentRoundIndex = 0) {
    if (!this.playerDeckListEl) return;

    this.playerDeckListEl.innerHTML = deck
      .map((card, index) => {
        const used = index < currentRoundIndex;
        const isCurrent = index === currentRoundIndex;
        return `
          <div class="deck-card ${used ? 'used' : ''} ${isCurrent ? 'current' : ''}" data-index="${index}" draggable="${!used}">
            <div class="deck-card-thumb" style="background-image: url('${card.image}');"></div>
            <div class="deck-card-info">
              <div class="deck-card-name">${card.name}</div>
              <div class="deck-card-meta">
                <span class="rarity-pill ${card.rarity}">${card.rarity}</span>
                <span class="power-pill">ATQ ${card.calculateAttack()} · DEF ${card.calculateDefense()}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Display card in arena
   */
  displayCard(card, slot) {
    const slotElement = document.getElementById(slot);
    if (!slotElement) return;

    const html = `
      <div class="battle-card">
        <div class="card-image">
          <img src="${card.image}" alt="${card.name}">
          <span class="rarity-badge ${card.rarity}">${card.rarity}</span>
        </div>
        <div class="card-info">
          <h4>${card.name}</h4>
          <div class="card-stats">
            <div class="attack-stat">
              ATQ: <strong>${card.calculateAttack()}</strong>
            </div>
            <div class="defense-stat">
              DEF: <strong>${card.calculateDefense()}</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    slotElement.innerHTML = html;
  }

  /**
   * Reset player slot to empty droppable state
   */
  resetPlayerSlot() {
    const slotElement = document.getElementById('playerCardSlot');
    if (!slotElement) return;
    slotElement.innerHTML = '<div class="empty-slot">Arrastra aquí tu carta para esta ronda</div>';
  }

  /**
   * Display factors breakdown for a card
   */
  displayCardFactors(card, position = 'player') {
    const factorContainer = document.createElement('div');
    factorContainer.className = `card-factors ${position}`;

    const attackFactors = Object.entries(card.attackFactors)
      .map(([key, val]) => `<span class="factor attack">${key}: ${val}</span>`)
      .join('');

    const defenseFactors = Object.entries(card.defenseFactors)
      .map(([key, val]) => `<span class="factor defense">${key}: ${val}</span>`)
      .join('');

    factorContainer.innerHTML = `
      <div class="factors-group">
        <h5>Ataque</h5>
        ${attackFactors}
      </div>
      <div class="factors-group">
        <h5>Defensa</h5>
        ${defenseFactors}
      </div>
    `;

    return factorContainer;
  }

  /**
   * Update health bars
   */
  updateHealth(playerHealth, opponentHealth, maxHealth) {
    const playerPercent = (playerHealth / maxHealth) * 100;
    const opponentPercent = (opponentHealth / maxHealth) * 100;

    const playerBar = document.getElementById('playerHealthBar');
    const opponentBar = document.getElementById('opponentHealthBar');

    if (playerBar) {
      playerBar.style.width = `${playerPercent}%`;
      playerBar.classList.toggle('low-health', playerHealth <= maxHealth * 0.25);
    }

    if (opponentBar) {
      opponentBar.style.width = `${opponentPercent}%`;
      opponentBar.classList.toggle('low-health', opponentHealth <= maxHealth * 0.25);
    }

    // Update health values
    const playerValue = document.getElementById('playerHealthValue');
    const opponentValue = document.getElementById('opponentHealthValue');

    if (playerValue) playerValue.textContent = `${Math.max(0, playerHealth)}/${maxHealth}`;
    if (opponentValue) opponentValue.textContent = `${Math.max(0, opponentHealth)}/${maxHealth}`;
  }

  /**
   * Show round result
   */
  displayRoundResult(roundData) {
    const resultDiv = document.getElementById('roundResult');
    const messageDiv = document.getElementById('resultMessage');
    const damageDealtDiv = document.getElementById('damageDealt');
    const damageTakenDiv = document.getElementById('damageTaken');

    if (!resultDiv) return;

    let message = '';
    let damageClass = '';

    if (roundData.winner === 'player') {
      message = `✅ ¡Victoria en ronda ${roundData.round}!`;
      damageClass = 'victory';
    } else if (roundData.winner === 'opponent') {
      message = `❌ Derrota en ronda ${roundData.round}`;
      damageClass = 'defeat';
    } else {
      message = `⚔️ Empate en ronda ${roundData.round}`;
      damageClass = 'draw';
    }

    messageDiv.textContent = message;
    messageDiv.className = `result-message ${damageClass}`;

    damageDealtDiv.textContent = `+${roundData.playerDamage}`;
    damageTakenDiv.textContent = `-${roundData.opponentDamage}`;

    resultDiv.style.display = 'block';

    // Hide after 2 seconds
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 2000);
  }

  /**
   * Update round counter and stats
   */
  updateStats(totalRounds, playerWins, draws) {
    const roundsEl = document.getElementById('roundsPlayed');
    const winsEl = document.getElementById('playerWins');
    const drawsEl = document.getElementById('draws');

    if (roundsEl) roundsEl.textContent = totalRounds;
    if (winsEl) winsEl.textContent = playerWins;
    if (drawsEl) drawsEl.textContent = draws;
  }

  /**
   * Update round number display
   */
  updateRoundNumber(roundNumber, totalRounds) {
    const roundEl = document.getElementById('roundNumber');
    if (roundEl) {
      roundEl.textContent = `Ronda ${roundNumber}/${totalRounds}`;
    }
  }

  /**
   * Show battle end screen
   */
  showBattleEnd(summary) {
    const resultDiv = document.getElementById('roundResult');
    const messageDiv = document.getElementById('resultMessage');

    if (!resultDiv) return;

    let endMessage = '';
    if (summary.status === 'playerWon') {
      endMessage = '🎉 ¡BATALLA GANADA! 🎉';
    } else if (summary.status === 'opponentWon') {
      endMessage = '💔 Batalla Perdida 💔';
    } else {
      endMessage = '⚔️ Batalla Empatada ⚔️';
    }

    messageDiv.innerHTML = `
      ${endMessage}
      <div class="battle-summary">
        <p>Rondas: ${summary.totalRounds}</p>
        <p>Victorias: ${summary.playerWins}</p>
        <p>Empates: ${summary.draws}</p>
      </div>
    `;

    resultDiv.style.display = 'block';
  }

  /**
   * Enable/disable battle buttons
   */
  setButtonsEnabled(enabled) {
    const playRoundBtn = document.getElementById('playRoundBtn');
    const autoBattleBtn = document.getElementById('autoBattleBtn');

    if (playRoundBtn) playRoundBtn.disabled = !enabled;
    if (autoBattleBtn) autoBattleBtn.disabled = !enabled;
  }

  /**
   * Show loading state
   */
  setLoading(isLoading) {
    const btn = document.getElementById('playRoundBtn');
    if (btn) {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? '⏳ Cargando...' : '⚔️ Siguiente Ronda';
    }
  }
}

/**
 * Comparison View (detailed A/D breakdown)
 */
export class ComparisonView {
  constructor() {
    this.container = null;
  }

  /**
   * Create detailed comparison table
   */
  createComparisonHTML(playerCard, opponentCard, roundData) {
    return `
      <div class="comparison-container">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>${playerCard.name}</th>
              <th>Factor</th>
              <th>${opponentCard.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="player">${roundData.playerAttack}</td>
              <td class="label">⚔️ ATAQUE</td>
              <td class="opponent">${roundData.opponentAttack}</td>
            </tr>
            <tr>
              <td class="player">${roundData.playerDefense}</td>
              <td class="label">🛡️ DEFENSA</td>
              <td class="opponent">${roundData.opponentDefense}</td>
            </tr>
            <tr class="damage-row">
              <td class="player damage-dealt">${roundData.playerDamage}</td>
              <td class="label">💥 DAÑO</td>
              <td class="opponent damage-taken">${roundData.opponentDamage}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Create factor breakdown table
   */
  createFactorsHTML(playerCard, opponentCard) {
    const attackFactors = ['P', 'S', 'W', 'H', 'A'];
    const defenseFactors = ['AD', 'C', 'E', 'SD', 'R'];

    let html = '<div class="factors-comparison">';

    // Attack factors
    html += '<div class="factors-section"><h4>Factores de Ataque</h4><table>';
    attackFactors.forEach(factor => {
      const pVal = playerCard.attackFactors[factor] || 0;
      const oVal = opponentCard.attackFactors[factor] || 0;
      html += `
        <tr>
          <td class="player">${pVal}</td>
          <td class="label">${FACTOR_NAMES[factor]}</td>
          <td class="opponent">${oVal}</td>
        </tr>
      `;
    });
    html += '</table></div>';

    // Defense factors
    html += '<div class="factors-section"><h4>Factores de Defensa</h4><table>';
    defenseFactors.forEach(factor => {
      const pVal = playerCard.defenseFactors[factor] || 0;
      const oVal = opponentCard.defenseFactors[factor] || 0;
      html += `
        <tr>
          <td class="player">${pVal}</td>
          <td class="label">${FACTOR_NAMES[factor]}</td>
          <td class="opponent">${oVal}</td>
        </tr>
      `;
    });
    html += '</table></div>';

    html += '</div>';
    return html;
  }
}
