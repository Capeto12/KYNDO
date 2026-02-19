/**
 * KYNDO - Deck Manager
 *
 * Gestiona la colección de cartas del jugador y sus mazos.
 * Persiste en localStorage. Preparado para migrar a backend.
 *
 * Reglas:
 *  - El jugador tiene 1 colección (pool de todas sus cartas).
 *  - Puede crear hasta MAX_DECKS mazos nombrados.
 *  - Puede mover cartas desde la colección a un mazo (y viceversa).
 *  - Cada sobre (pack) agrega PACK_SIZE cartas aleatorias a la colección.
 *  - Cada 5 copias de la misma carta se puede canjear por 1 carta nueva.
 *
 * @version 1.0
 */

// ===========================
// Catálogo de cartas (Pack 1)
// ===========================
export const CARD_CATALOG = [
  { cardId: 'guacamaya-roja',        title: 'Guacamaya Roja',           rarity: 'abundante' },
  { cardId: 'condor-andino',         title: 'Cóndor Andino',            rarity: 'rara' },
  { cardId: 'colibri',               title: 'Colibrí',                  rarity: 'abundante' },
  { cardId: 'tucan',                 title: 'Tucán',                    rarity: 'frecuente' },
  { cardId: 'buho',                  title: 'Búho',                     rarity: 'rara' },
  { cardId: 'garza-blanca',          title: 'Garza Blanca',             rarity: 'abundante' },
  { cardId: 'flamenco',              title: 'Flamenco',                 rarity: 'rara' },
  { cardId: 'picozapato',            title: 'Picozapato',               rarity: 'excepcional' },
  { cardId: 'martin-pescador',       title: 'Martín Pescador',          rarity: 'abundante' },
  { cardId: 'halcon',                title: 'Halcón',                   rarity: 'rara' },
  { cardId: 'aguila-harpia',         title: 'Águila Harpía',            rarity: 'excepcional' },
  { cardId: 'quetzal',               title: 'Quetzal',                  rarity: 'excepcional' },
  { cardId: 'pinguino-humboldt',     title: 'Pingüino de Humboldt',     rarity: 'rara' },
  { cardId: 'pajaro-campana',        title: 'Pájaro Campana',           rarity: 'frecuente' },
  { cardId: 'gallito-roca',          title: 'Gallito de las Rocas',     rarity: 'frecuente' },
  { cardId: 'loro-orejiamarillo',    title: 'Loro Orejiamarillo',       rarity: 'excepcional' },
  { cardId: 'hoatzin',               title: 'Hoatzín',                  rarity: 'rara' },
  { cardId: 'pato-crestudo',         title: 'Pato Crestudo',            rarity: 'abundante' },
  { cardId: 'tangara-multicolor',    title: 'Tangara Multicolor',       rarity: 'abundante' },
  { cardId: 'carpintero-real',       title: 'Carpintero Real',          rarity: 'rara' },
  { cardId: 'espatula-rosada',       title: 'Espátula Rosada',          rarity: 'rara' },
  { cardId: 'ibis-escarlata',        title: 'Ibis Escarlata',           rarity: 'frecuente' },
  { cardId: 'ciguena-jabiru',        title: 'Cigüeña Jabirú',           rarity: 'rara' },
  { cardId: 'pelicano-pardo',        title: 'Pelícano Pardo',           rarity: 'abundante' },
  { cardId: 'cormoran',              title: 'Cormorán',                 rarity: 'abundante' },
  { cardId: 'fragata-magnificente',  title: 'Fragata Magnificente',     rarity: 'frecuente' },
  { cardId: 'piquero-patas-azules',  title: 'Piquero de Patas Azules',  rarity: 'frecuente' },
  { cardId: 'limpkin',               title: 'Carrao',                   rarity: 'abundante' },
  { cardId: 'paujil',                title: 'Paujil',                   rarity: 'rara' },
  { cardId: 'perdiz-crestada',       title: 'Perdiz Crestada',          rarity: 'abundante' },
  { cardId: 'paloma-coronita',       title: 'Paloma Coronita',          rarity: 'abundante' },
  { cardId: 'trogon-enmascarado',    title: 'Trogón Enmascarado',       rarity: 'rara' },
  { cardId: 'barranquero',           title: 'Barranquero',              rarity: 'abundante' },
  { cardId: 'amazilia',              title: 'Amazilia',                 rarity: 'abundante' },
  { cardId: 'piranga-roja',          title: 'Piranga Roja',             rarity: 'abundante' },
  { cardId: 'oropendola',            title: 'Oropéndola',               rarity: 'abundante' },
  { cardId: 'siete-colores',         title: 'Siete Colores',            rarity: 'rara' },
  { cardId: 'atrapamoscas',          title: 'Atrapamoscas',             rarity: 'abundante' },
  { cardId: 'golondrina',            title: 'Golondrina',               rarity: 'abundante' },
  { cardId: 'canario-coronado',      title: 'Canario Coronado',         rarity: 'abundante' },
];

