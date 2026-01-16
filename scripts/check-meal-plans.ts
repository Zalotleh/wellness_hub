import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmk8sltuv00026lmf3ui32pge'; // Emma's user ID
  
  console.log('🔍 Checking meal plans for user Emma...\n');
  
  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      userId,
    },
    include: {
      dailyMenus: {
        include: {
          meals: {
            select: {
              id: true,
              mealType: true,
              recipeGenerated: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  console.log(`Found ${mealPlans.length} meal plans:\n`);
  
  mealPlans.forEach((plan, idx) => {
    console.log(`${idx + 1}. "${plan.title}"`);
    console.log(`   ID: ${plan.id}`);
    console.log(`   Week: ${format(plan.weekStart, 'MMM dd, yyyy')} - ${format(plan.weekEnd, 'MMM dd, yyyy')}`);
    console.log(`   Status: ${plan.status}`);
    console.log(`   Daily Menus (${plan.dailyMenus.length}):`);
    
    plan.dailyMenus.forEach(dm => {
      const mealsWithRecipes = dm.meals.filter(m => m.recipeGenerated).length;
      console.log(`     - ${format(dm.date, 'EEE, MMM dd, yyyy')}: ${dm.meals.length} meals (${mealsWithRecipes} with recipes)`);
    });
    
    console.log();
  });
  
  // Look for meals on Jan 15, 2026
  const jan15 = new Date('2026-01-15T12:00:00.000Z');
  const mealsOnJan15 = await prisma.dailyMenu.findMany({
    where: {
      date: jan15,
      mealPlan: {
        userId,
      },
    },
    include: {
      meals: {
        select: {
          id: true,
          mealType: true,
          recipeGenerated: true,
        },
      },
      mealPlan: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  
  if (mealsOnJan15.length > 0) {
    console.log('⚠️  Found daily menus on Jan 15, 2026:');
    mealsOnJan15.forEach(dm => {
      console.log(`   From plan: "${dm.mealPlan.title}" (${dm.mealPlan.id})`);
      console.log(`   Meals: ${dm.meals.map(m => m.mealType).join(', ')}`);
    });
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
