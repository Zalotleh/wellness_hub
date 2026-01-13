import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateRecommendations() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  console.log('Deleting all existing recommendations to force fresh generation...\n');
  
  const deleted = await prisma.recommendation.deleteMany({
    where: {
      userId: userId
    }
  });
  
  console.log(`✅ Deleted ${deleted.count} recommendations`);
  console.log('\nNow refresh the progress page in the browser to trigger new recommendations.');
  console.log('Expected recommendations (in priority order):');
  console.log('  1. BREAKFAST (main meal)');
  console.log('  2. DINNER (main meal)');
  console.log('  3. (Could be a 3rd main meal or system recommendation if applicable)');
  console.log('\nSnacks and variety should NOT appear until main meals are logged.');
  
  await prisma.$disconnect();
}

investigateRecommendations();
