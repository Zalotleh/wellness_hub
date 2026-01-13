-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "mealType" TEXT,
ADD COLUMN     "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[];
