import { prisma } from '../lib/prisma';

async function resetMicrobiomeRecommendation() {
  const userId = 'cmk8sltur00016lmf3wecitlc';
  
  console.log('=== Resetting Microbiome Recommendation ===\n');
  
  // Find the MICROBIOME recommendation that's incorrectly marked as ACTED_ON
  const recommendation = await prisma.recommendation.findFirst({
    where: {
      userId,
      status: 'ACTED_ON',
      title: {
        contains: 'MICROBIOME',
      },
    },
  });
  
  if (!recommendation) {
    console.log('No Microbiome recommendation found with ACTED_ON status');
    return;
  }
  
  console.log('Found recommendation:', recommendation.title);
  console.log('Current status:', recommendation.status);
  console.log('Acted at:', recommendation.actedAt);
  console.log('Linked recipe:', recommendation.linkedRecipeId || 'None');
  
  // If no recipe was created, reset to PENDING
  if (!recommendation.linkedRecipeId) {
    console.log('\n❌ No recipe linked - this is a false flag!');
    console.log('Resetting status to PENDING...\n');
    
    const updated = await prisma.recommendation.update({
      where: { id: recommendation.id },
      data: {
        status: 'PENDING',
        actedAt: null,
        actionData: null,
      },
    });
    
    console.log('✅ Recommendation reset to PENDING');
    console.log('Status:', updated.status);
  } else {
    console.log('\n✓ Recipe exists - status is correct');
  }
  
  await prisma.$disconnect();
}

resetMicrobiomeRecommendation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
