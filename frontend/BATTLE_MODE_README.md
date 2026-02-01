# 🎮 Battle Mode Quick Start

## What is Battle Mode?

**Battle** (Kombate) is a card comparison game where you match your deck against an opponent's using **Attack/Defense (A/D) factors**.

- 🎯 Each card has 10 factors (5 attack, 5 defense)
- ⚔️ Compare your attack vs opponent's defense each round
- 💥 Damage = Your Attack - Their Defense
- ❤️ Reduce opponent health to 0 to win

## Play Now

1. Open `battle.html` in your browser
2. Click **🎮 Demo** for a quick example
3. Click **⏭️ Auto-Batalla** to watch the entire battle
4. Or click **⚔️ Siguiente Ronda** for step-by-step play

## How to Use in Your Project

### Import in HTML
```html
<script type="module">
  import { BattleController } from './js/battle-controller.js';

  const controller = new BattleController();
  const battleUI = await controller.initializeBattle(playerDeck, opponentDeck);
  document.getElementById('game').appendChild(battleUI);
</script>
```

### In JavaScript
```javascript
import { BattleGame, BattleCard } from './js/battle-engine.js';

// Create cards with factors (0-10 each)
const card1 = new BattleCard({
  cardId: 'bird-1',
  name: 'Eagle',
  image: 'eagle.png',
  rarity: 'rare',
  attackFactors: { P: 8, S: 7, W: 9, H: 8, A: 6 },
  defenseFactors: { AD: 6, C: 3, E: 7, SD: 4, R: 8 }
});

// Create game
const game = new BattleGame(playerDeck, opponentDeck);

// Play rounds
while (game.status === 'ongoing') {
  const result = game.playRound();
  console.log(result);
}

// Get summary
const summary = game.getSummary();
```

## Card Factors Explained

### Attack (Offensive Capability)
- **P** — Predación (Predation)
- **S** — Velocidad (Speed)
- **W** — Weapons (Offensive anatomy)
- **H** — Hunt Strategy
- **A** — Agresividad (Aggressiveness)

### Defense (Survival Capability)
- **AD** — Adaptabilidad (Adaptability)
- **C** — Camuflaje (Camouflage)
- **E** — Evasión (Evasion)
- **SD** — Social Defense
- **R** — Robustez (Robustness)

## File Structure

```
frontend/
├── battle.html                    ← Main demo page
├── js/
│   ├── battle-engine.js          ← Pure game logic
│   ├── battle-ui.js              ← DOM rendering
│   ├── battle-controller.js      ← Orchestration
│   ├── battle-engine-tests.js   ← Unit tests
│   ├── config.js                 ← A/D weights (tunable)
│   └── ...
└── css/
    └── styles.css                ← Battle mode styling
```

## Configuration

Edit weights in `js/config.js` to balance the game:

```javascript
export const BATTLE_CONFIG = {
  ATTACK_WEIGHTS: {
    P: 0.5,   // Predation importance
    S: 0.4,   // Speed importance
    W: 0.5,   // Weapons importance
    H: 0.3,   // Hunt strategy importance
    A: 0.2    // Aggressiveness importance
  },
  
  DEFENSE_WEIGHTS: {
    AD: 0.4,  // Adaptability importance
    C: 0.3,   // Camouflage importance
    E: 0.4,   // Evasion importance
    SD: 0.2,  // Social defense importance
    R: 0.6    // Robustness importance
  },

  STARTING_HEALTH: 100
};
```

## Testing

Run unit tests in browser console:

```javascript
// Open browser console
// Paste this:
import * as tests from './js/battle-engine-tests.js';
```

Or in Node.js:
```bash
node --input-type=module ./frontend/js/battle-engine-tests.js
```

## Example Game Flow

```
Player Deck: [Card A, Card B, Card C]
Opponent Deck: [Card X, Card Y, Card Z]
Starting Health: 100 each

Round 1:
  Player Card A (ATQ: 45) vs Opponent Card X (DEF: 38)
  → Player deals 7 damage (45 - 38)
  Opponent Card X (ATQ: 52) vs Player Card A (DEF: 35)
  → Opponent deals 17 damage (52 - 35)
  Health: Player 83/100, Opponent 93/100

Round 2:
  Player Card B (ATQ: 38) vs Opponent Card Y (DEF: 40)
  → Player deals 0 damage (38 < 40)
  Opponent Card Y (ATQ: 48) vs Player Card B (DEF: 33)
  → Opponent deals 15 damage (48 - 33)
  Health: Player 68/100, Opponent 93/100

Round 3:
  Player Card C (ATQ: 58) vs Opponent Card Z (DEF: 42)
  → Player deals 16 damage (58 - 42)
  Opponent Card Z (ATQ: 45) vs Player Card C (DEF: 45)
  → Opponent deals 0 damage (45 = 45)
  Health: Player 68/100, Opponent 77/100

...continues until someone reaches 0 health

Winner: Determined by who reaches 0 first
```

## API (Future Backend)

When backend is ready:

```javascript
// Start a battle with matchmaking
POST /api/battles/start
{
  playerDeckIds: ['bird-1', 'bird-2', 'bird-3'],
  opponentType: 'random',  // or playerId
  environment: 'neutral'
}

// Response
{
  battleId: 'battle-123',
  playerDeck: [...],
  opponentDeck: [...]
}

// Play a round
POST /api/battles/battle-123/round
{ selectedCard: 0 }

// Response
{
  roundNumber: 1,
  playerDamage: 12,
  opponentDamage: 8,
  playerHealth: 88,
  opponentHealth: 92,
  status: 'ongoing'
}

// Get battle summary
GET /api/battles/battle-123/summary
{
  winner: 'player',
  totalRounds: 5,
  playerWins: 3,
  draws: 1,
  stats: {...}
}
```

## Rarity Bonuses

| Rarity | Bonus |
|--------|-------|
| Common | 1.0× |
| Uncommon | 1.1× |
| Rare | 1.2× |
| Epic | 1.3× |
| Legendary | 1.5× |

Rare cards get 20% bonus to all factors (capped at 10 max).

## Environment Bonuses

| Environment | Defense Bonus |
|-------------|---------------|
| Neutral | 0% |
| Water | +15% |
| Forest | +10% |
| Mountain | +12% |
| Sky | +8% |

Perfect for creating rock-paper-scissors dynamics!

## Tips for Game Design

1. **Balance:** No card should beat all others
2. **Flavor:** Make factors match card characteristics
3. **Variety:** Mix high-attack and high-defense cards
4. **Progression:** Stronger cards available at higher levels
5. **Environment:** Give cards home-court advantage

## Troubleshooting

**Cards showing 0 attack/defense**
- Check factors are 0-10 range
- Verify weights aren't all zero
- Console: `new BattleCard(...).calculateAttack()`

**Battle not ending**
- Check health is decreasing (inspect game object)
- Verify starting health > 0
- Try `game.autoBattle()` to debug

**Demo button doesn't work**
- Check browser console for errors
- Verify `battle-engine.js` and `battle-controller.js` loaded
- Check file paths in `battle.html`

## Next Steps

1. ✅ Build demo (done)
2. ⏳ Connect to Memory game progression
3. ⏳ Add leaderboard
4. ⏳ Backend integration
5. ⏳ Ranked season battles
6. ⏳ Battle replays & analysis

---

**Questions?** Check `docs/BATTLE_MODE.md` for full documentation.
