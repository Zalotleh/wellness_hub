import { prisma } from '../lib/prisma';

async function checkJohnMeals() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  // Use UTC to avoid timezone shifting
  const today = new Date(Date.UTC(2026, 0, 13, 0, 0, 0));
  
  console.log('Checking for date:', today.toISOString().split('T')[0]);
  
  // Check food consumption
  const foods = await prisma.foodConsumption.findMany({
    where: {
      userId: user.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });
  
  console.log('Food consumption entries:', foods.length);
  
  const byMeal: Record<string, number> = {};
  foods.forEach(f => {
    byMeal[f.mealTime] = (byMeal[f.mealTime] || 0) + 1;
  });
  
  console.log('\nMeals breakdown:');
  Object.entries(byMeal).forEach(([meal, count]) => {
    console.log(`  ${meal}: ${count} food entries`);
  });
  
  console.log('\nUnique meal times:', Object.keys(byMeal).length);
  
  // Check recipes
  const recipes = await prisma.recipe.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true
    }
  });
  
  console.log('\nRecent recipes:', recipes.length);
  recipes.forEach(r => {
    console.log(`  - ${r.title} (created: ${r.createdAt})`);
  });
  
  // Check cache
  const cache = await prisma.dailyProgressScore.findFirst({
    where: {
      userId: user.id,
      date: today
    }
  });
  
  if (cache) {
    console.log('\nCache data:');
    console.log(`  Meals logged: ${cache.mealsLogged || 'undefined'}`);
    console.log(`  Overall score: ${cache.overallScore}`);
  } else {
    console.log('\nNo cache found for today');
  }
}

checkJohnMeals().finally(() => process.exit(0));
