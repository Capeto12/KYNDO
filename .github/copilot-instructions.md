# KYNDO AI Coding Agent Instructions

## Project Overview
KYNDO is a **cognitive card game engine** that converts superficial object recognition into progressive strategic understanding. It's a single engine with multiple game modes (Memory, Battle) and expandable content domains (birds, fauna, transportation).

**Core Philosophy**: Knowledge is earned by playing. Complexity is unlocked progressively, never imposed upfront.

## Architecture Pattern

### Frontend: Modular Vanilla JavaScript (10 Modules)
Location: `frontend/js/`

**Critical separation**: Game Engine (pure logic) vs UI Renderer (DOM manipulation)

```javascript
// CORRECT: Logic in game-engine.js (no DOM access)
export function calculateStreakBonus(streak) {
  return STREAK_BASE_BONUS * (streak - 1);
}

// CORRECT: DOM in ui-renderer.js
export class HUDRenderer {
  updateScore(score) {
    this.elements.score.textContent = score;
  }
}

// WRONG: Mixing concerns
function calculateAndShowScore() {
  const score = computeScore(); // Logic
  document.getElementById('score').textContent = score; // DOM
}
```

**Module Structure**:
- `config.js` - Editable game balance parameters (see `docs/BALANCE_PARAMETERS.md`)
- `game-engine.js` - Pure logic, testable, deterministic
- `ui-renderer.js` - All DOM manipulation lives here
- `game-controller.js` - Orchestrates engine + UI
- `storage.js` - Abstracts LocalStorage (future: backend sync)
- `stats.js` - Tracks achievements, performance analysis
- `error-handler.js` - Centralized error management with custom error classes

### Backend: Express + Prisma + Supabase (PostgreSQL)
Location: `backend/`

**Server-authoritative principle**: Client sends user actions (clicks, selections), never computed values (score, attempts). Server decides truth.

**Start backend**: `cd backend && ./iniciar-backend.sh` (auto-configures Docker, DB, seeds)  
**Database**: Supabase PostgreSQL (connection via `DATABASE_URL` in `.env`)

**Key endpoints**:
- `/api/search` - Card search with Prisma full-text
- `/api/admin/cards/:id` - PATCH to update rarity, triggers thumbnail regeneration via Bull queue
- `/api/cards/:id/presentation` - Returns card with presentation rules (frame color, glow effects)

**Database pattern**: `Card` entities are global and stateless. Player-specific state lives in `player_card_state` (hidden/discovered/unlocked/temporary_owned).

**Supabase Connection**: Configure `DATABASE_URL` in `.env` with your Supabase project credentials:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## Critical Development Workflows

### Starting the Game Locally
```bash
# Frontend only (no build needed)
# Open: frontend/memory/index.html in browser or Live Server

# Backend (required for search, admin features)
cd backend
./iniciar-backend.sh  # Auto-handles Docker, migrations, seeds
npm run dev           # Or start after script completes
```

### Database Operations (Supabase + Prisma)
```bash
cd backend
npm run prisma:generate  # After schema changes
npm run prisma:migrate   # Create and apply migration to Supabase
npm run seed            # Load bird pack data
npx prisma studio       # GUI database browser (connects to Supabase)

# Alternative: Use Supabase Dashboard
# https://supabase.com/dashboard - Table Editor, SQL Editor
```

### Backend Worker (Thumbnail Regeneration)
```bash
cd backend
npm run worker  # Processes Bull queue tasks
```

## Game Balance & Configuration

**NEVER hardcode game values**. All balance parameters live in `frontend/js/config.js`:

```javascript
// CORRECT: Use constants
import { MATCH_BASE_POINTS, STREAK_BASE_BONUS } from './config.js';

// WRONG: Magic numbers
const points = 10 + 5 * streak;
```

