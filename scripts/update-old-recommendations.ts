import { prisma } from '../lib/prisma';

async function updateOldRecommendations() {
  console.log('=== Updating Old Recommendations ===\n');
  
  // Update variety recommendations
  const varietyRecs = await prisma.recommendation.updateMany({
    where: {
      type: 'FOOD_SUGGESTION',
      status: 'PENDING',
      actionLabel: 'Discover New Foods',
    },
    data: {
      actionLabel: 'Create New Recipe',
      actionUrl: '/recipes/ai-generate',
    },
  });
  
  console.log(`✅ Updated ${varietyRecs.count} variety recommendations`);
  
  // Update missed meal recommendations
  const mealRecs = await prisma.recommendation.updateMany({
    where: {
      type: 'WORKFLOW_STEP',
      status: 'PENDING',
      actionLabel: 'Track Now',
    },
    data: {
      actionLabel: 'Create Recipe',
      actionUrl: '/recipes/ai-generate',
    },
  });
  
  console.log(`✅ Updated ${mealRecs.count} missed meal recommendations`);
  
  // Also update titles for missed meal recommendations
  const breakfastRecs = await prisma.recommendation.findMany({
    where: {
      type: 'WORKFLOW_STEP',
      status: 'PENDING',
      title: { contains: 'Log Your' },
    },
  });
  
  for (const rec of breakfastRecs) {
    const mealTime = rec.title.replace('Log Your ', '');
    await prisma.recommendation.update({
      where: { id: rec.id },
      data: {
        title: `Plan Your ${mealTime}`,
        description: `${mealTime} not logged yet. Create a healthy ${mealTime.toLowerCase()} recipe!`,
      },
    });
  }
  
  console.log(`✅ Updated ${breakfastRecs.length} missed meal titles`);
  
  console.log('\n✅ All recommendations updated!');
  
  await prisma.$disconnect();
}

updateOldRecommendations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
