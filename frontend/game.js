/**
 * KYNDO - Memory Game
 * Motor del juego cognitivo de memoria con sistema de progresión
 */

// =========================
// CONFIGURACIÓN Y CONSTANTES
// =========================

// Parámetros de balance del juego
const CONFIG = {
  STREAK_BASE_BONUS: 5,           // Bono base por racha consecutiva
  REPEAT_MISS_EXTRA_ATTEMPTS: 1,  // Intentos extra al fallar un par repetido
  REPEAT_MISS_POINT_PENALTY: 2,   // Penalización de puntos por repetir error
  ATTEMPT_FACTOR: 2.2,             // Factor para calcular intentos máximos
  FOCUS_CLOSE_DELAY: 350,          // Delay antes de mostrar resultado final (ms)
  CARD_TRANSITION_TIME: 120        // Tiempo de animación de cartas (ms)
};

// Configuración de grados (pares de cartas por nivel)
const GRADE_CONFIG = {
  1: 20,  // 10 pares
  2: 30,  // 15 pares
  3: 42,  // 21 pares
  4: 56,  // 28 pares
  5: 72   // 36 pares
};

// Clave para almacenamiento local
const STORAGE_KEY = 'kyndo_memory_v1';

// Ruta del contenido (ajustable según estructura del proyecto)
// Estructura esperada: frontend/index.html y content/content/birds/pack-1.json
// Ruta del contenido (API del Backend)
const CONTENT_PATH = 'http://localhost:4001/api/search?q=a&limit=100';

// =========================
// CARGA DE CONTENIDO
// =========================

/**
 * Gestor de contenido del juego
 */
class ContentManager {
  constructor() {
    this.birds = [];
    this.loaded = false;
  }

