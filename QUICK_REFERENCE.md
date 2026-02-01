# KYNDO - Quick Reference Guide

## 🎮 The Game (WORKING ✅)

**Play locally:**
```bash
# Open in browser:
file:///C:/Users/Carlos/Desktop/KYNDO/frontend/index.html

# Or use Live Server extension in VS Code
```

**What works:**
- Memory game with 5 difficulty levels
- Smooth card animations (flip, match, fail states)
- Score system with streak bonuses
- Penalty system for repeated errors
- Progress saves to localStorage
- Fully responsive (mobile to desktop)

**Game Rules:**
- Match pairs of identical birds
- Each level has more cards (20→30→45→60→72)
- Limited attempts (based on number of pairs)
- Streak bonus: +5 points per consecutive match
- Repeat error penalty: -2 points, +1 extra attempt

---

## 🔧 Backend Status (WAITING ⏳)

**Current Blocker:** Supabase maintenance (Jan 26 - Feb 2, 2026)

**When it comes back online:**
```bash
cd backend

# 1. Create database tables
npx prisma migrate deploy

# 2. Load bird card data
npm run seed

# 3. Start API server (port 3000)
npm run dev
```

**API Endpoints (Not yet live):**
- `GET /api/search?q=bird&limit=50` - Search cards
- `PATCH /api/admin/cards/:id` - Update rarity
- `GET /api/cards/:id/presentation` - Get visual rules

---

## 📁 Project Structure

```
KYNDO/
├── frontend/                    # Game UI (vanilla JS)
│   ├── index.html              # Main game board
│   ├── styles.css              # Game styling (755 lines)
│   ├── search.html             # Search interface
│   └── js/                      # Game modules
│
├── backend/                     # API server (Express + Prisma)
│   ├── src/index.ts            # Server entry point
│   ├── prisma/schema.prisma    # Database schema
│   ├── seeds/seed_dev.ts       # Load bird data
│   └── .env                    # Database credentials
│
├── docs/                        # Extensive documentation
├── index.html                   # Main menu
├── PROJECT_STATUS.md            # This project status
└── README.md                    # Getting started
```

---

## 🎨 Design System

**Colors:**
- Primary gradient: #667eea → #764ba2 (purple/blue)
- Card gray: #bdbdbd
- Text: #333 (dark gray)
- Accent: #ff9800 (orange for scores)
- Background: Light gradient #f5f7fa → #c3cfe2

**Typography:**
- Font: Poppins (sans-serif)
- Body: 14px
- Heading: clamp(48px, 10vw, 64px)
- Card text: clamp(8px, 2.5vw, 14px)

**Animations:**
- Card reveal: 200ms (scale 0.95 → 1)
- Card match: 300ms (scale pulse 1 → 1.05 → 0.96)
- Overlay: 200-250ms fade + zoom

---

## 🔑 Key Files to Know

### Frontend
- **index.html** (496 lines)
  - Game board, all game logic
  - Handles card clicks, state management
  - Manages overlays and result screens

- **styles.css** (755 lines)
  - Light theme, fully responsive
  - Card states: hidden, revealed, pending, matched
  - All animations and transitions

### Backend
- **schema.prisma** (68 lines)
  - Card model (bird data, images, rarity)
  - PresentationRule (visual per rarity)
  - Asset (file management)
  - AuditLog (change tracking)

- **seed_dev.ts**
  - Loads bird card data from pack-1.json
  - Creates presentation rules per rarity

---

## 🚀 How to Run (Current State)

### Frontend Only (Works Now ✅)
```bash
# Option 1: Direct file
Open: C:\Users\Carlos\Desktop\KYNDO\frontend\index.html

# Option 2: Live Server (VS Code)
Right-click index.html → "Open with Live Server"

# Option 3: Python server
python -m http.server 8000
# Then open: http://localhost:8000/frontend/
```

### Backend (Waiting for Feb 2)
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start server (after DB is online)
```

---

## 🐛 Common Issues & Fixes

### "Cards are tiny squares"
❌ Wrong CSS  
✅ Solution: Check `styles.css` has `.card.hidden`, `.card.revealed`, `.card.pending`

### "Cards don't flip"
❌ Missing event listeners  
✅ Solution: Check HTML has click handlers on cards

### "Backend port 3000 in use"
❌ Another process using port  
✅ Solution:
```powershell
Get-Process node | Stop-Process -Force
```

### "Database connection failed"
❌ Supabase down or credentials wrong  
✅ Solution:
- Check .env has correct credentials
- Verify Supabase project is online
- Check network connection

---

## 📊 Game Balance (Tunable)

Edit `frontend/js/config.js`:
```javascript
STREAK_BASE_BONUS = 5;              // Points per streak
REPEAT_MISS_EXTRA_ATTEMPTS = 1;     // Penalty attempts
REPEAT_MISS_POINT_PENALTY = 2;      // Penalty points
ATTEMPT_FACTOR = 2.2;               // Difficulty factor
```

---

## 🎯 Recent Changes (Jan 26 - Feb 1)

1. ✅ **CSS Crisis Fixed**
   - Restored original theme
   - Verified all card states
   - Confirmed animations working

2. ✅ **Frontend Stabilized**
   - Game fully functional
   - Responsive design verified
   - No CSS variable contamination

3. ⏳ **Backend Waiting**
   - Supabase maintenance blocking
   - Code ready, migrations prepared
   - Will deploy Feb 2+

---

## 📞 Contact & Support

- **Issues**: Check PROJECT_STATUS.md
- **CSS Help**: See CSS_SAFE_CHANGES.md
- **Game Logic**: Review index.html comments
- **Database**: See backend/prisma/schema.prisma

---

## ✅ Checklist Before Launch

- [ ] Supabase maintenance complete
- [ ] Database migrations executed
- [ ] Seed data loaded
- [ ] Backend API running on port 3000
- [ ] Frontend search connected to API
- [ ] All card images display correctly
- [ ] Mobile responsiveness tested
- [ ] Browser console has no errors
- [ ] Deployment configured

---

**Last Update:** February 1, 2026  
**Version:** 1.0.0 (MVP Ready)  
**Status:** 🟡 Awaiting Backend (Frontend Stable ✅)