// Índice por cardId para búsqueda rápida
export const CATALOG_INDEX = Object.fromEntries(CARD_CATALOG.map(c => [c.cardId, c]));

// ===========================
// Constantes
// ===========================
export const MAX_DECKS = 3;
export const PACK_SIZE = 5;                // Cartas por sobre
export const STARTING_PACK_CREDITS = 3;   // Créditos gratis al inicio
export const DUPLICATES_FOR_EXCHANGE = 5; // Copias extra para canjear 1 carta nueva
export const STORAGE_KEY = 'kyndo_decks_v1';
export const STARTING_COPIES_PER_CARD = 2; // Copias iniciales de cada carta para garantizar al menos 80 cartas al inicio (CARD_CATALOG.length × STARTING_COPIES_PER_CARD)

/** Pesos de rareza para apertura aleatoria de sobres */
const RARITY_WEIGHTS = {
  abundante:   50,
  frecuente:   25,
  rara:        20,
  excepcional:  5,
};

// ===========================
// Helpers internos
// ===========================

/** Devuelve un cardId aleatorio ponderado por rareza */
function randomCardFromCatalog() {
  const totalWeight = CARD_CATALOG.reduce(
    (sum, c) => sum + (RARITY_WEIGHTS[c.rarity] ?? 10),
    0
  );
  let roll = Math.random() * totalWeight;
  for (const card of CARD_CATALOG) {
    roll -= RARITY_WEIGHTS[card.rarity] ?? 10;
    if (roll <= 0) return card.cardId;
  }
  return CARD_CATALOG[CARD_CATALOG.length - 1].cardId;
}

// ===========================
// DeckManager
// ===========================

export class DeckManager {
  constructor() {
    this._state = null;
  }

  // -------------------------
  // Persistencia
  // -------------------------