Key parameters:
- `ATTEMPT_FACTOR`: 2.2 (max attempts = totalPairs × 2.2)
- `REPEAT_MISS_EXTRA_ATTEMPTS`: 1 (penalty for repeating same error)
- `REPEAT_MISS_POINT_PENALTY`: -2 (score penalty)
- `STREAK_BASE_BONUS`: 5 (bonus per streak step)

See `docs/BALANCE_PARAMETERS.md` for full reference.

## Memory Game Mechanics (Critical Logic)

### Grade Scaling (Nivel 1)
```javascript
// Grado 1: 20 cards (10 pairs) → 5×4 grid → 22 max attempts
// Grado 2: 30 cards (15 pairs) → 6×5 grid → 33 max attempts
// Grado 5: 72 cards (36 pairs) → 9×8 grid → 79 max attempts
```

Grid calculation: `columns = Math.ceil(Math.sqrt(totalCards))`

### Penalty System
When player re-selects a pair they already missed:
1. Add to `missedPairs` Set on first error
2. On subsequent miss of same pair: `attempts += REPEAT_MISS_EXTRA_ATTEMPTS`, `score += REPEAT_MISS_POINT_PENALTY`
3. **First miss has no penalty** (learning opportunity)

### Streak System
Consecutive matches without errors:
- Streak resets to 0 on any miss
- Bonus applies starting at streak ≥ 2: `5 × (streak - 1)` per step
- Example: 3-match streak = 0 + 5 + 10 = 15 bonus points

## Content Creation Pipeline

**Rule**: Each object requires ≥2 visual variants (cognitive requirement, prevents mechanical memorization).

### Adding New Cards
1. Generate images with AI (Replicate, Leonardo.ai, etc.) - see `docs/CONTENT_CREATION_GUIDE.md`
2. Optimize to WebP: `sharp` library in backend
3. Add to `content/pack-1.json`:
```json
{
  "id": "condor-andino",
  "name": "Cóndor Andino",
  "scientific_name": "Vultur gryphus",
  "images": [
    "content/birds/condor-andino-1.webp",
    "content/birds/condor-andino-2.webp"
  ]
}
```
4. Seed database: `npm run seed`

### Prisma Schema Constraints
```prisma
model Card {
  // cardId is slug-based: "guacamaya-roja"
  cardId String @unique
  
  // Rarity determines presentation (frameColor, glowEffect)
  rarity String @default("common")
  
  // Images stored in object_images table (min 2 required)
}
```

## Code Organization Rules

### File Structure Conventions
```
frontend/
  js/              # All JS modules (ES6 imports)
  css/styles.css   # Single CSS file, no preprocessor
  index.html       # Entry point

backend/
  src/
    index.ts       # Express app
    routes/        # Route handlers (search.ts, adminCards.ts)
    controllers/   # Business logic (cardsController.ts)
    worker/        # Bull queue workers
  prisma/
    schema.prisma  # Single source of truth for DB
  scripts/         # One-off tasks (bulk_promote.ts, backfill_rarity_v2.ts)
  seeds/           # Database seed data

docs/              # Extensive technical documentation
  Manual-Maestro.md    # Frozen design decisions (v1.02)
  Manual-Tecnico.md    # Technical architecture
  ARCHITECTURE.md      # Current code flow diagrams
  Esquema-BD.md        # Complete SQL schema with constraints
```

### Import Patterns
```javascript
// CORRECT: Use relative imports with .js extension
import { GRADE_CONFIG } from './config.js';
import { MemoryGameState } from './game-engine.js';

// WRONG: No extension (won't work in browser)
import { GRADE_CONFIG } from './config';
```

### Error Handling Pattern
```javascript
import { errorHandler, ValidationError } from './error-handler.js';

// CORRECT: Use custom error classes
if (!element) {
  throw new ValidationError('Element not found', { element: selector });
}

// CORRECT: Wrap async functions
async function loadData() {
  // Implementation
}
export const safeLoadData = errorHandler.wrapAsync(loadData);
```

## Testing Checklist

