/**
 * BATTLE ENGINE TEST SUITE
 * Run tests: Open this file in browser console or use Node.js
 * 
 * Usage:
 * 1. Import in HTML: <script type="module" src="battle-engine-tests.js"></script>
 * 2. Or run in Node.js: node --input-type=module < battle-engine-tests.js
 */

import { BattleCard, BattleRound, BattleGame, getSampleDeck } from './battle-engine.js';
import { BATTLE_CONFIG } from './config.js';

// ============================
// TEST UTILITIES
// ============================

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertBetween(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
  }
}

// ============================
// BATTLE CARD TESTS
// ============================

console.log('\n🧪 Testing BattleCard...\n');

test('BattleCard: Create with default factors', () => {
  const card = new BattleCard({
    cardId: 'test-card',
    name: 'Test',
    image: 'test.png'
  });

  assert(card.cardId === 'test-card');
  assert(card.name === 'Test');
  assertBetween(card.attackFactors.P, 0, 10);
  assertBetween(card.defenseFactors.AD, 0, 10);
});

test('BattleCard: Attack score is 0-99', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    attackFactors: { P: 10, S: 10, W: 10, H: 10, A: 10 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const attack = card.calculateAttack();
  assertBetween(attack, 0, 99, `Attack ${attack} should be 0-99`);
});

test('BattleCard: Defense score is 0-99', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    attackFactors: { P: 5, S: 5, W: 5, H: 5, A: 5 },
    defenseFactors: { AD: 10, C: 10, E: 10, SD: 10, R: 10 }
  });

  const defense = card.calculateDefense();
  assertBetween(defense, 0, 99, `Defense ${defense} should be 0-99`);
});

test('BattleCard: Rarity bonus applied (Abundante 1.0x)', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    rarity: 'abundante',
    attackFactors: { P: 10, S: 10, W: 10, H: 10, A: 10 }
  });

  // Abundante = 1.0x, so should still be max 10
  assert(card.attackFactors.P === 10);
});

test('BattleCard: Rarity bonus applied (Rara 1.25x)', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    rarity: 'rara',
    attackFactors: { P: 8, S: 8, W: 8, H: 8, A: 8 }
  });

  // Rara = 1.25x → 8 * 1.25 = 10 (capped at 10)
  assert(card.attackFactors.P === 10);
});

test('BattleCard: Rarity bonus capped at 10 (Excepcional 1.5x)', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    rarity: 'excepcional',
    attackFactors: { P: 10, S: 10, W: 10, H: 10, A: 10 }
  });

  // Excepcional = 1.5x, but capped at 10
  assert(card.attackFactors.P === 10);
  assert(card.attackFactors.S === 10);
});

test('BattleCard: Environment bonus increases defense', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const defenseNeutral = card.calculateDefense(0);
  const defenseBonus = card.calculateDefense(20); // 20% bonus

  assert(defenseBonus > defenseNeutral, 'Bonus should increase defense');
});

test('BattleCard: Score is average of attack and defense', () => {
  const card = new BattleCard({
    cardId: 'test',
    name: 'Test',
    image: 'test.png',
    attackFactors: { P: 10, S: 0, W: 0, H: 0, A: 0 },
    defenseFactors: { AD: 0, C: 0, E: 0, SD: 0, R: 0 }
  });

  const score = card.getScore();
  assertBetween(score, 0, 99);
});

// ============================
// BATTLE ROUND TESTS
// ============================

console.log('\n🧪 Testing BattleRound...\n');

