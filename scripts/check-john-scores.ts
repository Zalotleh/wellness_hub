import { prisma } from '../lib/prisma';
import { calculate5x5x5Score } from '../lib/tracking/5x5x5-score';

async function checkJohnScores() {
  console.log('=== Checking John Davis Scores ===\n');
  
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: 'john.davis@example.com' },
        { name: { contains: 'John', mode: 'insensitive' } },
      ]
    },
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', user?.name, user?.email);
  
  // Calculate current score
  const today = new Date();
  const score = await calculate5x5x5Score(user.id, today);
  
  console.log('\n=== Current 5x5x5 Score ===');
  console.log('Overall Score:', score.overallScore);
  console.log('\nDefense Systems:');
  score.defenseSystems.forEach(sys => {
    console.log(`  ${sys.system}: ${sys.foodsConsumed}/5 foods (${sys.score}%)`);
  });
  
  // Get all recommendations
  const recommendations = await prisma.recommendation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log('\n=== Recommendations ===');
  recommendations.forEach(rec => {
    console.log(`\n${rec.title}`);
    console.log(`  Status: ${rec.status}`);
    console.log(`  Action Data:`, rec.actionData);
  });
  
  await prisma.$disconnect();
}

checkJohnScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
