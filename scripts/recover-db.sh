#!/bin/bash

# Database Recovery Options for Wellness Hub
# This script provides multiple options to restore your database

set -e

DB_NAME="wellness_hub"
DB_USER="wellness_user"
DB_PASSWORD="1234567"
DB_HOST="localhost"
DB_PORT="5432"

echo "=================================="
echo "Wellness Hub Database Recovery"
echo "=================================="
echo ""

# Function to check if database exists and has data
check_db_status() {
    echo "📊 Checking current database status..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as user_count FROM \"User\";" 2>/dev/null || echo "Cannot connect to database"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as recipe_count FROM \"Recipe\";" 2>/dev/null || echo "Cannot check recipes"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as progress_count FROM \"Progress\";" 2>/dev/null || echo "Cannot check progress"
    echo ""
}

# Function to list available backups
list_backups() {
    echo "🔍 Searching for database backups..."
    echo ""
    
    # Check common backup locations
    if [ -d "$HOME/backups" ]; then
        echo "Backups in ~/backups:"
        ls -lh "$HOME/backups"/*.dump "$HOME/backups"/*.sql 2>/dev/null || echo "  No backups found"
    fi
    
    if [ -d "/tmp/db_backups" ]; then
        echo "Backups in /tmp/db_backups:"
        ls -lh /tmp/db_backups/*.dump /tmp/db_backups/*.sql 2>/dev/null || echo "  No backups found"
    fi
    
    echo ""
}

# Function to create a backup before any operations
create_backup() {
    BACKUP_DIR="$HOME/wellness-hub-backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/wellness_hub_$(date +%Y%m%d_%H%M%S).dump"
    
    echo "💾 Creating backup of current state..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -Fc -f "$BACKUP_FILE" $DB_NAME
    echo "✅ Backup saved to: $BACKUP_FILE"
    echo ""
}

# Function to restore from a backup file
restore_from_backup() {
    if [ -z "$1" ]; then
        echo "❌ Error: Please provide backup file path"
        echo "Usage: ./recover-db.sh restore /path/to/backup.dump"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "⚠️  This will RESTORE the database from: $BACKUP_FILE"
    echo "⚠️  Current data will be REPLACED"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Restore cancelled"
        exit 0
    fi
    
    echo "🔄 Restoring database..."
    PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c "$BACKUP_FILE"
    echo "✅ Database restored successfully!"
}

# Function to seed the database with sample data
seed_database() {
    echo "🌱 Seeding database with sample data..."
    cd "$(dirname "$0")/.."
    npm run seed
    echo "✅ Database seeded successfully!"
}

# Function to create a test user manually
create_test_user() {
    echo "👤 Creating test user manually..."
    
    read -p "Email (default: test@example.com): " email
    email=${email:-test@example.com}
    
    read -p "Password (default: password123): " password
    password=${password:-password123}
    
    read -p "Name (default: Test User): " name
    name=${name:-Test User}
    
    cd "$(dirname "$0")/.."
    npx tsx <<EOF
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const hashedPassword = await bcrypt.hash('$password', 10);
  
  const user = await prisma.user.create({
    data: {
      email: '$email',
      password: hashedPassword,
      name: '$name',
      subscriptionTier: 'FREE',
      subscriptionStatus: 'active',
      termsAccepted: true,
      privacyAccepted: true,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  
  console.log('✅ User created:', user.email);
  console.log('   ID:', user.id);
  console.log('   Password:', '$password');
}

createUser().then(() => process.exit(0)).catch(console.error);
EOF
    
    echo ""
    echo "✅ Test user created!"
    echo "   Email: $email"
    echo "   Password: $password"
}

# Main menu
case "${1:-menu}" in
    status)
        check_db_status
        ;;
    list)
        list_backups
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_from_backup "$2"
        ;;
    seed)
        seed_database
        ;;
    create-user)
        create_test_user
        ;;
    menu)
        echo "Available commands:"
        echo ""
        echo "  ./recover-db.sh status        - Check current database status"
        echo "  ./recover-db.sh list          - List available backups"
        echo "  ./recover-db.sh backup        - Create backup of current state"
        echo "  ./recover-db.sh restore FILE  - Restore from backup file"
        echo "  ./recover-db.sh seed          - Seed database with sample data"
        echo "  ./recover-db.sh create-user   - Create a test user manually"
        echo ""
        echo "Quick Recovery Options:"
        echo ""
        echo "Option 1: Seed with Sample Data (Recommended)"
        echo "  $ ./recover-db.sh seed"
        echo "  This creates 3 test users and sample recipes"
        echo ""
        echo "Option 2: Create Just One User"
        echo "  $ ./recover-db.sh create-user"
        echo "  Interactive prompt to create a single user"
        echo ""
        echo "Option 3: Restore from Backup"
        echo "  $ ./recover-db.sh list"
        echo "  $ ./recover-db.sh restore /path/to/backup.dump"
        echo ""
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run './recover-db.sh' to see available commands"
        exit 1
        ;;
esac
