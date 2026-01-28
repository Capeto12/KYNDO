# Database Migrations Guide

## 📋 Overview

This guide covers database migrations, backfills, and data consistency operations for KYNDO backend.

## 🔄 Migration Workflow

### Standard Migration Process

1. **Backup Database** (Always do this first!)
   ```bash
   ./scripts/backup_db.sh backup_before_migration.sql
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_new_feature
   ```

3. **Test Migration** (in development)
   ```bash
   # Apply migration
   npm run prisma:migrate
   
   # Verify database state
   npx prisma studio
   ```

4. **Deploy to Production**
   ```bash
   npm run prisma:migrate:deploy
   ```

5. **Verify Migration**
   ```bash
   # Check migration status
   npx prisma migrate status
   ```

## 📦 Adding rarity_v2 Field (Example Migration)

This is a reference migration for adding a new field gradually.

### Step 1: Apply Schema Changes

```bash
# Run the rarity_v2 migration SQL
psql $DATABASE_URL < prisma/migrations/add_rarity_v2.sql
```

Or let Prisma generate it:

```bash
# Update schema.prisma first, then:
npx prisma migrate dev --name add_rarity_v2
```

### Step 2: Backfill Existing Data

```bash
# Preview changes
npm run backfill

# Execute backfill
npm run backfill -- --execute
```

### Step 3: Verify Data Consistency

```sql
-- Check for any cards without rarity_v2
SELECT COUNT(*) FROM cards WHERE rarity_v2 IS NULL;

-- Verify rarity_v2 matches rarity (should return 0 if correct)
SELECT COUNT(*) FROM cards WHERE rarity != rarity_v2;
```

### Step 4: Monitor & Rollback Plan

If issues arise:

```bash
# Restore from backup
psql $DATABASE_URL < backup_before_migration.sql

# Or manually revert
ALTER TABLE cards DROP COLUMN rarity_v2;
```

## 🚀 Bulk Operations

### Bulk Rarity Promotion

Promote cards from one rarity to another:

```bash
# 1. Preview changes
npm run bulk:promote -- --from common --to rare --dry-run

# 2. Review output and confirm

# 3. Execute promotion
npm run bulk:promote -- --from common --to rare --execute --batch-size 100

# 4. Monitor worker queue
curl http://localhost:3000/api/admin/queue/stats \
  -H "x-admin-key: $ADMIN_KEY"
```

### Data Export for Migration

Export data before major changes:

```bash
# Export all tables to JSON
npm run export:json -- --output ./pre-migration-export

# Verify exports
ls -lh ./pre-migration-export/
```

## 🔍 Pre-Migration Checklist

Before applying any migration to production:

- [ ] **Backup created** and verified
- [ ] **Migration tested** in staging environment
- [ ] **Rollback plan** documented
- [ ] **Downtime estimated** (if any)
- [ ] **Team notified** of maintenance window
- [ ] **Worker stopped** (if needed for data consistency)
- [ ] **Test data** available for post-migration verification
- [ ] **Monitoring** in place to catch issues

## 🛡️ Safe Migration Practices

### 1. Always Use Transactions

For manual SQL migrations:

```sql
BEGIN;

-- Your migration statements here
ALTER TABLE cards ADD COLUMN new_field VARCHAR(100);

-- Verify changes
SELECT COUNT(*) FROM cards;

-- Only commit if everything looks good
COMMIT;
-- Or ROLLBACK if issues found
```

### 2. Idempotent Migrations

Always make migrations safe to run multiple times:

```sql
-- Good: Idempotent
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS rarity_v2 VARCHAR(64);

-- Bad: Not idempotent (fails if column exists)
ALTER TABLE cards 
ADD COLUMN rarity_v2 VARCHAR(64);
```

### 3. Batch Processing

For large datasets, process in batches:

```typescript
// Good: Batched processing
const batchSize = 100;
for (let i = 0; i < total; i += batchSize) {
  await processBatch(i, batchSize);
}

// Bad: Process all at once (can timeout/lock)
await processAll();
```

### 4. Zero-Downtime Migrations

For production systems:

1. **Add new column** (nullable)
2. **Deploy new code** that writes to both old and new columns
3. **Backfill old data** in batches
4. **Verify data consistency**
5. **Deploy new code** that only uses new column
6. **Remove old column** (after confirming everything works)

