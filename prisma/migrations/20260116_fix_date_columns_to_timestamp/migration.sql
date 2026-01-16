-- Migration to convert DATE columns to TIMESTAMP
-- This fixes timezone issues where dates were being stored without time information

-- Convert FoodConsumption.date from DATE to TIMESTAMP
ALTER TABLE "FoodConsumption" 
ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;

-- Convert DailyMenu.date from DATE to TIMESTAMP
ALTER TABLE "DailyMenu" 
ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;

-- Convert DailyProgressScore.date from DATE to TIMESTAMP
ALTER TABLE "DailyProgressScore" 
ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;