  /**
   * Carga el contenido de aves desde el JSON
   */
  async loadContent() {
    try {
      const response = await fetch(CONTENT_PATH);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Procesar datos de la API (vienen en data.results)
      this.birds = data.results.map(bird => {
        let imageUrl = bird.imageUrl || bird.thumbnailPath;

        // Convertir ruta relativa a URL completa del backend
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `http://localhost:4001/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
        }

        return {
          id: bird.id,
          title: bird.title,
          imageUrl: imageUrl
        };
      });

      this.loaded = true;
      console.log(`✓ Contenido cargado: ${this.birds.length} aves`);
      return true;
    } catch (error) {
      console.warn('⚠ No se pudo cargar el contenido de aves, usando fallback:', error);
      this.loaded = false;

      // Notificar al usuario (podría mejorarse con UI toast)
      if (typeof window !== 'undefined' && window.console) {
        console.info('ℹ️ El juego funcionará con contenido de prueba');
      }

      return false;
    }
  }

  /**
   * Obtiene un ave por índice
   */
  getBird(index) {
    if (!this.loaded || this.birds.length === 0) {
      return null;
    }
    return this.birds[index % this.birds.length];
  }

  /**
   * Obtiene el número de aves disponibles
   */
  getCount() {
    return this.birds.length;
  }
}

// =========================
// ESTADO DEL JUEGO
// =========================

class GameState {
  constructor() {
    this.memoryGrade = 1;
    this.totalCards = 0;
    this.totalPairs = 0;
    this.maxAttempts = 0;
    this.score = 0;
    this.matches = 0;
    this.attempts = 0;
    this.streak = 0;
    this.maxStreakSeen = 0;
    this.seriousErrors = 0;
    this.revealedCards = [];
    this.pendingLock = false;
    this.missedPairs = new Set();
  }

  reset() {
    this.score = 0;
    this.matches = 0;
    this.attempts = 0;
    this.streak = 0;
    this.maxStreakSeen = 0;
    this.seriousErrors = 0;
    this.revealedCards = [];
    this.pendingLock = false;
    this.missedPairs.clear();
  }

  loadFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof saved.memoryGrade === 'number' && GRADE_CONFIG[saved.memoryGrade]) {
        this.memoryGrade = saved.memoryGrade;
      }
    } catch (error) {
      console.warn('Error al cargar progreso:', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        memoryGrade: this.memoryGrade
      }));
    } catch (error) {
      console.warn('Error al guardar progreso:', error);

      // Notificar al usuario (podría mejorarse con UI toast)
      if (typeof window !== 'undefined' && window.console) {
        console.info('ℹ️ No se pudo guardar tu progreso. Puede que el almacenamiento local esté deshabilitado.');
      }
    }
  }
}

// =========================
// UTILIDADES
// =========================

/**
 * Asegura que un número no sea negativo
 */
function clampNonNegative(n) {
  return n < 0 ? 0 : n;
}

/**
 * Calcula el número de columnas óptimo para el grid
 */
function computeColumns(cards) {
  return Math.ceil(Math.sqrt(cards));
}

/**
 * Crea una clave canónica para identificar pares de cartas
 */
function canonicalPairKey(id1, id2) {
  const a = Number(id1);
  const b = Number(id2);
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Genera array de IDs mezclados para el tablero
 * Utiliza algoritmo Fisher-Yates para mezcla aleatoria
 */
function buildObjectIds(pairs) {
  const ids = [];

  // Crear pares
  for (let i = 0; i < pairs; i++) {
    ids.push(i);
    ids.push(i);
  }

  // Mezclar con Fisher-Yates
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids;
}

/**
 * Genera contenido temporal para las cartas
 * Si hay contenido de aves cargado, lo usa; sino usa fallback
 */
function getCardContent(objectId, contentManager) {
  const oid = Number(objectId);

  // Intentar usar contenido real
  if (contentManager && contentManager.loaded) {
    const bird = contentManager.getBird(oid);
    if (bird) {
      // Generar stats basados en el ID para mantener consistencia
      return {
        name: bird.title,
        displayText: bird.title,
        imageUrl: bird.imageUrl,
        atk: 10 + (oid % 9),
        def: 10 + ((oid + 3) % 9),
        useImage: true
      };
    }
  }

  // Fallback a contenido temporal
  return {
    name: `AVE ${oid + 1}`,
    displayText: `🜁 ${oid + 1}`,
    atk: 10 + (oid % 9),
    def: 10 + ((oid + 3) % 9),
    useImage: false
  };
}

// =========================
// GESTOR DE UI
// =========================

class UIManager {
  constructor() {
    // Referencias DOM - Tablero y overlays
    this.board = document.getElementById('board');
    this.overlay = document.getElementById('overlay');
    this.resultOverlay = document.getElementById('resultOverlay');
    this.loading = document.getElementById('loading');

    // Referencias DOM - HUD
    this.hudMatches = document.getElementById('hud-matches');
    this.hudPairs = document.getElementById('hud-pairs');
    this.hudAttempts = document.getElementById('hud-attempts');
    this.hudMaxAttempts = document.getElementById('hud-maxAttempts');
    this.hudErrors = document.getElementById('hud-errors');
    this.hudStreak = document.getElementById('hud-streak');
    this.hudScore = document.getElementById('hud-score');
    this.hudGrade = document.getElementById('hud-grade');
    this.hud = document.getElementById('hud');

    // Referencias DOM - Carta enfocada
    this.focusImage = document.getElementById('focusImage');
    this.focusName = document.getElementById('focusName');
    this.focusAtk = document.getElementById('focusAtk');
    this.focusDef = document.getElementById('focusDef');

    // Referencias DOM - Resultado
    this.resultTitle = document.getElementById('resultTitle');
    this.resultSub = document.getElementById('resultSub');
    this.resultPairs = document.getElementById('resultPairs');
    this.resultAttempts = document.getElementById('resultAttempts');
    this.resultScore = document.getElementById('resultScore');
    this.resultMaxStreak = document.getElementById('resultMaxStreak');
    this.btnPrimary = document.getElementById('btnPrimary');
    this.btnSecondary = document.getElementById('btnSecondary');
  }

  /**
   * Muestra el indicador de carga
   */
  showLoading() {
    if (this.loading) this.loading.style.display = 'block';
    if (this.hud) this.hud.style.display = 'none';
  }

  /**
   * Oculta el indicador de carga
   */
  hideLoading() {
    if (this.loading) this.loading.style.display = 'none';
    if (this.hud) this.hud.style.display = 'flex';
  }

  /**
   * Actualiza todos los elementos del HUD con el estado actual
   */
  updateHUD(state) {
    this.hudMatches.textContent = String(state.matches);
    this.hudPairs.textContent = String(state.totalPairs);
    this.hudAttempts.textContent = String(state.attempts);
    this.hudMaxAttempts.textContent = String(state.maxAttempts);
    this.hudErrors.textContent = String(state.seriousErrors);
    this.hudStreak.textContent = String(state.streak);
    this.hudScore.textContent = String(state.score);
    this.hudGrade.textContent = String(state.memoryGrade);
  }

  /**
   * Muestra la carta enfocada en pantalla completa
   */
  openFocus(card, contentManager) {
    const content = getCardContent(card.dataset.objectId, contentManager);

    // Limpiar el contenedor de imagen
    this.focusImage.innerHTML = '';

    if (content.useImage && content.imageUrl) {
      // Usar imagen real
      const img = document.createElement('img');
      img.src = content.imageUrl;
      img.alt = content.name;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

      // Manejar error de carga
      img.onerror = () => {
        this.focusImage.innerHTML = '';
        this.focusImage.textContent = content.displayText;
      };

      this.focusImage.appendChild(img);
    } else {
      // Usar texto de fallback
      this.focusImage.textContent = content.displayText;
    }

    this.focusName.textContent = content.name;
    this.focusAtk.textContent = `ATK ${content.atk}`;
    this.focusDef.textContent = `DEF ${content.def}`;

    this.overlay.classList.add('active');
  }

  /**
   * Cierra la vista de carta enfocada
   */
  closeFocus() {
    this.overlay.classList.remove('active');
  }

  /**
   * Muestra el overlay de resultado final
   */
  showResult(state, passed, onContinue, onRetry) {
    this.resultPairs.textContent = `${state.matches}/${state.totalPairs}`;
    this.resultAttempts.textContent = `${state.attempts}/${state.maxAttempts}`;
    this.resultScore.textContent = String(state.score);
    this.resultMaxStreak.textContent = String(state.maxStreakSeen);

    if (passed) {
      this.resultTitle.textContent = 'Nivel superado';
      this.resultSub.textContent = 'Eficiencia confirmada. El tablero sube de grado.';
      this.btnPrimary.textContent = 'Continuar';
      this.btnSecondary.textContent = 'Reintentar (opcional)';
    } else {
      this.resultTitle.textContent = 'Nivel completado, pero no superado';
      this.resultSub.textContent = 'Te pasaste del máximo de intentos. Para subir, debes completarlo dentro del límite.';
      this.btnPrimary.textContent = 'Reintentar';
      this.btnSecondary.textContent = 'Cerrar';
    }

    this.btnPrimary.style.display = '';
    this.btnSecondary.style.display = '';
    this.resultOverlay.classList.add('active');

    this.btnPrimary.onclick = onContinue;
    this.btnSecondary.onclick = onRetry;
  }

  /**
   * Cierra el overlay de resultado
   */
  hideResult() {
    this.resultOverlay.classList.remove('active');
  }

  /**
   * Limpia el tablero completamente
   */
  clearBoard() {
    this.board.innerHTML = '';
  }

  /**
   * Configura el grid del tablero según el número de cartas
   */
  setupBoardGrid(totalCards) {
    const columns = computeColumns(totalCards);
    this.board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  /**
   * Crea y añade una carta al tablero
   */
  createCard(objectId, onClick) {
    const card = document.createElement('div');
    card.className = 'card hidden';
    card.dataset.state = 'hidden';
    card.dataset.objectId = String(objectId);
    card.addEventListener('click', onClick);
    this.board.appendChild(card);
    return card;
  }

  /**
   * Marca una carta como revelada
   */
  revealCard(card, contentManager) {
    card.dataset.state = 'revealed';
    card.classList.remove('hidden');
    card.classList.add('revealed');

    // Añadir contenido visual a la carta
    const content = getCardContent(card.dataset.objectId, contentManager);
    card.innerHTML = '';

    if (content.useImage && content.imageUrl) {
      // Usar imagen real
      const img = document.createElement('img');
      img.src = content.imageUrl;
      img.alt = content.name;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 6px;';

      // Manejar error de carga
      img.onerror = () => {
        card.innerHTML = '';
        card.textContent = content.displayText;
      };

      card.appendChild(img);
    } else {
      // Usar texto de fallback
      card.textContent = content.displayText;
    }
  }

  /**
   * Marca una carta como pendiente (sin match)
   */
  setPendingCard(card) {
    card.dataset.state = 'pending';
    card.classList.remove('revealed');
    card.classList.add('pending');
  }

  /**
   * Marca una carta como emparejada exitosamente
   */
  setMatchedCard(card) {
    card.dataset.state = 'matched';
    card.classList.remove('revealed');
    card.classList.add('matched');
  }

  /**
   * Oculta una carta (vuelve a estado inicial)
   */
  hideCard(card) {
    card.dataset.state = 'hidden';
    card.classList.remove('pending');
    card.classList.add('hidden');
    // Limpiar contenido visual
    card.innerHTML = '';
  }

  /**
   * Limpia todas las cartas en estado pendiente
   */
  clearPendingCards() {
    const pending = this.board.querySelectorAll('.card.pending');
    pending.forEach(card => this.hideCard(card));
  }

  /**
   * Obtiene todas las cartas en estado pendiente
   */
  getPendingCards() {
    return this.board.querySelectorAll('.card.pending');
  }
}

// =========================
// MOTOR DEL JUEGO
// =========================

class MemoryGame {
  constructor() {
    this.state = new GameState();
    this.ui = new UIManager();
    this.content = new ContentManager();

    // Cargar progreso guardado
    this.state.loadFromStorage();
  }

  /**
   * Inicializa el contenido y el juego
   */
  async initialize() {
    this.ui.showLoading();

    try {
      await this.content.loadContent();
    } catch (error) {
      console.warn('Error loading content:', error);
    }

    this.ui.hideLoading();
    this.setupEventListeners();
    this.startRun();
  }

  /**
   * Inicia una nueva partida
   */
  startRun() {
    // Limpiar UI y estado
    this.ui.clearBoard();
    this.state.reset();

    // Configurar partida según grado actual
    this.state.totalCards = GRADE_CONFIG[this.state.memoryGrade];
    this.state.totalPairs = this.state.totalCards / 2;
    this.state.maxAttempts = Math.ceil(this.state.totalPairs * CONFIG.ATTEMPT_FACTOR);

    // Configurar tablero
    this.ui.setupBoardGrid(this.state.totalCards);

    // Crear cartas mezcladas
    const objectIds = buildObjectIds(this.state.totalPairs);

    for (let i = 0; i < this.state.totalCards; i++) {
      this.ui.createCard(objectIds[i], (ev) => this.handleCardClick(ev));
    }

    this.ui.updateHUD(this.state);
  }

  /**
   * Maneja el click en una carta
   */
  handleCardClick(event) {
    event.stopPropagation();

    const card = event.currentTarget;

    // Si hay cartas pendientes, limpiarlas primero
    if (this.ui.getPendingCards().length > 0) {
      this.ui.clearPendingCards();
      return; // Este click se consume en la limpieza
    }

    // Validaciones
    if (this.state.pendingLock) return;
    if (card.dataset.state !== 'hidden') return;
    if (this.state.revealedCards.length >= 2) return;

    // Revelar carta con contenido
    this.ui.revealCard(card, this.content);
    this.state.revealedCards.push(card);

    // Mostrar carta enfocada
    this.ui.openFocus(card, this.content);
  }

  /**
   * Resuelve el intento con dos cartas reveladas
   */
  resolvePair(cardA, cardB) {
    // Incrementar intentos
    this.state.attempts += 1;

    const idA = Number(cardA.dataset.objectId);
    const idB = Number(cardB.dataset.objectId);
    const isMatch = idA === idB;

    if (isMatch) {
      this.handleMatch(cardA, cardB);
    } else {
      this.handleMiss(cardA, cardB);
    }

    this.state.revealedCards = [];
    this.ui.updateHUD(this.state);
  }

  /**
   * Maneja un par exitoso (match)
   */
  handleMatch(cardA, cardB) {
    this.state.matches += 1;

    // Incrementar racha
    this.state.streak += 1;
    if (this.state.streak > this.state.maxStreakSeen) {
      this.state.maxStreakSeen = this.state.streak;
    }

    // Puntos base
    this.state.score += 10;

    // Bono por racha (acumulativo)
    const stepBonus = CONFIG.STREAK_BASE_BONUS * (this.state.streak - 1);
    this.state.score += stepBonus;

    // Actualizar UI
    this.ui.setMatchedCard(cardA);
    this.ui.setMatchedCard(cardB);

    // Verificar fin de nivel
    this.checkEndOfLevel();
  }

  /**
   * Maneja un par fallido (miss)
   */
  handleMiss(cardA, cardB) {
    // Romper racha
    this.state.streak = 0;

    // Penalizar repetición de error
    const key = canonicalPairKey(cardA.dataset.objectId, cardB.dataset.objectId);
    if (this.state.missedPairs.has(key)) {
      this.state.attempts += CONFIG.REPEAT_MISS_EXTRA_ATTEMPTS;
      this.state.score = clampNonNegative(this.state.score - CONFIG.REPEAT_MISS_POINT_PENALTY);
      this.state.seriousErrors += 1; // Increment serious errors counter
    } else {
      this.state.missedPairs.add(key);
    }

    // Actualizar UI
    this.ui.setPendingCard(cardA);
    this.ui.setPendingCard(cardB);
  }

  /**
   * Verifica si el nivel ha terminado
   */
  checkEndOfLevel() {
    if (this.state.matches !== this.state.totalPairs) return;

    const passed = this.state.attempts <= this.state.maxAttempts;

    setTimeout(() => {
      this.ui.showResult(
        this.state,
        passed,
        () => this.handleContinue(passed),
        () => this.handleRetry(passed)
      );
    }, CONFIG.FOCUS_CLOSE_DELAY);
  }

  /**
   * Maneja el botón de continuar en el resultado
   */
  handleContinue(passed) {
    this.ui.hideResult();

    if (passed) {
      // Subir de grado si es posible
      const nextGrade = this.state.memoryGrade + 1;
      if (GRADE_CONFIG[nextGrade]) {
        this.state.memoryGrade = nextGrade;
        this.state.saveToStorage();
      }
    }

    this.startRun();
  }

  /**
   * Maneja el botón secundario en el resultado
   */
  handleRetry(passed) {
    this.ui.hideResult();

    if (!passed) {
      // Si no pasó, solo cerrar sin reiniciar
      return;
    }

    // Si pasó, permitir reintentar
    this.startRun();
  }

  /**
   * Configura los event listeners globales
   */
  setupEventListeners() {
    // Click en overlay cierra el foco y resuelve par si hay 2 cartas
    this.ui.overlay.addEventListener('click', () => {
      this.ui.closeFocus();

      if (this.state.revealedCards.length === 2) {
        const [cardA, cardB] = this.state.revealedCards;
        this.resolvePair(cardA, cardB);
      }
    });

    // Click en tablero limpia cartas pendientes
    this.ui.board.addEventListener('click', (event) => {
      // Solo si el click es en el fondo del tablero (no en una carta)
      if (event.target === this.ui.board && this.ui.getPendingCards().length > 0) {
        this.ui.clearPendingCards();
      }
    });
  }

  /**
   * Inicializa el juego (deprecated - usar initialize)
   * Mantenido para compatibilidad con versiones anteriores
   */
  init() {
    return this.initialize();
  }
}

// =========================
// INICIALIZACIÓN
// =========================

document.addEventListener('DOMContentLoaded', async () => {
  const game = new MemoryGame();
  await game.initialize();

  // Exponer para debugging (solo en desarrollo)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.kyndoGame = game;
    console.info('🐛 Debug: window.kyndoGame disponible');
  }
});
