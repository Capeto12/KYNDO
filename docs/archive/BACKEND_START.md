# 🚀 Backend Quick Start

## Automated Setup (Recommended)

Run the startup script that handles everything automatically:

```bash
cd backend
./iniciar-backend.sh
```

This will:
- ✅ Check Docker installation
- ✅ Create `.env` file if needed
- ✅ Install npm dependencies
- ✅ Start PostgreSQL and Redis
- ✅ Setup database with migrations
- ✅ Load sample data
- ✅ Start the API server

## Test the Backend

Once running, test these endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get a card with presentation
curl http://localhost:3000/api/cards/guacamaya-roja/presentation
```

## Stop the Backend

1. Press `Ctrl+C` to stop the server
2. Stop Docker services:
   ```bash
   cd backend
   docker compose down
   ```

## Manual Setup

If you prefer step-by-step:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start Docker services
docker compose up -d

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 5. Start API server
npm run dev
```

## More Information

- **Spanish Guide**: [backend/COMO_INICIAR.md](backend/COMO_INICIAR.md)
- **Complete Documentation**: [backend/README_BACKEND.md](backend/README_BACKEND.md)
- **Quick Start Guide**: [backend/QUICKSTART.md](backend/QUICKSTART.md)

## Common Commands

```bash
# Start worker (optional, for background jobs)
npm run worker

# View database in browser
npx prisma studio

# Check Docker services
docker compose ps
```

## API Endpoints

- `GET /health` - Server status
- `GET /api/cards/:cardId/presentation` - Get card with presentation rules

### Admin Endpoints (require `x-admin-key` header)

- `PATCH /api/admin/cards/:id` - Update card
- `GET /api/admin/queue/stats` - Queue statistics

Default admin key for development: `dev-admin-key-change-in-production`

---

**Need Help?** Check the detailed guides in the `backend/` directory or open an issue.
