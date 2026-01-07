/**
 * Progress Data Migration Script
 * 
 * Migrates existing Progress entries to the new FoodConsumption model.
 * This script should be run AFTER the new schema is deployed.
 * 
 * Migration Strategy:
 * 1. Read all non-deprecated Progress entries
 * 2. For each entry, create FoodConsumption and FoodItem records
 * 3. Map foods to defense systems using food database
 * 4. Mark original Progress entry as deprecated
 * 5. Link to new FoodConsumption entry
 */

import { PrismaClient, DefenseSystem, MealTime, ConsumptionSource, BenefitStrength } from '@prisma/client';

const prisma = new PrismaClient();

interface ProgressEntry {
  id: string;
  userId: string;
  date: Date;
  defenseSystem: DefenseSystem;
  foodsConsumed: string[];
  count: number;
  notes: string | null;
}

async function main() {
  console.log('🔄 Starting Progress data migration...');
  console.log('');

  // Get all non-deprecated progress entries
  const progressEntries = await prisma.progress.findMany({
    where: {
      deprecated: false,
    },
    orderBy: {
      date: 'desc',
    },
  });

  console.log(`📊 Found ${progressEntries.length} progress entries to migrate`);
  console.log('');

  if (progressEntries.length === 0) {
    console.log('✅ No entries to migrate!');
    return;
  }

  // Load food database for lookups
  const foodDatabase = await prisma.foodDatabase.findMany();
  console.log(`📚 Loaded ${foodDatabase.length} foods from database`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const entry of progressEntries) {
    try {
      const foods = entry.foodsConsumed as string[];
      
      console.log(`   Migrating: ${entry.date.toISOString().split('T')[0]} - ${entry.defenseSystem} (${foods.length} foods)`);

      // Create FoodConsumption entry
      const newEntry = await prisma.foodConsumption.create({
        data: {
          userId: entry.userId,
          date: entry.date,
          mealTime: MealTime.CUSTOM, // Unknown - mark as custom
          sourceType: ConsumptionSource.MANUAL,
          notes: entry.notes || undefined,
          servings: 1,

          foodItems: {
            create: foods.map(foodName => {
              // Try to find food in database
              const foodEntry = foodDatabase.find(
                food =>
                  food.name.toLowerCase() === foodName.toLowerCase() ||
                  foodName.toLowerCase().includes(food.name.toLowerCase())
              );

              if (foodEntry) {
                // Use database mapping
                const systemBenefits = foodEntry.systemBenefits as Record<string, string>;
                const systems = Object.entries(systemBenefits).map(([system, strength]) => ({
                  defenseSystem: system as DefenseSystem,
                  strength: strength as BenefitStrength,
                }));

                return {
                  name: foodName,
                  defenseSystems: {
                    create: systems,
                  },
                };
              } else {
                // Food not in database, use original system
                return {
                  name: foodName,
                  defenseSystems: {
                    create: {
                      defenseSystem: entry.defenseSystem,
                      strength: BenefitStrength.MEDIUM,
                    },
                  },
                };
              }
            }),
          },
        },
      });

      // Mark old entry as deprecated and link to new one
      await prisma.progress.update({
        where: { id: entry.id },
        data: {
          deprecated: true,
          migratedTo: newEntry.id,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${entry.id}:`, error);
      errorCount++;
      errors.push({
        id: entry.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('Migration Summary');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`❌ Failed to migrate: ${errorCount}`);
  console.log('');

  if (errors.length > 0) {
    console.log('Failed Entries:');
    errors.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
    console.log('');
  }

  // Verification
  console.log('📊 Verification:');
  const deprecatedCount = await prisma.progress.count({
    where: { deprecated: true },
  });
  const foodConsumptionCount = await prisma.foodConsumption.count();
  const foodItemCount = await prisma.foodItem.count();

  console.log(`   Deprecated Progress entries: ${deprecatedCount}`);
  console.log(`   New FoodConsumption entries: ${foodConsumptionCount}`);
  console.log(`   Total FoodItems created: ${foodItemCount}`);
  console.log('');

  if (successCount === progressEntries.length) {
    console.log('✨ Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with errors. Please review failed entries.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
