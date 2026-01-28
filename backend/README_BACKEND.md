# KYNDO Backend - Setup & Deployment Guide

## 📋 Overview

This is the KYNDO backend API, built with Node.js, TypeScript, Express, Prisma, and Bull queue. It provides:

- 🎴 **Card Management API** - Admin endpoints to manage cards and rarities
- 🎨 **Presentation Rules** - Dynamic card styling based on rarity
- 🔄 **Background Workers** - Thumbnail regeneration using Sharp
- 📊 **Audit Logging** - Complete tracking of all changes
- 📦 **Migration Scripts** - Tools for data backfill and bulk operations

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 15+ (or Docker)
- Redis (optional, for production queues)
- npm >= 9.0.0

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kyndo?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
ADMIN_KEY="your-secret-admin-key"
UPLOADS_DIR="./uploads"
THUMBNAILS_DIR="./uploads/thumbnails"
```

### 3. Start Database (Docker)

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

### 4. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Or for production deployments
npm run prisma:migrate:deploy
```

### 5. Seed Development Data

```bash
npm run seed
```

This will create:
- 5 sample bird cards (various rarities)
- 4 presentation rules (common, rare, epic, legendary)
- Initial audit log entry

### 6. Start the API Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3000`

### 7. Start the Worker (Optional)

In a separate terminal:

```bash
npm run worker
```

## 📡 API Endpoints

### Public Endpoints

#### Get Card with Presentation
```bash
GET /api/cards/:cardId/presentation

# Example
curl http://localhost:3000/api/cards/guacamaya-roja/presentation
```

#### Health Check
```bash
GET /health

curl http://localhost:3000/health
```

### Admin Endpoints (Require `x-admin-key` header)

#### Update Card
```bash
PATCH /api/admin/cards/:id
Headers: x-admin-key: your-secret-admin-key
Body: {
  "rarity": "epic",
  "title": "Updated Title",
  "metadata": { "key": "value" }
}

# Example with curl
curl -X PATCH http://localhost:3000/api/admin/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -H "x-admin-key: dev-admin-key-change-in-production" \
  -d '{"rarity": "epic"}'
```

#### Queue Statistics
```bash
GET /api/admin/queue/stats
Headers: x-admin-key: your-secret-admin-key

curl http://localhost:3000/api/admin/queue/stats \
  -H "x-admin-key: dev-admin-key-change-in-production"
```

## 🛠️ Utility Scripts

### Bulk Promote Cards
Promote all cards from one rarity to another:

```bash
# Dry run (preview)
npm run bulk:promote -- --from common --to rare --dry-run

# Execute
npm run bulk:promote -- --from common --to rare --execute
```

### Backfill rarity_v2 Field
Idempotent script to populate `rarity_v2` from `rarity`:

```bash
# Dry run
npm run backfill

# Execute
npm run backfill -- --execute
```

### Export Database to JSON
Export all tables for migration:

```bash
npm run export:json -- --output ./migration-data
```

### Backup Database
Create PostgreSQL dump:

```bash
./scripts/backup_db.sh [output_file]
```

## 🚢 Deployment to Railway

### 1. Create New Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Connect your GitHub repository

### 2. Configure Environment Variables

In Railway dashboard, add:

```
DATABASE_URL=<provided by Railway PostgreSQL>
REDIS_URL=<optional: add Redis plugin>
PORT=3000
NODE_ENV=production
ADMIN_KEY=<generate strong key>
UPLOADS_DIR=/app/uploads
THUMBNAILS_DIR=/app/uploads/thumbnails
```

### 3. Add PostgreSQL Service

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically set `DATABASE_URL`

### 4. Add Redis Service (Optional)

1. Click "New" → "Database" → "Add Redis"
2. Railway will set `REDIS_URL`

### 5. Deploy

