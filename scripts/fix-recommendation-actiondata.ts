import { prisma } from '../lib/prisma';

async function fixRecommendationActionData() {
  console.log('=== Fixing Recommendation ActionData ===\n');
  
  // Get all recipe recommendations without actionData
  const recommendations = await prisma.recommendation.findMany({
    where: {
      type: 'RECIPE',
      status: { in: ['PENDING', 'ACTED_ON'] },
    },
  });
  
  // Filter for null actionData in JavaScript
  const recsWithoutActionData = recommendations.filter(rec => rec.actionData === null);
  
  console.log(`Found ${recsWithoutActionData.length} recommendations without actionData\n`);
  
  for (const rec of recsWithoutActionData) {
    // Extract the system from the title
    // e.g., "Strengthen Your MICROBIOME (1/5 foods)" -> "MICROBIOME"
    const match = rec.title.match(/Strengthen Your (\w+)/i);
    const targetSystem = match ? match[1] : null;
    
    if (!targetSystem) {
      console.log(`⚠️  Could not extract system from title: ${rec.title}`);
      continue;
    }
    
    // Get user for dietary restrictions
    const user = await prisma.user.findUnique({
      where: { id: rec.userId },
      select: { 
        defaultDietaryRestrictions: true,
        defaultServings: true,
      },
    });
    
    const actionData = {
      targetSystem,
      dietaryRestrictions: user?.defaultDietaryRestrictions || [],
      preferredMealTime: undefined, // Not stored on user model
    };
    
    await prisma.recommendation.update({
      where: { id: rec.id },
      data: { actionData },
    });
    
    console.log(`✅ Updated: ${rec.title}`);
    console.log(`   Target System: ${targetSystem}`);
    console.log(`   Dietary Restrictions: ${actionData.dietaryRestrictions.join(', ') || 'none'}`);
    console.log('');
  }
  
  console.log(`\n✅ Updated ${recsWithoutActionData.length} recommendations`);
  
  await prisma.$disconnect();
}

fixRecommendationActionData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