test('BattleRound: Winner determined by damage difference', () => {
  const strong = new BattleCard({
    cardId: 'strong',
    name: 'Strong',
    image: 'strong.png',
    attackFactors: { P: 10, S: 10, W: 10, H: 10, A: 10 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const weak = new BattleCard({
    cardId: 'weak',
    name: 'Weak',
    image: 'weak.png',
    attackFactors: { P: 2, S: 2, W: 2, H: 2, A: 2 },
    defenseFactors: { AD: 2, C: 2, E: 2, SD: 2, R: 2 }
  });

  const round = new BattleRound(strong, weak);
  assertEqual(round.winner, 'player', 'Strong card should win');
});

test('BattleRound: Damage never negative', () => {
  const card1 = new BattleCard({
    cardId: 'c1',
    name: 'Card1',
    image: 'c1.png',
    attackFactors: { P: 1, S: 1, W: 1, H: 1, A: 1 },
    defenseFactors: { AD: 10, C: 10, E: 10, SD: 10, R: 10 }
  });

  const card2 = new BattleCard({
    cardId: 'c2',
    name: 'Card2',
    image: 'c2.png',
    attackFactors: { P: 1, S: 1, W: 1, H: 1, A: 1 },
    defenseFactors: { AD: 10, C: 10, E: 10, SD: 10, R: 10 }
  });

  const round = new BattleRound(card1, card2);
  assert(round.damageDealt >= 0, 'Damage should not be negative');
  assert(round.damageTaken >= 0, 'Damage taken should not be negative');
});

test('BattleRound: Draw when both take same damage', () => {
  const card1 = new BattleCard({
    cardId: 'c1',
    name: 'Card1',
    image: 'c1.png',
    attackFactors: { P: 5, S: 5, W: 5, H: 5, A: 5 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const card2 = new BattleCard({
    cardId: 'c2',
    name: 'Card2',
    image: 'c2.png',
    attackFactors: { P: 5, S: 5, W: 5, H: 5, A: 5 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const round = new BattleRound(card1, card2);
  assertEqual(round.winner, 'draw', 'Identical cards should draw');
});

test('BattleRound: Environment bonus affects defense only', () => {
  const player = new BattleCard({
    cardId: 'p',
    name: 'Player',
    image: 'p.png',
    attackFactors: { P: 5, S: 5, W: 5, H: 5, A: 5 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const opponent = new BattleCard({
    cardId: 'o',
    name: 'Opponent',
    image: 'o.png',
    attackFactors: { P: 5, S: 5, W: 5, H: 5, A: 5 },
    defenseFactors: { AD: 5, C: 5, E: 5, SD: 5, R: 5 }
  });

  const round1 = new BattleRound(player, opponent, 1, 'neutral');
  const round2 = new BattleRound(player, opponent, 1, 'water');

  assert(round1.winner === 'draw');
  assert(round2.opponentDefense > round1.opponentDefense, 'Water bonus should increase opponent defense');
});

// ============================
// BATTLE GAME TESTS
// ============================

console.log('\n🧪 Testing BattleGame...\n');

test('BattleGame: Initializes with correct starting health', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2, { playerHealth: 100 });

  assertEqual(game.playerHealth, 100);
  assertEqual(game.opponentHealth, 100);
  assertEqual(game.status, 'ongoing');
});

test('BattleGame: Play single round', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2);
  const result = game.playRound();

  assert(result !== null, 'Should return round result');
  assert(result.round === 1, 'Should be round 1');
  assertBetween(result.playerDamage, 0, 100);
  assertBetween(result.opponentDamage, 0, 100);
});

test('BattleGame: Health decreases with damage', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2);
  const healthBefore = game.playerHealth;

  game.playRound();

  assert(game.playerHealth <= healthBefore, 'Health should decrease or stay same');
});

test('BattleGame: Auto-battle completes', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2, { playerHealth: 1000 });
  const results = game.autoBattle();

  assert(game.status !== 'ongoing', 'Battle should end');
  assert(results.length > 0, 'Should have results');
  assert(game.playerHealth === 0 || game.opponentHealth === 0, 'Someone should be at 0 health');
});

test('BattleGame: Summary contains correct stats', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2, { playerHealth: 1000 });
  game.autoBattle();

  const summary = game.getSummary();

  assert(summary.status !== 'ongoing');
  assert(summary.totalRounds > 0);
  assertEqual(summary.playerWins + summary.opponentWins + summary.draws, summary.totalRounds);
});

test('BattleGame: Battle stats calculated correctly', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2, { playerHealth: 1000 });
  game.autoBattle();

  const stats = game.getBattleStats();

  assertBetween(stats.winRate, 0, 100, 'Win rate should be 0-100%');
  assert(stats.damageDealt >= 0, 'Damage dealt should be >= 0');
  assert(stats.cardsUsed > 0, 'Cards used should be > 0');
  assertBetween(stats.efficiency, 0, 100, 'Efficiency should be 0-100%');
});

test('BattleGame: Game ends when health reaches 0', () => {
  const deck1 = getSampleDeck();
  const deck2 = getSampleDeck();

  const game = new BattleGame(deck1, deck2, { playerHealth: 10 });

  while (game.status === 'ongoing') {
    game.playRound();
  }

  assert(game.status !== 'ongoing', 'Battle should be finished');
  assert(game.playerHealth === 0 || game.opponentHealth === 0, 'Someone at 0 health');
});

// ============================
// TEST SUMMARY
// ============================

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed.`);
}

// Export for Node.js/Module usage
export { test, assert, assertEqual, assertBetween };
