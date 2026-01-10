# Database Recovery Guide

## Problem
Your database has **0 users** but your browser session still has a JWT token from a deleted user, causing foreign key constraint errors.

## Quick Solutions

### Option 1: Seed Database with Sample Data (Fastest ⚡)
This creates 3 test users with sample recipes and data:

```bash
npm run db:seed
```

**Test Users Created:**
- `sarah@example.com` - FREE tier, password: `password123`
- `john@example.com` - PREMIUM tier, password: `password123`  
- `emma@example.com` - FAMILY tier, password: `password123`

After seeding:
1. Clear your browser cookies or sign out
2. Sign in with one of the test accounts
3. All features will work immediately

---

### Option 2: Create a Single User (Simple ✨)
Interactive script to create just one user:

```bash
npx tsx scripts/create-user.ts
```

You'll be prompted for:
- Email
- Password
- Name

After creating:
1. Clear browser cookies or sign out
2. Sign in with your new account

---

### Option 3: Restore from Backup (If Available 💾)

Check for backups:
```bash
./scripts/recover-db.sh list
```

Restore from backup:
```bash
./scripts/recover-db.sh restore /path/to/backup.dump
```

Create a backup of current state:
```bash
./scripts/recover-db.sh backup
```

---

## Why Did This Happen?

The database was likely reset during development (maybe you ran migrations or manually cleared data), but your browser cookies still contain a JWT token with the old user ID.

## Preventing This in the Future

### 1. Regular Backups
Create a backup before major changes:

```bash
# Manual backup
pg_dump -U wellness_user -Fc wellness_hub > ~/backups/wellness_hub_$(date +%Y%m%d).dump

# Or use the script
./scripts/recover-db.sh backup
```

### 2. Add to .gitignore
Add to your `.gitignore`:
```
*.dump
*.sql
backups/
```

### 3. Automated Backup Script
Add to your `package.json`:
```json
{
  "scripts": {
    "db:backup": "pg_dump -U wellness_user -Fc wellness_hub > backups/wellness_hub_$(date +%Y%m%d_%H%M%S).dump",
    "db:restore": "pg_restore -U wellness_user -d wellness_hub -c"
  }
}
```

## Additional Commands

Check database status:
```bash
./scripts/recover-db.sh status
```

View all available commands:
```bash
./scripts/recover-db.sh
```

## Need Help?

If you encounter any issues:
1. Check that PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify database exists: `psql -U wellness_user -d wellness_hub -c "\dt"`
3. Check connection: `psql -U wellness_user -d wellness_hub -c "SELECT version();"`

## After Recovery

Once you've restored/seeded the database:

1. **Clear browser data**:
   - Chrome: DevTools (F12) → Application → Cookies → Delete all for localhost:3000
   - Or just sign out in the app

2. **Sign in with new account**

3. **Verify it works**:
   - Visit `/progress` - should load without errors
   - Create a recipe - should work
   - Generate recommendations - should appear

The user validation code I added will now prevent this error from crashing the app in the future!
