import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  console.log('🔍 Finding all meal plans for user...');
  
  const mealPlans = await prisma.mealPlan.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });
  
  console.log(`Found ${mealPlans.length} meal plans:`);
  mealPlans.forEach(mp => {
    console.log(`  - ${mp.title} (${mp.id})`);
  });
  
  if (mealPlans.length > 0) {
    console.log('\n⚠️  Deleting all meal plans...');
    
    const result = await prisma.mealPlan.deleteMany({
      where: { userId },
    });
    
    console.log(`✅ Deleted ${result.count} meal plans`);
  }
  
  // Also clean up any food consumptions on Jan 15 and Jan 16
  console.log('\n🔍 Cleaning up food consumptions on Jan 15 and Jan 16...');
  
  const jan15 = new Date('2026-01-15T12:00:00.000Z');
  const jan16 = new Date('2026-01-16T12:00:00.000Z');
  
  const consumptions15 = await prisma.foodConsumption.deleteMany({
    where: {
      userId,
      date: jan15,
    },
  });
  
  const consumptions16 = await prisma.foodConsumption.deleteMany({
    where: {
      userId,
      date: jan16,
    },
  });
  
  console.log(`✅ Deleted ${consumptions15.count} consumptions from Jan 15`);
  console.log(`✅ Deleted ${consumptions16.count} consumptions from Jan 16`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
