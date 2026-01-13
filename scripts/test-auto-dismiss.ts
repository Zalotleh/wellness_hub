import { prisma } from '../lib/prisma';
import { calculate5x5x5Score } from '../lib/tracking/5x5x5-score';
import { recommendationEngine } from '../lib/recommendations/engine';

async function testAutoDismiss() {
  console.log('=== Testing Auto-Dismiss for John Davis ===\n');
  
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'John', mode: 'insensitive' } },
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', user.name);
  
  // Get current score
  const today = new Date();
  const score = await calculate5x5x5Score(user.id, today);
  
  console.log('\nCurrent System Scores:');
  score.defenseSystems.forEach(sys => {
    console.log(`  ${sys.system}: ${sys.foodsConsumed}/5 foods`);
  });
  
  // Generate recommendations (this will auto-dismiss outdated ones)
  console.log('\nGenerating recommendations (will auto-dismiss completed systems)...');
  const recommendations = await recommendationEngine.generateRecommendations(
    user.id,
    today,
    score
  );
  
  console.log(`\nGenerated ${recommendations.length} new recommendations`);
  
  // Check all recommendations
  const allRecs = await prisma.recommendation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log('\n=== All Recommendations ===');
  allRecs.forEach(rec => {
    console.log(`\n${rec.title}`);
    console.log(`  Status: ${rec.status}`);
    console.log(`  System: ${rec.targetSystem}`);
  });
  
  await prisma.$disconnect();
}

testAutoDismiss()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