## 📊 Common Migration Scenarios

### Adding a New Field

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_featured_flag

# 3. Backfill with default values if needed
# (Create custom script similar to backfill_rarity_v2.ts)
```

### Changing Field Type

```sql
-- Example: Change rarity from VARCHAR(32) to VARCHAR(64)
BEGIN;

-- Add new column
ALTER TABLE cards ADD COLUMN rarity_new VARCHAR(64);

-- Copy data
UPDATE cards SET rarity_new = rarity;

-- Verify
SELECT COUNT(*) FROM cards WHERE rarity != rarity_new;

-- Swap columns
ALTER TABLE cards DROP COLUMN rarity;
ALTER TABLE cards RENAME COLUMN rarity_new TO rarity;

COMMIT;
```

### Adding Indexes

```sql
-- Create index concurrently (no table lock in PostgreSQL)
CREATE INDEX CONCURRENTLY idx_cards_pack_rarity 
ON cards(pack_id, rarity);
```

### Removing a Field

```bash
# 1. Deploy code that doesn't use the field
# 2. Monitor for 24-48 hours
# 3. If no issues, remove column

# Update schema.prisma (remove field)
npx prisma migrate dev --name remove_unused_field
```

## 🔧 Migration Scripts Reference

### backup_db.sh

Creates PostgreSQL dump:

```bash
# Default: timestamped backup
./scripts/backup_db.sh

# Custom filename
./scripts/backup_db.sh my_backup.sql

# Restore
psql $DATABASE_URL < my_backup.sql
```

### backfill_rarity_v2.ts

Idempotent backfill script:

```bash
# Check what will be updated
npm run backfill

# Execute backfill
npm run backfill -- --execute
```

Key features:
- Idempotent (safe to run multiple times)
- Batch processing
- Progress reporting
- Audit logging

### bulk_promote.ts

Bulk rarity promotion:

```bash
# Preview
npm run bulk:promote -- --from common --to rare --dry-run

# Execute with custom batch size
npm run bulk:promote -- \
  --from rare --to epic \
  --execute \
  --batch-size 50
```

Options:
- `--from <rarity>`: Source rarity
- `--to <rarity>`: Target rarity
- `--batch-size <n>`: Cards per batch (default: 50)
- `--dry-run`: Preview only (default)
- `--execute`: Actually perform the promotion

### export_sqlite_to_json.ts

Export database to JSON:

```bash
# Default output
npm run export:json

# Custom output directory
npm run export:json -- --output ./exports
```

Exports:
- `cards.json`
- `presentation_rules.json`
- `assets.json`
- `audit_logs.json` (last 1000)
- `export_summary.json`

## 🚨 Rollback Procedures

### Immediate Rollback

If migration fails during application:

```bash
# 1. Stop services
docker-compose down

# 2. Restore from backup
psql $DATABASE_URL < backup_before_migration.sql

# 3. Restart with old code
git checkout previous-version
docker-compose up -d
```

### Gradual Rollback

If issues discovered after deployment:

1. **Revert application code** to previous version
2. **Keep database changes** (if backward compatible)
3. **Monitor for issues**
4. **Plan proper rollback** if needed

## 📝 Migration Log Template

Keep a log of all production migrations:

```markdown
## Migration: Add rarity_v2 field
**Date**: 2024-01-28
**Applied By**: DevOps Team
**Duration**: 15 minutes

### Pre-Migration
- Backup: `backup_20240128_143000.sql` (125 MB)
- Cards count: 1,247
- Worker: Stopped

### Migration Steps
1. ✅ Applied `add_rarity_v2.sql`
2. ✅ Ran backfill script (1,247 cards updated)
3. ✅ Verified data consistency
4. ✅ Restarted worker

### Post-Migration
- All cards have rarity_v2 populated
- No errors in application logs
- Worker processing jobs normally

### Issues/Notes
- None
```

## 🔄 Continuous Monitoring

After any migration:

```bash
# Monitor error logs
tail -f logs/application.log

# Check queue health
curl http://localhost:3000/api/admin/queue/stats

# Monitor database performance
psql $DATABASE_URL -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
"
```

## 📚 Additional Resources

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Migrations](https://stripe.com/blog/online-migrations)
- Main README: [README_BACKEND.md](./README_BACKEND.md)
