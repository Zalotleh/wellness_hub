#!/bin/bash

# Database backup script
# Creates a timestamped backup of the PostgreSQL database

# Get database URL from .env file
if [ -f .env ]; then
  export $(cat .env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in .env file"
  exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/db_backup_${TIMESTAMP}.sql"

echo "📦 Creating database backup..."
echo "Backup file: $BACKUP_FILE"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASSWORD="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
  
  # Remove query parameters from DB_NAME if present
  DB_NAME="${DB_NAME%%\?*}"
  
  echo "Database: $DB_NAME"
  echo "Host: $DB_HOST"
  echo "Port: $DB_PORT"
  
  # Export password for pg_dump
  export PGPASSWORD="$DB_PASSWORD"
  
  # Create backup using pg_dump
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "📊 Size: $SIZE"
    echo "📁 Location: $BACKUP_FILE"
    
    # List all backups
    echo ""
    echo "📋 All backups:"
    ls -lh backups/
  else
    echo "❌ Backup failed!"
    exit 1
  fi
  
  # Unset password
  unset PGPASSWORD
else
  echo "❌ Could not parse DATABASE_URL"
  exit 1
fi
