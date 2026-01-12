import { prisma } from '../lib/prisma';

async function checkData() {
  const user = await prisma.user.findUnique({
    where: { email: 'john.davis@example.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const today = new Date('2026-01-12');
  today.setHours(0, 0, 0, 0);
  
  const foods = await prisma.foodConsumption.findMany({
    where: {
      userId: user.id,
      consumedAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    include: {
      foodItem: {
        include: {
          defenseSystems: true
        }
      }
    }
  });
  
  console.log('Total foods logged:', foods.length);
  console.log('\nFoods by meal:');
  const byMeal: Record<string, string[]> = {};
  foods.forEach(f => {
    if (!byMeal[f.mealTime]) byMeal[f.mealTime] = [];
    byMeal[f.mealTime].push(f.foodItem.name);
  });
  console.log(JSON.stringify(byMeal, null, 2));
  
  console.log('\nFoods by system:');
  const bySys: Record<string, Set<string>> = {};
  foods.forEach(f => {
    f.foodItem.defenseSystems.forEach(ds => {
      if (!bySys[ds.system]) bySys[ds.system] = new Set();
      bySys[ds.system].add(f.foodItem.name);
    });
  });
  Object.keys(bySys).forEach(sys => {
    console.log(`${sys}: ${bySys[sys].size} unique foods`);
  });
}

checkData().finally(() => process.exit(0));
