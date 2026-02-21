import {
    REWARD_TYPE,
    REWARD_SOURCE,
    createPackReward,
    createCardReward,
    checkStreakReward,
    getGradePassReward,
    getKombatSetWinReward,
    getKombatMatchWinReward,
    isCardUnlockedForGrade,
    filterCardsForGrade,
    addRewardToInventory,
    countEarnedCards
} from './rewards.js';

import {
    STREAK_CARD_REWARD_THRESHOLD,
    PACK_SIZES
} from './config.js';

// Simple test runner
let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passCount++;
    } catch (error) {
        console.error(`❌ FAIL: ${name}`);
        console.error(error);
        failCount++;
    }
}

function expect(actual) {
    return {
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
            }
        },
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, but got ${actual}`);
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected truthy, but got ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected falsy, but got ${actual}`);
            }
        }
    };
}

// Ignore earnedAt timing differences in tests
function sanitizeReward(reward) {
    if (!reward) return reward;
    const { earnedAt, ...rest } = reward;
    return rest;
}

// =============================================================
// TESTS
// =============================================================

console.log('--- Corriendo pruebas de rewards.js ---\n');

test('createPackReward should create a valid pack reward', () => {
    const reward = createPackReward(REWARD_SOURCE.GRADE_PASS, 5);
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.PACK,
        source: REWARD_SOURCE.GRADE_PASS,
        size: 5
    });
});

test('createCardReward should create a valid single card reward', () => {
    const reward = createCardReward(REWARD_SOURCE.STREAK);
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.CARD,
        source: REWARD_SOURCE.STREAK,
        size: 1
    });
});

test('checkStreakReward null when streak is not a multiple of threshold', () => {
    expect(checkStreakReward(1)).toBe(null);
    expect(checkStreakReward(STREAK_CARD_REWARD_THRESHOLD - 1)).toBe(null);
});

test('checkStreakReward returns card reward when streak is a multiple of threshold', () => {
    const reward = checkStreakReward(STREAK_CARD_REWARD_THRESHOLD);
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.CARD,
        source: REWARD_SOURCE.STREAK,
        size: 1
    });

    const reward2 = checkStreakReward(STREAK_CARD_REWARD_THRESHOLD * 2);
    expect(sanitizeReward(reward2)).toEqual({
        type: REWARD_TYPE.CARD,
        source: REWARD_SOURCE.STREAK,
        size: 1
    });
});

test('getGradePassReward returns a pack reward', () => {
    const reward = getGradePassReward(2);
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.PACK,
        source: REWARD_SOURCE.GRADE_PASS,
        size: PACK_SIZES.GRADE_PASS
    });
});

test('getKombatSetWinReward returns a card reward', () => {
    const reward = getKombatSetWinReward();
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.CARD,
        source: REWARD_SOURCE.KOMBAT_SET,
        size: 1
    });
});

test('getKombatMatchWinReward returns a pack reward', () => {
    const reward = getKombatMatchWinReward();
    expect(sanitizeReward(reward)).toEqual({
        type: REWARD_TYPE.PACK,
        source: REWARD_SOURCE.KOMBAT_MATCH,
        size: PACK_SIZES.KOMBAT_MATCH
    });
});

test('isCardUnlockedForGrade correctly evaluates required grades', () => {
    expect(isCardUnlockedForGrade(undefined, 1)).toBeTruthy(); // No minGrade
    expect(isCardUnlockedForGrade(null, 1)).toBeTruthy(); // Null minGrade
    expect(isCardUnlockedForGrade(2, 2)).toBeTruthy(); // Exact match
    expect(isCardUnlockedForGrade(2, 3)).toBeTruthy(); // Higher grade
    expect(isCardUnlockedForGrade(3, 1)).toBeFalsy(); // Lower grade
});

test('filterCardsForGrade returns only unlocked cards', () => {
    const catalog = [
        { id: '1', minGrade: 1 },
        { id: '2', minGrade: 2 },
        { id: '3', minGrade: 3 },
        { id: '4' } // no minGrade
    ];

    const grade1Cards = filterCardsForGrade(catalog, 1);
    expect(grade1Cards.length).toBe(2);
    expect(grade1Cards[0].id).toBe('1');
    expect(grade1Cards[1].id).toBe('4');

    const grade2Cards = filterCardsForGrade(catalog, 2);
    expect(grade2Cards.length).toBe(3);

    const grade3Cards = filterCardsForGrade(catalog, 3);
    expect(grade3Cards.length).toBe(4);
});

test('addRewardToInventory adds reward immutably', () => {
    const inventory = [{ id: 1 }];
    const reward = { id: 2 };

    const newInventory = addRewardToInventory(inventory, reward);

    expect(newInventory.length).toBe(2);
    expect(inventory.length).toBe(1); // Original unchanged
    expect(newInventory[1].id).toBe(2);
});

test('countEarnedCards calculates total sum of cards earned', () => {
    const inventory = [
        { size: 1 },
        { size: 5 },
        { size: 0 },
        { noSizeProperty: true }
    ];

    expect(countEarnedCards(inventory)).toBe(6);
});

console.log(`\n--- Resultados: ${passCount} pasaron, ${failCount} fallaron ---\n`);

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
