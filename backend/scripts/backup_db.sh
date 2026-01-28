#!/bin/bash

# Database backup script for PostgreSQL
# Usage: ./scripts/backup_db.sh [output_file]

set -e

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL or create a .env file"
    exit 1
fi

# Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
DB_URL=$DATABASE_URL

# Extract connection details
# This is a simplified parser - you might need pg_dump with connection string directly
if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Error: Could not parse DATABASE_URL"
    echo "Expected format: postgresql://user:password@host:port/database"
    exit 1
fi

# Set output file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${1:-backup_${DB_NAME}_${TIMESTAMP}.sql}"

echo "📦 Creating PostgreSQL backup..."
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Output: $OUTPUT_FILE"
echo ""

# Create backup using pg_dump
# Set PGPASSWORD environment variable for authentication
export PGPASSWORD="$DB_PASS"

pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p \
    --no-owner \
    --no-acl \
    -f "$OUTPUT_FILE"

# Unset password
unset PGPASSWORD

# Check if backup was created
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: $OUTPUT_FILE"
    echo "   Size: $FILE_SIZE"
    echo ""
    echo "To restore this backup:"
    echo "   psql -h <host> -U <user> -d <database> -f $OUTPUT_FILE"
else
    echo "❌ Error: Backup file was not created"
    exit 1
fi
