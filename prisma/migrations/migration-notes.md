# Database Migration Required

## Changes Made:
- Changed `defenseSystem` (single enum) to `defenseSystems` (array of enums)
- Removed index on `defenseSystem`

## Migration Steps:

1. **Generate the migration:**
   ```bash
   npx prisma migrate dev --name add_multiple_defense_systems
   ```

2. **Apply the migration:**
   The command above will automatically apply it to your development database.

3. **Data Migration (Important!):**
   After running the migration, you'll need to migrate existing data:
   
   ```sql
   -- This will convert single defenseSystem to array defenseSystems
   -- Run this in your database after the schema migration
   UPDATE "Recipe" 
   SET "defenseSystems" = ARRAY["defenseSystem"]::text[]
   WHERE "defenseSystems" IS NULL OR array_length("defenseSystems", 1) IS NULL;
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Rollback (if needed):
If you need to rollback, you can revert the schema changes and run:
```bash
npx prisma migrate dev
```
