import { prisma } from '../lib/prisma';

async function checkJohnRecommendations() {
  const userId = 'cmk8sltur00016lmf3wecitlc';
  
  console.log('=== John Davis Recommendations ===\n');
  
  const recommendations = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Total Recommendations: ${recommendations.length}\n`);
  
  if (recommendations.length === 0) {
    console.log('No recommendations found.');
    return;
  }
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`);
    console.log(`   Status: ${rec.status}`);
    console.log(`   Type: ${rec.type}`);
    console.log(`   Created: ${rec.createdAt.toISOString()}`);
    if (rec.actedAt) {
      console.log(`   Acted At: ${rec.actedAt.toISOString()}`);
    }
    if (rec.completedAt) {
      console.log(`   Completed At: ${rec.completedAt.toISOString()}`);
    }
    if (rec.linkedRecipeId) {
      console.log(`   Linked Recipe: ${rec.linkedRecipeId}`);
    }
    console.log(`   Action URL: ${rec.actionUrl}`);
    console.log('');
  });
  
  // Show status breakdown
  const statusCounts = recommendations.reduce((acc, rec) => {
    acc[rec.status] = (acc[rec.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Status Breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  await prisma.$disconnect();
}

checkJohnRecommendations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
