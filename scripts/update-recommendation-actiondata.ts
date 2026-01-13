import { prisma } from '../lib/prisma';

async function updateRecommendationActionData() {
  console.log('=== Updating Recommendation ActionData ===\n');
  
  // Get all pending variety recommendations
  const varietyRecs = await prisma.recommendation.findMany({
    where: {
      type: 'FOOD_SUGGESTION',
      status: 'PENDING',
    },
  });
  
  for (const rec of varietyRecs) {
    const user = await prisma.user.findUnique({
      where: { id: rec.userId },
      select: { defaultDietaryRestrictions: true },
    });
    
    // Extract repeated foods from description
    const match = rec.description.match(/\(([^)]+)\)/);
    const repeatedFoods = match ? match[1].split(', ') : [];
    
    const actionData = {
      from: 'variety',
      avoidIngredients: repeatedFoods,
      dietaryRestrictions: user?.defaultDietaryRestrictions || [],
    };
    
    await prisma.recommendation.update({
      where: { id: rec.id },
      data: { actionData },
    });
    
    console.log(`✅ Updated variety rec: ${rec.title}`);
    console.log(`   Avoid: ${repeatedFoods.join(', ')}`);
  }
  
  // Get all pending missed meal recommendations
  const mealRecs = await prisma.recommendation.findMany({
    where: {
      type: 'WORKFLOW_STEP',
      status: 'PENDING',
    },
  });
  
  for (const rec of mealRecs) {
    const user = await prisma.user.findUnique({
      where: { id: rec.userId },
      select: { defaultDietaryRestrictions: true },
    });
    
    const actionData = {
      from: 'missed-meal',
      preferredMealTime: rec.targetMealTime,
      dietaryRestrictions: user?.defaultDietaryRestrictions || [],
    };
    
    await prisma.recommendation.update({
      where: { id: rec.id },
      data: { actionData },
    });
    
    console.log(`✅ Updated meal rec: ${rec.title}`);
    console.log(`   Meal: ${rec.targetMealTime}`);
  }
  
  console.log('\n✅ All actionData updated!');
  
  await prisma.$disconnect();
}

updateRecommendationActionData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
