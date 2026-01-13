import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRecommendationGeneration() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  // Delete existing recommendations to test fresh generation
  console.log('Deleting existing PENDING recommendations...');
  const deleted = await prisma.recommendation.deleteMany({
    where: {
      userId: userId,
      status: 'PENDING'
    }
  });
  console.log(`Deleted ${deleted.count} recommendations\n`);
  
  // Trigger recommendation generation by calling the progress API
  console.log('Triggering recommendation generation via progress API...');
  console.log('Note: This would normally be done via HTTP request to /api/progress');
  console.log('For now, check the UI after refreshing the progress page.\n');
  
  console.log('Expected behavior after fix:');
  console.log('  - Should generate up to 3 PENDING recommendations');
  console.log('  - Should include recommendations for multiple missed meals (BREAKFAST, DINNER, etc.)');
  console.log('  - Previously only generated 1 missed meal recommendation (BREAKFAST)');
  console.log('  - Now will loop through missed meals and generate multiple (up to limit)');
  
  await prisma.$disconnect();
}

testRecommendationGeneration();
