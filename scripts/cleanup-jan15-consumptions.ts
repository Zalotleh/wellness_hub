import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up food consumptions on Jan 15, 2026 that were incorrectly created
  const targetDate = new Date('2026-01-15T12:00:00.000Z');
  
  console.log('🔍 Looking for food consumptions on:', targetDate);
  
  const consumptions = await prisma.foodConsumption.findMany({
    where: {
      date: targetDate,
    },
    include: {
      foodItems: {
        select: {
          name: true,
          quantity: true,
          unit: true,
        },
      },
    },
  });
  
  console.log(`Found ${consumptions.length} consumptions on Jan 15, 2026:`);
  consumptions.forEach(c => {
    const foods = c.foodItems.map(f => f.name).join(', ');
    console.log(`  - ${c.mealTime}: ${foods} (${c.servings} servings)`);
  });
  
  if (consumptions.length > 0) {
    console.log('\n⚠️  Deleting these incorrect consumptions...');
    
    const result = await prisma.foodConsumption.deleteMany({
      where: {
        date: targetDate,
      },
    });
    
    console.log(`✅ Deleted ${result.count} food consumptions from Jan 15, 2026`);
  } else {
    console.log('✅ No consumptions to delete');
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
