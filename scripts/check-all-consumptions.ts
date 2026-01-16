import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  const consumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: {
        gte: new Date('2026-01-13'),
        lte: new Date('2026-01-17'),
      },
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      id: true,
      date: true,
      mealTime: true,
      mealPlanId: true,
      createdAt: true,
    },
  });
  
  console.log(`Found ${consumptions.length} consumptions:\n`);
  consumptions.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`  Date: ${c.date.toISOString()}`);
    console.log(`  Meal Time: ${c.mealTime}`);
    console.log(`  Meal Plan ID: ${c.mealPlanId}`);
    console.log(`  Created: ${c.createdAt.toISOString()}`);
    console.log();
  });
  
  if (consumptions.length > 0) {
    console.log('\n🗑️  Deleting all these consumptions...\n');
    const result = await prisma.foodConsumption.deleteMany({
      where: {
        userId,
        date: {
          gte: new Date('2026-01-13'),
          lte: new Date('2026-01-17'),
        },
      },
    });
    console.log(`✅ Deleted ${result.count} consumptions`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
