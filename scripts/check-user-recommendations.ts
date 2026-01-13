import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecommendations() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  // Get all recommendations for this user
  const recommendations = await prisma.recommendation.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      actionLabel: true,
      actionUrl: true,
      actionData: true,
      status: true,
      targetSystem: true,
      createdAt: true,
      dismissedAt: true
    }
  });
  
  console.log(`Found ${recommendations.length} recommendations for user ${userId}:\n`);
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.status}] ${rec.type}`);
    console.log(`   ID: ${rec.id}`);
    console.log(`   Title: ${rec.title}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Action: ${rec.actionLabel} → ${rec.actionUrl}`);
    console.log(`   Action Data: ${JSON.stringify(rec.actionData)}`);
    console.log(`   Target System: ${rec.targetSystem || 'N/A'}`);
    console.log(`   Status: ${rec.status}`);
    console.log(`   Created: ${rec.createdAt}`);
    if (rec.dismissedAt) {
      console.log(`   Dismissed: ${rec.dismissedAt}`);
    }
    console.log('');
  });
  
  // Check user's meal data
  console.log('\n--- User Meal Data ---');
  const meals = await prisma.foodConsumption.findMany({
    where: {
      userId: userId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    select: {
      id: true,
      mealTime: true,
      date: true,
      createdAt: true
    }
  });
  
  console.log(`\nMeals logged today: ${meals.length}`);
  meals.forEach(meal => {
    console.log(`  - ${meal.mealTime} at ${meal.createdAt}`);
  });
  
  // Check which meal times are missing
  const mealTimes = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];
  const loggedMealTimes = new Set(meals.map(m => m.mealTime as string));
  const missingMealTimes = mealTimes.filter(mt => !loggedMealTimes.has(mt));
  
  console.log(`\nMissing meal times: ${missingMealTimes.join(', ')}`);
  
  await prisma.$disconnect();
}

checkRecommendations();