  /** Carga el estado desde localStorage */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._state = raw ? JSON.parse(raw) : null;
    } catch {
      this._state = null;
    }
    if (!this._state) {
      this._state = this._defaultState();
    }
    return this._state;
  }

  /** Guarda el estado en localStorage */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
      return true;
    } catch {
      return false;
    }
  }

  /** Devuelve el estado actual (carga si aún no se ha hecho) */
  get state() {
    if (!this._state) this.load();
    return this._state;
  }

  /** Estado inicial por defecto */
  _defaultState() {
    // Pre-poblar colección con STARTING_COPIES_PER_CARD copias de cada carta
    // del catálogo (CARD_CATALOG.length × STARTING_COPIES_PER_CARD cartas en total)
    // para garantizar suficientes cartas para jugar hasta el último grado del Nivel 1
    const collection = {};
    for (const card of CARD_CATALOG) {
      collection[card.cardId] = { cardId: card.cardId, count: STARTING_COPIES_PER_CARD };
    }
    return {
      collection,
      decks: [
        { id: 1, name: 'Mazo 1', mode: 'pairs',  cards: [] },
        { id: 2, name: 'Mazo 2', mode: 'kombat', cards: [] },
        { id: 3, name: 'Mazo 3', mode: 'pairs',  cards: [] },
      ],
      packCredits: STARTING_PACK_CREDITS,
    };
  }

  // -------------------------
  // Colección
  // -------------------------

  /**
   * Agrega `count` copias de una carta a la colección
   * @param {string} cardId
   * @param {number} count
   */
  addToCollection(cardId, count = 1) {
    const s = this.state;
    if (!s.collection[cardId]) {
      s.collection[cardId] = { cardId, count: 0 };
    }
    s.collection[cardId].count += count;
    this.save();
  }

  /**
   * Quita `count` copias de una carta de la colección.
   * Devuelve false si no hay suficientes copias disponibles.
   * @param {string} cardId
   * @param {number} count
   * @returns {boolean}
   */
  removeFromCollection(cardId, count = 1) {
    const s = this.state;
    const entry = s.collection[cardId];
    if (!entry || entry.count < count) return false;
    entry.count -= count;
    if (entry.count === 0) delete s.collection[cardId];
    this.save();
    return true;
  }

  /**
   * Devuelve el número de copias de una carta en la colección
   * (sin contar las que ya están en mazos).
   * @param {string} cardId
   * @returns {number}
   */
  collectionCount(cardId) {
    return this.state.collection[cardId]?.count ?? 0;
  }

  /**
   * Devuelve el total de copias de una carta (colección + mazos)
   * @param {string} cardId
   * @returns {number}
   */
  totalCopies(cardId) {
    const inCollection = this.collectionCount(cardId);
    const inDecks = this.state.decks.reduce(
      (sum, d) => sum + d.cards.filter(c => c === cardId).length,
      0
    );
    return inCollection + inDecks;
  }

  // -------------------------
  // Mazos
  // -------------------------

  /**
   * Obtiene un mazo por su id (1-3)
   * @param {number} deckId
   * @returns {object|null}
   */
  getDeck(deckId) {
    return this.state.decks.find(d => d.id === deckId) ?? null;
  }

  /**
   * Cambia el nombre de un mazo
   * @param {number} deckId
   * @param {string} name
   */
  renameDeck(deckId, name) {
    if (!name) return false;
    const deck = this.getDeck(deckId);
    if (!deck) return false;
    deck.name = name.trim().slice(0, 30) || deck.name;
    this.save();
    return true;
  }

  /**
   * Cambia el modo de juego de un mazo ('pairs' | 'kombat')
   * @param {number} deckId
   * @param {string} mode
   */
  setDeckMode(deckId, mode) {
    const deck = this.getDeck(deckId);
    if (!deck) return false;
    if (mode !== 'pairs' && mode !== 'kombat') return false;
    deck.mode = mode;
    this.save();
    return true;
  }

  /**
   * Mueve una carta de la colección a un mazo.
   * @param {string} cardId
   * @param {number} deckId
   * @returns {boolean}
   */
  moveToDeck(cardId, deckId) {
    const deck = this.getDeck(deckId);
    if (!deck) return false;
    if (!this.removeFromCollection(cardId)) return false;
    deck.cards.push(cardId);
    this.save();
    return true;
  }

  /**
   * Mueve una carta de un mazo a la colección.
   * @param {string} cardId
   * @param {number} deckId
   * @returns {boolean}
   */
  moveToCollection(cardId, deckId) {
    const deck = this.getDeck(deckId);
    if (!deck) return false;
    const idx = deck.cards.indexOf(cardId);
    if (idx === -1) return false;
    deck.cards.splice(idx, 1);
    this.addToCollection(cardId);
    this.save();
    return true;
  }

  /**
   * Mueve una carta de un mazo a otro.
   * @param {string} cardId
   * @param {number} fromDeckId
   * @param {number} toDeckId
   * @returns {boolean}
   */
  moveBetweenDecks(cardId, fromDeckId, toDeckId) {
    const from = this.getDeck(fromDeckId);
    const to = this.getDeck(toDeckId);
    if (!from || !to) return false;
    const idx = from.cards.indexOf(cardId);
    if (idx === -1) return false;
    from.cards.splice(idx, 1);
    to.cards.push(cardId);
    this.save();
    return true;
  }

  // -------------------------
  // Sobres (Packs)
  // -------------------------

  /**
   * Abre un sobre usando un crédito de pack.
   * @returns {{ success: boolean, cards: string[] }}
   */
  openPack() {
    const s = this.state;
    if (s.packCredits < 1) return { success: false, cards: [] };
    s.packCredits -= 1;
    const cards = [];
    for (let i = 0; i < PACK_SIZE; i++) {
      const cardId = randomCardFromCatalog();
      cards.push(cardId);
      if (!s.collection[cardId]) s.collection[cardId] = { cardId, count: 0 };
      s.collection[cardId].count += 1;
    }
    this.save();
    return { success: true, cards };
  }

  /**
   * Otorga créditos de pack adicionales (p.ej. al ganar partidas)
   * @param {number} count
   */
  addPackCredits(count = 1) {
    this.state.packCredits += count;
    this.save();
  }

  // -------------------------
  // Canje de duplicados
  // -------------------------

  /**
   * Devuelve las cartas que tienen más de DUPLICATES_FOR_EXCHANGE copias
   * en colección. Se requiere al menos DUPLICATES_FOR_EXCHANGE + 1 copias
   * para poder canjear: se gastan DUPLICATES_FOR_EXCHANGE y siempre se
   * conserva al menos 1 copia de la carta original tras el canje.
   * @returns {Array<{ cardId, availableToExchange }>}
   */
  getExchangeableDuplicates() {
    return Object.values(this.state.collection)
      .filter(entry => entry.count > DUPLICATES_FOR_EXCHANGE)
      .map(entry => ({
        cardId: entry.cardId,
        availableToExchange: Math.floor((entry.count - 1) / DUPLICATES_FOR_EXCHANGE),
      }));
  }

  /**
   * Canjea DUPLICATES_FOR_EXCHANGE copias de una carta por 1 carta nueva
   * que el jugador aún no posee.
   * @param {string} sourceCardId - Carta de la que se tienen duplicados
   * @returns {{ success: boolean, newCardId: string|null, reason: string }}
   */
  exchangeDuplicates(sourceCardId) {
    const entry = this.state.collection[sourceCardId];
    if (!entry || entry.count <= DUPLICATES_FOR_EXCHANGE) {
      return { success: false, newCardId: null, reason: 'not_enough_copies' };
    }

    // Cartas que el jugador NO tiene en absoluto
    const owned = new Set(Object.keys(this.state.collection));
    this.state.decks.forEach(d => d.cards.forEach(c => owned.add(c)));
    const missing = CARD_CATALOG.filter(c => !owned.has(c.cardId));

    if (missing.length === 0) {
      return { success: false, newCardId: null, reason: 'collection_complete' };
    }

    // Quita los duplicados
    entry.count -= DUPLICATES_FOR_EXCHANGE;
    if (entry.count === 0) delete this.state.collection[sourceCardId];

    // Da una carta nueva aleatoria (ponderada por rareza)
    let totalWeight = missing.reduce((s, c) => s + (RARITY_WEIGHTS[c.rarity] ?? 10), 0);
    let roll = Math.random() * totalWeight;
    let newCard = missing[missing.length - 1];
    for (const c of missing) {
      roll -= RARITY_WEIGHTS[c.rarity] ?? 10;
      if (roll <= 0) { newCard = c; break; }
    }

    this.addToCollection(newCard.cardId);
    this.save();
    return { success: true, newCardId: newCard.cardId, reason: 'ok' };
  }

  // -------------------------
  // Utilidades de consulta
  // -------------------------

  /**
   * Devuelve las cartas de la colección enriquecidas con info del catálogo
   * @returns {Array}
   */
  getCollectionCards() {
    return Object.values(this.state.collection).map(entry => ({
      ...entry,
      ...(CATALOG_INDEX[entry.cardId] ?? { title: entry.cardId, rarity: 'abundante' }),
    }));
  }

  /**
   * Devuelve las cartas de un mazo enriquecidas con info del catálogo
   * @param {number} deckId
   * @returns {Array}
   */
  getDeckCards(deckId) {
    const deck = this.getDeck(deckId);
    if (!deck) return [];
    return deck.cards.map(cardId => ({
      cardId,
      ...(CATALOG_INDEX[cardId] ?? { title: cardId, rarity: 'abundante' }),
    }));
  }
}

/** Instancia singleton */
export const deckManager = new DeckManager();
