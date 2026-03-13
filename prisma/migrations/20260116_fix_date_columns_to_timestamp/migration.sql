-- Migration to convert DATE columns to TIMESTAMP
-- This fixes timezone issues where dates were being stored without time information
-- Guards added for fresh databases where these tables may not exist yet

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FoodConsumption' AND column_name = 'date' AND data_type = 'date') THEN
    ALTER TABLE "FoodConsumption" ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DailyMenu' AND column_name = 'date' AND data_type = 'date') THEN
    ALTER TABLE "DailyMenu" ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DailyProgressScore' AND column_name = 'date' AND data_type = 'date') THEN
    ALTER TABLE "DailyProgressScore" ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::TIMESTAMP;
  END IF;
END $$;
