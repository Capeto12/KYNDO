# 🔍 KYNDO Search Feature

## Overview

The search feature allows users to search for cards by title or description. It consists of:

1. **Backend API**: RESTful endpoint for searching cards
2. **Frontend UI**: Search interface for users
3. **Database Support**: Schema with indexed fields for efficient search

## Backend API

### Endpoint

```
GET /api/search
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search term to look for in card titles and descriptions |
| `limit` | number | No | 20 | Maximum number of results (max: 100) |

### Example Requests

```bash
# Search for "Guacamaya"
curl "http://localhost:3000/api/search?q=Guacamaya"

# Search with limit
curl "http://localhost:3000/api/search?q=bird&limit=5"

# Search with special characters (URL encoded)
curl "http://localhost:3000/api/search?q=C%C3%B3ndor"
```

### Response Format

**Success (200 OK):**

```json
{
  "query": "Guacamaya",
  "count": 1,
  "results": [
    {
      "id": "abc123...",
      "cardId": "guacamaya-roja",
      "title": "Guacamaya Roja",
      "description": "Colorful parrot native to Central and South America",
      "rarity": "common",
      "imageUrl": "content/birds/img/guacamaya-roja.webp",
      "thumbnailPath": null,
      "packId": "birds"
    }
  ]
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Search term \"q\" is required"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Internal server error during search"
}
```

## Frontend UI

### Location

`/frontend/search.html`

### Features

- **Real-time search**: Results appear as you type (press Enter or click Search)
- **Visual card display**: Shows thumbnails, titles, descriptions, and rarity
- **Responsive design**: Works on mobile and desktop
- **Error handling**: Displays friendly error messages
- **Empty states**: Shows helpful messages when no results found

### Usage

1. Open the search page: `http://localhost:8080/frontend/search.html`
2. Type your search term in the input field
3. Press Enter or click the "Buscar" button
4. Browse the results

## Database Schema

### Card Model

```prisma
model Card {
  id            String   @id @default(cuid())
  cardId        String   @unique
  title         String
  description   String?  // New field for search
  imageUrl      String?
  thumbnailPath String?
  rarity        String   @default("common")
  packId        String   @default("birds")
  // ... other fields
  
  @@index([title]) // Index for search performance
}
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run migrations to add description field
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database with test data
ts-node seeds/seed_dev.ts

# Start backend
npm run dev
```

The backend will start at `http://localhost:3000`

### 2. Frontend Setup

Open the search page in your browser:

```bash
# Using a simple HTTP server
cd frontend
python -m http.server 8080

# Or use Live Server in VS Code
```

Navigate to: `http://localhost:8080/search.html`

## Testing

### Automated Tests

Run the test script:

```bash
cd backend
./test-search.sh
```

### Manual Testing

1. Start the backend: `cd backend && npm run dev`
2. Open the search page: `http://localhost:8080/frontend/search.html`
3. Try these searches:
   - "Guacamaya" - Should find the red macaw
   - "Cóndor" - Should find the Andean condor
   - "bird" - Should find cards with "bird" in description
   - "xyz123" - Should show no results
   - "" (empty) - Should show error message

## Implementation Notes

### Search Algorithm

The current implementation uses **case-insensitive partial matching** on:
- Card `title` field
- Card `description` field

Results are ordered by title alphabetically.

### Future Enhancements

Based on the documentation in `/docs/LOCALIZATION.md`, the search could be enhanced with:

1. **Multi-language support**: Search across different languages
2. **Scientific names**: Include scientific names in search
3. **Relevance scoring**: Rank results by relevance (exact match > partial match)
4. **Filters**: Filter by rarity, pack, or other attributes
5. **Autocomplete**: Suggest searches as user types
6. **Full-text search**: Use PostgreSQL full-text search for better performance

### Performance

- Database index on `title` field ensures fast searches
- Limit parameter prevents excessive data transfer
- Case-insensitive search works with SQLite and PostgreSQL

## Configuration

### Backend Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kyndo"
PORT=3000
NODE_ENV=development
```

### Frontend Configuration

In `/frontend/search.html`, update the API URL if needed:

```javascript
const API_BASE_URL = 'http://localhost:3000';
```

## Troubleshooting

### Backend not responding

1. Check if backend is running: `curl http://localhost:3000/health`
2. Check backend logs for errors
3. Verify DATABASE_URL is correct

### No results found

1. Check if database has been seeded: `ts-node seeds/seed_dev.ts`
2. Verify search term spelling
3. Check backend logs for search errors

### CORS errors

The backend uses `cors` middleware to allow cross-origin requests. If you encounter CORS errors, verify:

1. Backend includes `app.use(cors())`
2. Frontend uses correct API URL
3. Browser allows cross-origin requests

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search cards by title/description |
| GET | `/api/cards/:id/presentation` | Get card presentation details |
| GET | `/health` | Health check endpoint |

## Contributing

When enhancing the search feature:

1. Update this README with new functionality
2. Add tests in `test-search.sh`
3. Update the database schema if needed
4. Document any new query parameters
5. Maintain backwards compatibility

## License

Part of the KYNDO project.
