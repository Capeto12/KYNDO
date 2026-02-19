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
   * Scoped querySelector helper - prefers battleContainer, falls back to document
   * @param {string} id - Element ID (without #)
   * @returns {Element|null}
   */
  _qs(id) {
    return this.battleContainer
      ? this.battleContainer.querySelector('#' + id)
      : document.getElementById(id);
  }

  /**
   * Create and mount battle interface
   */
  mountBattle() {
    const html = `
      <div class="battle-container">
        <div class="battle-grid-8">
          <div class="cont cont1">
            <div class="compact-row"><span>Energia:</span><span id="energyValue">0%</span></div>
            <div class="energy-bar"><div id="energyFill" class="energy-fill"></div></div>
            <div class="compact-row" style="margin-top:4px;">
              <span>Factor:</span>
              <select id="charSelect" class="select-char" title="Factor a destacar">
                <option value="">— Ver factor —</option>
                <option value="P">Predación (P)</option>
                <option value="S">Velocidad (S)</option>
                <option value="W">Anatomía (W)</option>
                <option value="H">Estrategia (H)</option>
                <option value="A">Agresividad (A)</option>
                <option value="AD">Adaptabilidad (AD)</option>
                <option value="C">Camuflaje (C)</option>
                <option value="E">Evasión (E)</option>
                <option value="SD">Def. Social (SD)</option>
                <option value="R">Robustez (R)</option>
              </select>
            </div>
            <button id="readyBtn" class="btn-primary btn-ready" disabled>READY</button>
          </div>

          <div class="cont cont2" id="cont2">
            <div class="vs-row">
              <span id="playerLabel">Usuario 1</span>
              <span class="badge" id="attackerBadge">DEF</span>
              <span id="opponentLabel">Usuario 2</span>
            </div>
            <div class="battle-actions-inline">
              <button id="battleBtn" class="btn-secondary battle-btn" disabled>Battle</button>
              <button id="autoBattleBtn" class="btn-ghost auto-btn" disabled>Auto</button>
            </div>
          </div>

          <div class="cont cont3" id="cont3">
            <div id="opponentReveal" class="opp-reveal">
              <h5>Defensa oculta</h5>
              <div class="meta">Se muestra al iniciar la ronda</div>
            </div>
          </div>

          <div class="cont cont4">
            <div class="staging-list" id="playerStagingList"></div>
          </div>

          <div class="cont cont5">
            <div class="prep-drop" id="playerPrepList"></div>
          </div>

          <div class="cont cont6">
            <div class="game-meta">
              <div class="game-counter" id="roundNumber">Game 1/8 · Ronda 1/5</div>
              <div class="game-score">Games: <span id="playerGameWins">0</span>-<span id="opponentGameWins">0</span>-<span id="drawGameWins">0</span></div>
            </div>
            <div class="winner-slot" id="winnerSlot"></div>
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

          <div class="cont cont7" id="cont7">
            <div class="slot-title">Cont7 · Prep enemigo</div>
            <div class="opponent-prep-list" id="opponentPrepList"></div>
          </div>

          <div class="cont cont8" id="cont8"></div>
        </div>
      </div>
    `;

    this.battleContainer = document.createElement('div');
    this.battleContainer.innerHTML = html;
    this.playerDeckListEl = this.battleContainer.querySelector('#playerStagingList');
    return this.battleContainer;
  }

  /**
   * Render player deck list for drag & drop ordering
   */
  renderDeckList(deck, currentRoundIndex = 0) {
    if (!this.playerDeckListEl) return;

    this.playerDeckListEl.innerHTML = deck
      .map((card, index) => {
        const imgHtml = card.image
          ? `<img src="${card.image}" alt="${card.name}" class="card-thumb">`
          : '<span class="card-thumb-placeholder">🃏</span>';
        return `
          <div class="staging-card" data-index="${index}" draggable="true">
            ${imgHtml}
            <div class="card-thumb-info">
              <div><strong>${card.name}</strong></div>
              <div>ATQ ${card.calculateAttack()} · DEF ${card.calculateDefense()}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderPrepList(prepDeck) {
    const prepEl = this.battleContainer.querySelector('#playerPrepList');
    if (!prepEl) return;
    prepEl.innerHTML = prepDeck
      .map((card, index) => {
        const imgHtml = card.image
          ? `<img src="${card.image}" alt="${card.name}" class="card-thumb">`
          : '<span class="card-thumb-placeholder">🃏</span>';
        return `
          <div class="prep-card" data-index="${index}" draggable="true">
            ${imgHtml}
            <div class="card-thumb-info">
              <div><strong>${card.name}</strong></div>
              <div>ATQ ${card.calculateAttack()} · DEF ${card.calculateDefense()}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderOpponentPrep(prepDeck) {
    const oppEl = this.battleContainer.querySelector('#opponentPrepList');
    if (!oppEl) return;
    oppEl.innerHTML = prepDeck
      .map(() => '<div class="back-card"></div>')
      .join('');
  }

  revealOpponentCard(card) {
    const oppReveal = this._qs('opponentReveal');
    if (!oppReveal || !card) return;
    oppReveal.innerHTML = `
      <h5>${card.name}</h5>
      <div class="meta">⚔️ ${card.calculateAttack()} · 🛡️ ${card.calculateDefense()}</div>
      <div style="margin-top:6px; display:flex; gap:6px; align-items:center;">
        <img src="${card.image}" alt="${card.name}" style="width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.15);">
        <span class="badge">${card.rarity || ''}</span>
      </div>
    `;
  }

  /**
   * Display card in arena
   */
  displayCard(card, slot) {
    const slotElement = this._qs(slot) || document.getElementById(slot);
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
    const slotElement = this._qs('playerCardSlot');
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

    const playerBar = this._qs('playerHealthBar');
    const opponentBar = this._qs('opponentHealthBar');

    if (playerBar) {
      playerBar.style.width = `${playerPercent}%`;
      playerBar.classList.toggle('low-health', playerHealth <= maxHealth * 0.25);
    }

    if (opponentBar) {
      opponentBar.style.width = `${opponentPercent}%`;
      opponentBar.classList.toggle('low-health', opponentHealth <= maxHealth * 0.25);
    }

    const playerValue = this._qs('playerHealthValue');
    const opponentValue = this._qs('opponentHealthValue');

    if (playerValue) playerValue.textContent = `${Math.max(0, playerHealth)}/${maxHealth}`;
    if (opponentValue) opponentValue.textContent = `${Math.max(0, opponentHealth)}/${maxHealth}`;
  }

  /**
   * Show round result
   */
  displayRoundResult(roundData) {
    const resultDiv = this._qs('roundResult');
    const messageDiv = this._qs('resultMessage');
    const damageDealtDiv = this._qs('damageDealt');
    const damageTakenDiv = this._qs('damageTaken');
    const winnerSlot = this._qs('winnerSlot');
    const oppReveal = this._qs('opponentReveal');

    if (!resultDiv) return;

    let message = '';
    let damageClass = '';

    if (roundData.winner === 'player') {
      message = `✅ ¡Ronda ${roundData.roundInGame}/${roundData.roundsPerGame} · Game ${roundData.gameNumber} ganada!`;
      damageClass = 'victory';
    } else if (roundData.winner === 'opponent') {
      message = `❌ Ronda ${roundData.roundInGame}/${roundData.roundsPerGame} · Game ${roundData.gameNumber} perdida`;
      damageClass = 'defeat';
    } else {
      message = `⚔️ Ronda ${roundData.roundInGame}/${roundData.roundsPerGame} · Game ${roundData.gameNumber} empatada`;
      damageClass = 'draw';
    }

    messageDiv.textContent = message;
    messageDiv.className = `result-message ${damageClass}`;

    damageDealtDiv.textContent = `+${roundData.playerDamage}`;
    damageTakenDiv.textContent = `-${roundData.opponentDamage}`;

    if (winnerSlot) {
      const playerWinner = roundData.winner === 'player';
      const oppWinner = roundData.winner === 'opponent';
      winnerSlot.innerHTML = `
        <div class="arena-duel">
          <div class="arena-card ${playerWinner ? 'arena-winner' : oppWinner ? 'arena-loser' : ''}">
            <img src="${roundData.playerCardImage}" alt="${roundData.playerCard}">
            <div class="card-info">
              <h4>${roundData.playerCard}</h4>
              <div class="card-stats">
                <div class="attack-stat">⚔️ ${roundData.playerAttack}</div>
                <div class="defense-stat">🛡️ ${roundData.playerDefense}</div>
              </div>
              ${playerWinner ? '<div class="result-badge">WIN</div>' : oppWinner ? '<div class="result-badge result-badge--loss">LOSS</div>' : '<div class="result-badge result-badge--draw">DRAW</div>'}
            </div>
          </div>
          <div class="arena-vs-badge">${roundData.winner === 'draw' ? '🤝' : '⚡'}</div>
          <div class="arena-card ${oppWinner ? 'arena-winner' : playerWinner ? 'arena-loser' : ''}">
            <img src="${roundData.opponentCardImage}" alt="${roundData.opponentCard}">
            <div class="card-info">
              <h4>${roundData.opponentCard}</h4>
              <div class="card-stats">
                <div class="attack-stat">⚔️ ${roundData.opponentAttack}</div>
                <div class="defense-stat">🛡️ ${roundData.opponentDefense}</div>
              </div>
              ${oppWinner ? '<div class="result-badge">WIN</div>' : playerWinner ? '<div class="result-badge result-badge--loss">LOSS</div>' : '<div class="result-badge result-badge--draw">DRAW</div>'}
            </div>
          </div>
        </div>`;
    }

    if (oppReveal) {
      oppReveal.innerHTML = `
        <h5>${roundData.opponentCard}</h5>
        <div class="meta">⚔️ ${roundData.opponentAttack} · 🛡️ ${roundData.opponentDefense}</div>
        <div style="margin-top:6px; display:flex; gap:6px; align-items:center;">
          <img src="${roundData.opponentCardImage}" alt="${roundData.opponentCard}" style="width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.15);">
          <span class="badge">${roundData.opponentRarity || ''}</span>
        </div>
      `;
    }

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
    const roundsEl = this._qs('roundsPlayed');
    const winsEl = this._qs('playerWins');
    const drawsEl = this._qs('draws');

    if (roundsEl) roundsEl.textContent = totalRounds;
    if (winsEl) winsEl.textContent = playerWins;
    if (drawsEl) drawsEl.textContent = draws;
  }

  /**
   * Update round number display
   */
  updateRoundNumber(gameNumber, totalGames, roundInGame, roundsPerGame, playerGameWins, opponentGameWins, drawGames) {
    const roundEl = this._qs('roundNumber');
    if (roundEl) {
      roundEl.textContent = `Game ${gameNumber}/${totalGames} · Ronda ${roundInGame}/${roundsPerGame}`;
    }

    const pGames = this._qs('playerGameWins');
    const oGames = this._qs('opponentGameWins');
    const dGames = this._qs('drawGameWins');
    if (pGames) pGames.textContent = playerGameWins;
    if (oGames) oGames.textContent = opponentGameWins;
    if (dGames) dGames.textContent = drawGames;

    // Header HUD (si existe, buscar en document ya que está fuera del battle container)
    const hudGame = document.getElementById('battle-hud-game');
    const hudGamesTotal = document.getElementById('battle-hud-gamesTotal');
    const hudRound = document.getElementById('battle-hud-round');
    const hudRoundsPerGame = document.getElementById('battle-hud-roundsPerGame');
    const hudScore = document.getElementById('battle-hud-score');

    if (hudGame) hudGame.textContent = gameNumber;
    if (hudGamesTotal) hudGamesTotal.textContent = totalGames;
    if (hudRound) hudRound.textContent = roundInGame;
    if (hudRoundsPerGame) hudRoundsPerGame.textContent = roundsPerGame;
    if (hudScore) hudScore.textContent = `${playerGameWins}-${opponentGameWins}-${drawGames}`;
  }

  /**
   * Show battle end screen
   */
  showBattleEnd(summary) {
    const resultDiv = this._qs('roundResult');
    const messageDiv = this._qs('resultMessage');

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
        <p>Games: ${summary.playerGameWins}-${summary.opponentGameWins}-${summary.drawGames}</p>
      </div>
    `;

    resultDiv.style.display = 'block';
  }

  /**
   * Enable/disable battle buttons
   */
  setButtonsEnabled(enabled) {
    const autoBattleBtn = this._qs('autoBattleBtn');
    if (autoBattleBtn) autoBattleBtn.disabled = !enabled;
  }

  /**
   * Show loading state
   */
  setLoading(isLoading) {
    const battleBtn = this._qs('battleBtn');
    const autoBattleBtn = this._qs('autoBattleBtn');
    if (battleBtn) {
      if (!battleBtn.dataset.defaultLabel) {
        battleBtn.dataset.defaultLabel = battleBtn.textContent || 'Ronda';
      }
      battleBtn.disabled = isLoading;
      battleBtn.textContent = isLoading ? '⏳ Ronda...' : battleBtn.dataset.defaultLabel;
    }
    if (autoBattleBtn && isLoading) {
      autoBattleBtn.disabled = true;
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
