-- AlterTable: Add slot column to Meal table
-- This allows meals to remember where they were placed (breakfast/lunch/dinner/snack section)
-- even if their mealType is different (e.g., a snack placed in breakfast section)

ALTER TABLE "Meal" ADD COLUMN "slot" TEXT;

-- Backfill existing meals: set slot = mealType for backward compatibility
UPDATE "Meal" SET "slot" = "mealType" WHERE "slot" IS NULL;
