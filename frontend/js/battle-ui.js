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
  mountBattle() {
    const html = `
      <style>
        .battle-grid-8 {
          display: grid;
          grid-template-columns: 40px 50px 160px 50px;
          grid-template-rows: 50px auto;
          gap: 10px;
          align-items: stretch;
        }
        .cont { background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); position: relative; overflow: hidden; }
        .cont h4 { margin: 0 0 4px 0; font-size: 12px; letter-spacing: .3px; }
        .cont p { margin: 0; font-size: 11px; opacity: .8; }
        .cont1 { grid-column: 1 / 3; grid-row: 1; min-width: 90px; }
        .cont2 { grid-column: 3 / 4; grid-row: 1; min-width: 160px; }
        .cont3 { grid-column: 4 / 5; grid-row: 1; min-width: 50px; }
        .cont4 { grid-column: 1 / 2; grid-row: 2; min-height: 240px; cursor: pointer; }
        .cont4.expanded { position: absolute; width: 260px; max-width: 260px; min-width: 260px; min-height: 320px; z-index: 20; }
        .cont5 { grid-column: 2 / 3; grid-row: 2; min-height: 240px; }
        .cont6 { grid-column: 3 / 4; grid-row: 2; min-height: 260px; }
        .cont7 { grid-column: 4 / 5; grid-row: 2; min-height: 240px; }
        .cont8 { display: none; }
        .card-slot { min-height: 120px; border: 1px dashed rgba(226,232,240,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 8px; background: rgba(15,23,42,0.6); }
        .slot-title { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; opacity: .7; margin-bottom: 4px; }
        .energy-bar { background: rgba(255,255,255,0.08); height: 10px; border-radius: 8px; overflow: hidden; margin: 4px 0; }
        .energy-fill { background: linear-gradient(90deg,#22d3ee,#a855f7); height: 100%; width: 0%; transition: width 0.25s ease; }
        .compact-row { display: flex; align-items: center; gap: 6px; font-size: 11px; }
        .select-char { width: 100%; font-size: 11px; padding: 2px 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #e2e8f0; }
        .btn-ready { width: 100%; margin-top: 4px; }
        .vs-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
        .badge { padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,0.08); font-size: 11px; }
        .badge.attacker { background: #10b981; color: #022c22; font-weight: 700; }
        .battle-btn { width: 100%; margin-top: 6px; }
        .staging-list, .prep-list, .opponent-prep-list { display: flex; flex-direction: column; gap: 6px; overflow: auto; max-height: 210px; }
        .staging-card, .prep-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 4px; font-size: 11px; cursor: grab; }
        .prep-drop { min-height: 160px; border: 1px dashed rgba(255,255,255,0.3); border-radius: 8px; padding: 6px; }
        .back-card { height: 32px; border-radius: 6px; background: linear-gradient(135deg,#1f2937,#111827); border: 1px solid rgba(255,255,255,0.12); }
        .health-bar-compact { display:flex; gap:10px; align-items:center; font-size: 11px; }
        .health-bar { background: rgba(255,255,255,0.08); height: 12px; border-radius: 8px; overflow: hidden; flex:1; }
        .health-fill { height:100%; transition: width 0.3s ease; }
        .player-health { background: linear-gradient(90deg,#10b981,#22c55e); }
        .opponent-health { background: linear-gradient(90deg,#f43f5e,#ef4444); }
        .arena-actions { display:flex; gap:8px; margin-top:8px; }
        .round-result { margin-top: 8px; }
      </style>
      <div class="battle-container">
        <div class="battle-grid-8">
          <div class="cont cont1">
            <h4>Cont1 · Energía</h4>
            <div class="compact-row"><span>Energia:</span><span id="energyValue">0%</span></div>
            <div class="energy-bar"><div id="energyFill" class="energy-fill"></div></div>
            <div class="compact-row" style="margin-top:4px;">
              <span>Carac.</span>
              <select id="charSelect" class="select-char">
                <option value="P">P</option>
                <option value="S">S</option>
                <option value="W">W</option>
                <option value="H">H</option>
                <option value="A">A</option>
                <option value="AD">AD</option>
                <option value="C">C</option>
                <option value="E">E</option>
                <option value="SD">SD</option>
                <option value="R">R</option>
              </select>
            </div>
            <button id="readyBtn" class="btn-primary btn-ready" disabled>READY</button>
          </div>

          <div class="cont cont2" id="cont2">
            <h4>Cont2 · Turno</h4>
            <div class="vs-row">
              <span id="playerLabel">Usuario 1</span>
              <span class="badge" id="attackerBadge">DEF</span>
              <span id="opponentLabel">Usuario 2</span>
            </div>
            <button id="battleBtn" class="btn-secondary battle-btn" disabled>Battle</button>
          </div>

          <div class="cont cont3" id="cont3">
            <h4>Cont3</h4>
            <p style="font-size:10px;">Defensa oculta</p>
          </div>

          <div class="cont cont4">
            <div class="slot-title">Cont4 · Mazo (40)</div>
            <div class="staging-list" id="playerStagingList"></div>
          </div>

          <div class="cont cont5">
            <div class="slot-title">Cont5 · Prepista (5)</div>
            <div class="prep-drop" id="playerPrepList"></div>
          </div>

          <div class="cont cont6">
            <div class="slot-title">Cont6 · Arena</div>
            <div class="health-bar-compact">
              <span>Salud A</span>
              <div class="health-bar"><div class="health-fill player-health" id="playerHealthBar"></div></div>
              <span id="playerHealthValue">100/100</span>
            </div>
            <div class="health-bar-compact" style="margin-top:6px;">
              <span>Salud B</span>
              <div class="health-bar"><div class="health-fill opponent-health" id="opponentHealthBar"></div></div>
              <span id="opponentHealthValue">100/100</span>
            </div>
            <div class="battle-vs" style="margin:8px 0; text-align:center;">
              <span>VS</span> · <span id="roundNumber">Ronda 1</span>
            </div>
            <div class="card-slot player-slot" id="playerCardSlot"><div class="empty-slot">Carta A</div></div>
            <div class="card-slot opponent-slot" id="opponentCardSlot" style="margin-top:6px;"><div class="empty-slot">Carta B</div></div>
            <div class="arena-actions">
              <button id="playRoundBtn" class="btn-primary" disabled>⚔️ Ronda</button>
              <button id="autoBattleBtn" class="btn-secondary" disabled>⏭️ Auto</button>
            </div>
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
        return `
          <div class="staging-card" data-index="${index}" draggable="true">
            <div><strong>${card.name}</strong></div>
            <div>ATQ ${card.calculateAttack()} · DEF ${card.calculateDefense()}</div>
          </div>
        `;
      })
      .join('');
  }

  renderPrepList(prepDeck) {
    const prepEl = this.battleContainer.querySelector('#playerPrepList');
    if (!prepEl) return;
    prepEl.innerHTML = prepDeck
      .map((card, index) => `
        <div class="prep-card" data-index="${index}" draggable="true">
          <div><strong>${card.name}</strong></div>
          <div>ATQ ${card.calculateAttack()} · DEF ${card.calculateDefense()}</div>
        </div>
      `)
      .join('');
  }

  renderOpponentPrep(prepDeck) {
    const oppEl = this.battleContainer.querySelector('#opponentPrepList');
    if (!oppEl) return;
    oppEl.innerHTML = prepDeck
      .map(() => '<div class="back-card"></div>')
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
