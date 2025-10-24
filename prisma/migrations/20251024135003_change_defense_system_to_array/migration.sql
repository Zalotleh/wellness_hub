-- Check and add defenseSystems column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Recipe' AND column_name='defenseSystems') THEN
        ALTER TABLE "Recipe" ADD COLUMN "defenseSystems" "DefenseSystem"[];
    END IF;
END $$;

-- Data Migration: Convert existing single values to arrays (only if defenseSystems is empty)
UPDATE "Recipe" 
SET "defenseSystems" = ARRAY["defenseSystem"]
WHERE "defenseSystems" IS NULL OR array_length("defenseSystems", 1) IS NULL;

-- Drop old index if it exists
DROP INDEX IF EXISTS "Recipe_defenseSystem_idx";

-- Drop old column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='Recipe' AND column_name='defenseSystem') THEN
        ALTER TABLE "Recipe" DROP COLUMN "defenseSystem";
    END IF;
END $$;

-- CreateIndex: Add index for array column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Recipe_defenseSystems_idx') THEN
        CREATE INDEX "Recipe_defenseSystems_idx" ON "Recipe" USING GIN ("defenseSystems");
    END IF;
END $$;