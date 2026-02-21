/**
 * REWARDS TEST SUITE
 * Tests for the card/pack reward system.
 *
 * Usage (browser):  <script type="module" src="rewards-tests.js"></script>
 * Usage (Node.js):  node --input-type=module < rewards-tests.js
 */

import {
  REWARD_TYPE,
  REWARD_SOURCE,
  checkStreakReward,
  getGradePassReward,
  getKombatSetWinReward,
  getKombatMatchWinReward,
  isCardUnlockedForGrade,
  filterCardsForGrade,
  addRewardToInventory,
  countEarnedCards,
  createCardReward,
  createPackReward
} from './rewards.js';
import { STREAK_CARD_REWARD_THRESHOLD, PACK_SIZES, KOMBAT_SET_WIN_CARDS } from './config.js';

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

function assertNull(value, message) {
  if (value !== null) {
    throw new Error(message || `Expected null, got ${JSON.stringify(value)}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected a value, got null/undefined');
  }
}

// ============================
// STREAK REWARD TESTS
// ============================

console.log('\n🧪 Testing checkStreakReward...\n');

test('checkStreakReward: no reward below threshold', () => {
  for (let s = 1; s < STREAK_CARD_REWARD_THRESHOLD; s++) {
    assertNull(checkStreakReward(s), `Expected null for streak ${s}`);
  }
});

test('checkStreakReward: reward at exact threshold', () => {
  const reward = checkStreakReward(STREAK_CARD_REWARD_THRESHOLD);
  assertNotNull(reward, 'Expected reward at streak threshold');
  assertEqual(reward.type, REWARD_TYPE.CARD, 'Type should be CARD');
  assertEqual(reward.source, REWARD_SOURCE.STREAK, 'Source should be STREAK');
  assertEqual(reward.size, 1, 'Card reward size should be 1');
});

test('checkStreakReward: reward at double threshold (6)', () => {
  const reward = checkStreakReward(STREAK_CARD_REWARD_THRESHOLD * 2);
  assertNotNull(reward, 'Expected reward at double threshold');
  assertEqual(reward.type, REWARD_TYPE.CARD, 'Type should be CARD');
});

test('checkStreakReward: no reward at intermediate values (e.g. 4, 5)', () => {
  for (let s = STREAK_CARD_REWARD_THRESHOLD + 1; s < STREAK_CARD_REWARD_THRESHOLD * 2; s++) {
    assertNull(checkStreakReward(s), `Expected null for streak ${s}`);
  }
});

test('checkStreakReward: no reward for streak 0', () => {
  assertNull(checkStreakReward(0), 'Expected null for streak 0');
});

// ============================
// GRADE PASS REWARD TESTS
// ============================

console.log('\n🧪 Testing getGradePassReward...\n');

test('getGradePassReward: returns a pack reward', () => {
  const reward = getGradePassReward(1);
  assertNotNull(reward, 'Expected a reward');
  assertEqual(reward.type, REWARD_TYPE.PACK, 'Type should be PACK');
  assertEqual(reward.source, REWARD_SOURCE.GRADE_PASS, 'Source should be GRADE_PASS');
  assertEqual(reward.size, PACK_SIZES.GRADE_PASS, 'Pack size should match config');
});

test('getGradePassReward: same pack size for any grade', () => {
  [1, 2, 3, 4, 5].forEach(g => {
    const r = getGradePassReward(g);
    assertEqual(r.size, PACK_SIZES.GRADE_PASS, `Grade ${g}: pack size should be ${PACK_SIZES.GRADE_PASS}`);
  });
});

// ============================
// KOMBAT SET WIN REWARD TESTS
// ============================

console.log('\n🧪 Testing getKombatSetWinReward...\n');

test('getKombatSetWinReward: returns 1 card reward', () => {
  const reward = getKombatSetWinReward();
  assertNotNull(reward);
  assertEqual(reward.type, REWARD_TYPE.CARD, 'Type should be CARD');
  assertEqual(reward.source, REWARD_SOURCE.KOMBAT_SET, 'Source should be KOMBAT_SET');
  assertEqual(reward.size, KOMBAT_SET_WIN_CARDS, 'Size should match config');
});

// ============================
// KOMBAT MATCH WIN REWARD TESTS
// ============================

console.log('\n🧪 Testing getKombatMatchWinReward...\n');

test('getKombatMatchWinReward: returns a 5-card pack', () => {
  const reward = getKombatMatchWinReward();
  assertNotNull(reward);
  assertEqual(reward.type, REWARD_TYPE.PACK, 'Type should be PACK');
  assertEqual(reward.source, REWARD_SOURCE.KOMBAT_MATCH, 'Source should be KOMBAT_MATCH');
  assertEqual(reward.size, PACK_SIZES.KOMBAT_MATCH, 'Pack size should match config');
});

// ============================
// LEVEL-LOCK TESTS
// ============================

console.log('\n🧪 Testing isCardUnlockedForGrade...\n');

test('isCardUnlockedForGrade: card without minGrade is always unlocked', () => {
  assert(isCardUnlockedForGrade(undefined, 1), 'undefined minGrade should be unlocked at grade 1');
  assert(isCardUnlockedForGrade(null, 1), 'null minGrade should be unlocked at grade 1');
});

test('isCardUnlockedForGrade: card locked when player grade is below minGrade', () => {
  assert(!isCardUnlockedForGrade(3, 1), 'Grade 1 player should not see minGrade 3 card');
  assert(!isCardUnlockedForGrade(3, 2), 'Grade 2 player should not see minGrade 3 card');
});

test('isCardUnlockedForGrade: card unlocked at exact minGrade', () => {
  assert(isCardUnlockedForGrade(3, 3), 'Grade 3 player should see minGrade 3 card');
});

test('isCardUnlockedForGrade: card unlocked above minGrade', () => {
  assert(isCardUnlockedForGrade(3, 5), 'Grade 5 player should see minGrade 3 card');
});

// ============================
// filterCardsForGrade TESTS
// ============================

console.log('\n🧪 Testing filterCardsForGrade...\n');

test('filterCardsForGrade: shows only cards available for grade', () => {
  const cards = [
    { id: 'a' },              // no minGrade → always visible
    { id: 'b', minGrade: 2 }, // visible from grade 2
    { id: 'c', minGrade: 3 }, // visible from grade 3
    { id: 'd', minGrade: 5 }  // visible from grade 5
  ];

  const grade1 = filterCardsForGrade(cards, 1);
  assertEqual(grade1.length, 1, 'Grade 1 should see 1 card');

  const grade2 = filterCardsForGrade(cards, 2);
  assertEqual(grade2.length, 2, 'Grade 2 should see 2 cards');

  const grade3 = filterCardsForGrade(cards, 3);
  assertEqual(grade3.length, 3, 'Grade 3 should see 3 cards');

  const grade5 = filterCardsForGrade(cards, 5);
  assertEqual(grade5.length, 4, 'Grade 5 should see all 4 cards');
});

// ============================
// INVENTORY TESTS
// ============================

console.log('\n🧪 Testing inventory helpers...\n');

test('addRewardToInventory: returns new array with reward appended', () => {
  const inv = [];
  const reward = createCardReward(REWARD_SOURCE.STREAK);
  const next = addRewardToInventory(inv, reward);
  assertEqual(next.length, 1, 'Inventory should have 1 item');
  assert(inv !== next, 'Should return a new array (immutable)');
});

test('countEarnedCards: sums sizes of all rewards', () => {
  const rewards = [
    createCardReward(REWARD_SOURCE.STREAK),          // size 1
    createPackReward(REWARD_SOURCE.GRADE_PASS, 5),   // size 5
    createPackReward(REWARD_SOURCE.KOMBAT_MATCH, 5)  // size 5
  ];
  assertEqual(countEarnedCards(rewards), 11, 'Total earned cards should be 11');
});

test('countEarnedCards: returns 0 for empty inventory', () => {
  assertEqual(countEarnedCards([]), 0, 'Empty inventory should return 0');
});

// ============================
// SUMMARY
// ============================

console.log(`\n📊 Resultado: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed > 0) {
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
}
