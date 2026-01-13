import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceRegeneration() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  console.log('Clearing COMPLETED recommendations to allow snack recommendations...\n');
  
  const deleted = await prisma.recommendation.deleteMany({
    where: {
      userId: userId,
      status: 'COMPLETED'
    }
  });
  
  console.log(`✅ Deleted ${deleted.count} COMPLETED recommendations`);
  
  // Check meals
  const meals = await prisma.foodConsumption.findMany({
    where: {
      userId: userId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    select: {
      mealTime: true
    }
  });
  
  const mainMeals = ['BREAKFAST', 'LUNCH', 'DINNER'];
  const loggedMainMeals = meals.filter(m => mainMeals.includes(m.mealTime)).map(m => m.mealTime);
  
  console.log(`\nMain meals logged: ${loggedMainMeals.join(', ')}`);
  console.log(`All main meals complete: ${loggedMainMeals.length === 3 ? 'YES ✅' : 'NO ❌'}`);
  
  if (loggedMainMeals.length === 3) {
    console.log('\n📌 Expected behavior:');
    console.log('  When you refresh the progress page, snack recommendations should appear:');
    console.log('  - Plan Your MORNING_SNACK');
    console.log('  - Plan Your AFTERNOON_SNACK');
  }
  
  await prisma.$disconnect();
}

forceRegeneration();