Railway will automatically:
1. Detect `Dockerfile` and build the image
2. Run migrations (add to Railway's deploy script)
3. Start the application

### 6. Run Post-Deploy Commands

In Railway's terminal or locally:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run seed
```

### 7. Start Worker

Create a separate Railway service for the worker:
1. Same repo, different start command: `npm run worker`
2. Share same environment variables

## 🚢 Deployment to Render

### 1. Create New Web Service

1. Go to [Render](https://render.com/)
2. Click "New +" → "Web Service"
3. Connect GitHub repository

### 2. Configure Build Settings

- **Build Command**: `cd backend && npm install && npm run build && npx prisma generate`
- **Start Command**: `cd backend && npx prisma migrate deploy && npm start`
- **Environment**: Node

### 3. Add Environment Variables

```
DATABASE_URL=<external PostgreSQL URL>
REDIS_URL=<optional: use external Redis>
PORT=3000
NODE_ENV=production
ADMIN_KEY=<generate strong key>
UPLOADS_DIR=/opt/render/project/src/uploads
THUMBNAILS_DIR=/opt/render/project/src/uploads/thumbnails
```

### 4. Add PostgreSQL Database

1. Create new PostgreSQL instance in Render
2. Copy connection string to `DATABASE_URL`

### 5. Deploy

Render will automatically deploy on push to main branch.

### 6. Create Background Worker

1. Create new "Background Worker" service
2. Same repo
3. **Start Command**: `cd backend && npm run worker`
4. Use same environment variables

## 📦 Docker Deployment

### Build Image

```bash
docker build -t kyndo-backend .
```

### Run Container

```bash
docker run -d \
  --name kyndo-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e ADMIN_KEY="your-key" \
  kyndo-backend
```

### Full Stack with Docker Compose

```bash
docker-compose up -d
```

## 🔒 Security Notes

⚠️ **IMPORTANT for Production:**

1. **Replace ADMIN_KEY**: Never use the default development key in production
2. **Use HTTPS**: Always deploy behind HTTPS (Railway/Render provide this)
3. **Environment Variables**: Never commit `.env` files to git
4. **Database Credentials**: Use managed database services with strong passwords
5. **Redis Security**: Use password-protected Redis in production
6. **File Uploads**: 
   - Use S3 or similar for production file storage
   - Current implementation uses local filesystem (not suitable for multi-instance deployments)
7. **Admin Auth**: Replace `ADMIN_KEY` header with proper JWT/OAuth before production

### Recommended Production Improvements

- [ ] Implement JWT-based authentication
- [ ] Add rate limiting (use `express-rate-limit`)
- [ ] Use S3/CloudFront for file storage and CDN
- [ ] Add request logging with proper log management
- [ ] Implement proper error tracking (Sentry, etc.)
- [ ] Add health check monitoring
- [ ] Configure CORS properly for your frontend domain
- [ ] Use managed Redis (Redis Labs, AWS ElastiCache)

## 🐛 Troubleshooting

### Prisma Client not generated

```bash
npm run prisma:generate
```

### Migration fails

```bash
# Reset database (development only!)
npx prisma migrate reset

# Or manually run migrations
npx prisma migrate deploy
```

### Worker not processing jobs

1. Check Redis connection: `redis-cli ping`
2. Check worker logs for errors
3. Verify `REDIS_URL` environment variable

### Port already in use

```bash
# Change PORT in .env
PORT=3001
```

### Database connection issues

1. Verify PostgreSQL is running: `docker-compose ps`
2. Check `DATABASE_URL` format
3. Test connection: `psql $DATABASE_URL`

## 📚 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
├── src/
│   ├── index.ts               # Express app entry point
│   ├── prismaClient.ts        # Prisma client instance
│   ├── queue.ts               # Bull queue wrapper
│   ├── controllers/
│   │   └── cardsController.ts # Card endpoints logic
│   ├── routes/
│   │   └── adminCards.ts      # Admin routes
│   └── worker/
│       └── thumbnailWorker.ts # Background job processor
├── scripts/
│   ├── bulk_promote.ts        # Bulk rarity promotion
│   ├── backfill_rarity_v2.ts  # Rarity backfill
│   ├── export_sqlite_to_json.ts # Data export
│   └── backup_db.sh           # Database backup
├── seeds/
│   ├── pack-1.json            # Sample card data
│   └── seed_dev.ts            # Seed script
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🤝 Contributing

See main repository CONTRIBUTING.md for guidelines.

## 📄 License

See main repository LICENSE file.