When modifying game logic:
1. ✅ Test on mobile viewport (375px width minimum)
2. ✅ Verify castigo por repetición triggers correctly
3. ✅ Test grid scaling at each grado (1-5)
4. ✅ Validate max attempts formula: `Math.ceil(totalPairs × ATTEMPT_FACTOR)`
5. ✅ Check LocalStorage persistence across page reloads
6. ✅ Verify animations don't break on slow devices

## Common Pitfalls

❌ **DON'T**: Modify `docs/Manual-Maestro.md` (frozen design document)  
✅ **DO**: Update `docs/Manual-Tecnico.md` or `docs/ARCHITECTURE.md`

❌ **DON'T**: Send score/attempts/state from client to server  
✅ **DO**: Send only user actions (cardId clicks, run_id context)

❌ **DON'T**: Use `var` or global variables in JavaScript  
✅ **DO**: Use `const`/`let` with ES6 modules

❌ **DON'T**: Hardcode file paths like `/content/birds/...`  
✅ **DO**: Use relative paths or config constants

❌ **DON'T**: Add npm dependencies without strong justification (frontend is vanilla JS by design)  
✅ **DO**: Leverage native browser APIs (Web Storage, Fetch, CSS animations)

## Key Documentation References

Before implementing features, consult:
- `docs/Manual-Maestro.md` - Core design principles (what/why)
- `docs/Manual-Tecnico.md` - Technical architecture (how)
- `docs/GAME_RULES.md` - Game mechanics for humans
- `docs/Esquema-BD.md` - Complete database schema with SQL (Supabase compatible)
- `docs/ARCHITECTURE.md` - Current code execution flow with diagrams
- `CHANGELOG.md` - Recent changes and refactoring history
- Supabase Dashboard - Real-time DB monitoring, logs, SQL editor

## Prisma + Supabase Quick Reference

```bash
# Generate Prisma Client after schema.prisma changes
npx prisma generate

# Create migration (applies to Supabase)
npx prisma migrate dev --name description_of_change

# Apply migrations in production (Supabase)
npx prisma migrate deploy

# Browse database (connects to Supabase)
npx prisma studio

# Direct Supabase SQL (alternative)
# Use Supabase Dashboard > SQL Editor for custom queries
```

## Domain-Specific Context

**Memory Nivel 1** (current): Simple matching with penalties  
**Memory Nivel 2** (planned): Visual variants, board rotations (rows/columns)  
**Memory Nivel 3** (planned): Similar objects mixed, time pressure  
**Battle A/D** (planned): Card comparison using attack/defense factors

**Card Types**:
- **Carta A**: Basic info (always discoverable)
- **Carta B**: Reveals A/D formula + sub-attributes (unlocked via Memory progress)
- **Carta C**: Special abilities, tactical modifiers (high-level unlock)

**Rarity System**: Affects presentation only (frameColor, glowEffect), not gameplay balance

## Performance Considerations

- Grid size limit: ~40px per card minimum (mobile constraint)
- Max practical cards: ~120 (Nivel 3 ceiling)
- Animations use CSS transforms (GPU-accelerated), avoid layout thrashing
- LocalStorage for offline-first, backend sync is future work
- `performance.js` module tracks FPS, memory, timing metrics

## Quick Commands Reference

```bash
# Frontend development (no build)
# Just open: frontend/memory/index.html

# Backend development
cd backend
./iniciar-backend.sh         # One-command setup
npm run dev                  # Start API server
npm run worker               # Start background jobs

# Database (Supabase)
cd backend
npm run prisma:migrate       # Run migrations to Supabase
npm run seed                 # Load sample data
npx prisma studio           # Database GUI (Supabase connection)
# Or use: Supabase Dashboard > Table Editor

# Scripts
cd backend
npm run bulk:promote        # Bulk rarity updates
npm run export:json         # Export DB to JSON
npm run backfill            # Backfill rarity_v2 field
```
