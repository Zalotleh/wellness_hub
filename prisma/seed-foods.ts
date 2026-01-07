/**
 * Prisma Seed Script - Food Database
 * 
 * Seeds the FoodDatabase table with comprehensive food data
 * including multi-system categorization and nutrient information.
 */

import { PrismaClient } from '@prisma/client';
import { FOOD_DATABASE } from './seeds/food-database';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('');

  // Seed Food Database
  console.log('📚 Seeding Food Database...');
  let successCount = 0;
  let errorCount = 0;

  for (const food of FOOD_DATABASE) {
    try {
      await prisma.foodDatabase.upsert({
        where: { name: food.name },
        update: {
          category: food.category,
          defenseSystems: food.defenseSystems,
          nutrients: food.nutrients,
          description: food.description,
          systemBenefits: food.systemBenefits,
          updatedAt: new Date(),
        },
        create: {
          name: food.name,
          category: food.category,
          defenseSystems: food.defenseSystems,
          nutrients: food.nutrients,
          description: food.description,
          systemBenefits: food.systemBenefits,
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Error seeding food "${food.name}":`, error);
      errorCount++;
    }
  }

  console.log(`✅ Seeded ${successCount} foods successfully`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} foods failed to seed`);
  }
  console.log('');

  // Print statistics
  console.log('📊 Food Database Statistics:');
  const totalFoods = await prisma.foodDatabase.count();
  console.log(`   Total foods: ${totalFoods}`);

  // Count by category
  const categories = await prisma.foodDatabase.groupBy({
    by: ['category'],
    _count: true,
  });
  console.log('   By category:');
  categories.forEach(cat => {
    console.log(`     - ${cat.category}: ${cat._count} foods`);
  });
  console.log('');

  // Multi-system foods analysis
  const allFoods = await prisma.foodDatabase.findMany();
  const multiSystemFoods = allFoods.filter(food => food.defenseSystems.length >= 3);
  console.log(`   Multi-system foods (3+ systems): ${multiSystemFoods.length}`);
  console.log('   Top multi-system foods:');
  multiSystemFoods
    .sort((a, b) => b.defenseSystems.length - a.defenseSystems.length)
    .slice(0, 5)
    .forEach(food => {
      console.log(`     - ${food.name}: ${food.defenseSystems.length} systems`);
    });

  console.log('');
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
