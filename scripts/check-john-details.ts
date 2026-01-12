import { prisma } from '../lib/prisma';

async function checkJohn() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });
  
  if (!user) {
    console.log('John Davis not found');
    return;
  }
  
  console.log(`User: ${user.name} (${user.email})`);
  console.log(`ID: ${user.id}\n`);
  
  const today = new Date('2026-01-12');
  today.setHours(0, 0, 0, 0);
  
  const foods = await prisma.foodConsumption.findMany({
    where: {
      userId: user.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true
        }
      }
    }
  });
  
  console.log(`Total food consumption entries: ${foods.length}`);
  
  // Count unique foods per system
  const bySys: Record<string, Set<string>> = {};
  const allUniqueFoods = new Set<string>();
  
  foods.forEach(f => {
    f.foodItems.forEach(item => {
      allUniqueFoods.add(item.name);
      item.defenseSystems.forEach(ds => {
        if (!bySys[ds.system]) bySys[ds.system] = new Set();
        bySys[ds.system].add(item.name);
      });
    });
  });
  
  console.log(`\nTotal unique foods: ${allUniqueFoods.size}`);
  console.log(`\nFoods by Defense System:`);
  
  const systems = ['ANGIOGENESIS', 'REGENERATION', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'];
  systems.forEach(sys => {
    const count = bySys[sys]?.size || 0;
    console.log(`  ${sys}: ${count}/5 foods`);
    if (bySys[sys]) {
      const foodList = Array.from(bySys[sys]);
      console.log(`    Foods: ${foodList.slice(0, 3).join(', ')}${foodList.length > 3 ? '...' : ''}`);
    }
  });
  
  // Check meals
  console.log(`\nMeals logged:`);
  const byMeal: Record<string, number> = {};
  foods.forEach(f => {
    byMeal[f.mealTime] = (byMeal[f.mealTime] || 0) + 1;
  });
  Object.entries(byMeal).forEach(([meal, count]) => {
    console.log(`  ${meal}: ${count} entries`);
  });
  
  // Check recommendations
  const recs = await prisma.recommendation.findMany({
    where: {
      userId: user.id,
      status: 'PENDING'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });
  
  console.log(`\nPending recommendations: ${recs.length}`);
  recs.forEach(r => {
    console.log(`  - ${r.title} (${r.priority}) - Target: ${r.targetSystem || 'N/A'}`);
  });
}

checkJohn().finally(() => process.exit(0));
