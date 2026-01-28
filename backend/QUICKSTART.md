# KYNDO Backend - Quick Start Guide

## ⚡ 5-Minute Setup (Local)

### Prerequisites Check
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
docker --version # For PostgreSQL + Redis
```

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Keep defaults for local development - they're already configured!

### 3. Start Services
```bash
docker-compose up -d
```

Wait ~10 seconds for PostgreSQL to be ready.

### 4. Setup Database
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 5. Start Backend
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Worker (optional)
npm run worker
```

### 6. Test It!
```bash
# Health check
curl http://localhost:3000/health

# Get a card with presentation
curl http://localhost:3000/api/cards/guacamaya-roja/presentation

# Update a card (admin)
curl -X PATCH http://localhost:3000/api/admin/cards/<CARD_ID> \
  -H "x-admin-key: dev-admin-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"rarity": "epic"}'
```

## 🎮 Available Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm run worker           # Start background worker

# Build & Production
npm run build            # Compile TypeScript
npm start                # Run production build

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations (dev)
npm run seed             # Load sample data

# Utilities
npm run bulk:promote     # Bulk rarity changes
npm run backfill         # Backfill rarity_v2
npm run export:json      # Export to JSON
./scripts/backup_db.sh   # Database backup
```

## 🔑 Default Admin Access

For local development only:

```
Header: x-admin-key
Value: dev-admin-key-change-in-production
```

⚠️ **Change this before deploying to production!**

## 🚀 Deploy to Railway (1 Click)

1. Fork the repository
2. Go to [Railway](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Add PostgreSQL and Redis plugins
5. Set `ADMIN_KEY` environment variable
6. Deploy! 🎉

Railway will:
- Detect and build from Dockerfile
- Set DATABASE_URL automatically
- Deploy on every push to main

## 📱 API Endpoints Quick Reference

### Public
- `GET /health` - Server status
- `GET /api/cards/:cardId/presentation` - Card + presentation rules

### Admin (requires `x-admin-key` header)
- `PATCH /api/admin/cards/:id` - Update card
- `GET /api/admin/queue/stats` - Queue statistics

## 📚 Full Documentation

- [README_BACKEND.md](./README_BACKEND.md) - Complete setup guide
- [README_MIGRATIONS.md](./README_MIGRATIONS.md) - Migration workflows
- [PR_DESCRIPTION.md](./PR_DESCRIPTION.md) - Full PR documentation

## 🐛 Common Issues

### "Port 3000 already in use"
```bash
# Change port in .env
PORT=3001
```

### "Cannot connect to database"
```bash
# Check Docker services
docker-compose ps

# Restart services
docker-compose restart
```

### "Prisma Client not found"
```bash
npm run prisma:generate
```

## 💡 Tips

- Use `npx prisma studio` to browse the database visually
- Check worker logs for thumbnail generation issues
- Run `npm run backfill` to see what would be updated (dry run)
- Use `--help` flag on scripts for more options

## 🎯 Next Steps

1. ✅ Complete this quick start
2. 📖 Read [README_BACKEND.md](./README_BACKEND.md) for deployment details
3. 🔧 Customize presentation rules in the database
4. 🎨 Connect your frontend to the API
5. 🚀 Deploy to staging/production

---

**Questions?** Check the full documentation or open an issue!
