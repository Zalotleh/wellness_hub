import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMealPriority() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  // Check current meals
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
  
  console.log('Current meals logged:');
  console.log(`  Total: ${meals.length}`);
  meals.forEach(m => console.log(`  - ${m.mealTime}`));
  
  const loggedMealTimes = new Set(meals.map(m => m.mealTime));
  
  const mainMeals = ['BREAKFAST', 'LUNCH', 'DINNER'];
  const snacks = ['MORNING_SNACK', 'AFTERNOON_SNACK'];
  
  const missingMainMeals = mainMeals.filter(m => !loggedMealTimes.has(m as any));
  const missingSnacks = snacks.filter(s => !loggedMealTimes.has(s as any));
  const loggedMainMealsCount = mainMeals.filter(m => loggedMealTimes.has(m as any)).length;
  
  console.log('\nMeal Analysis:');
  console.log(`  Main meals logged: ${loggedMainMealsCount}/3`);
  console.log(`  Missing main meals: ${missingMainMeals.join(', ') || 'None'}`);
  console.log(`  Missing snacks: ${missingSnacks.join(', ') || 'None'}`);
  
  console.log('\n📋 Expected Recommendation Priority:');
  console.log('  Priority 1-3: Defense systems (if applicable)');
  console.log('  Priority 4: Main meals (BREAKFAST, LUNCH, DINNER)');
  
  if (missingMainMeals.length > 0) {
    console.log(`    → Should recommend: ${missingMainMeals.join(', ')}`);
  }
  
  if (loggedMainMealsCount === 3) {
    console.log('  Priority 5: Snacks (all main meals logged)');
    if (missingSnacks.length > 0) {
      console.log(`    → Should recommend: ${missingSnacks.join(', ')}`);
    }
  } else {
    console.log('  Priority 5: Snacks (SKIPPED - main meals not complete)');
    console.log(`    → Will NOT recommend snacks until all 3 main meals are logged`);
  }
  
  if (meals.length >= 2) {
    console.log('  Priority 7: Variety (2+ meals logged)');
    console.log('    → Can recommend variety improvements');
  } else {
    console.log('  Priority 7: Variety (SKIPPED - less than 2 meals)');
  }
  
  await prisma.$disconnect();
}

testMealPriority();
