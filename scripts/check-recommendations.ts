import { prisma } from '../lib/prisma';

async function checkRecommendations() {
  const userEmail = 'ziadmn@yahoo.com';
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`\n📊 Checking recommendations for ${userEmail} (ID: ${user.id})\n`);

  // Get all pending recommendations
  const recommendations = await prisma.recommendation.findMany({
    where: {
      userId: user.id,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${recommendations.length} PENDING recommendations:\n`);

  recommendations.forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.title}`);
    console.log(`   Type: ${rec.type}`);
    console.log(`   Priority: ${rec.priority}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Created: ${rec.createdAt.toISOString()}`);
    console.log(`   ID: ${rec.id}\n`);
  });

  // Check for variety recommendations specifically
  const varietyRecs = recommendations.filter(r => r.type === 'FOOD_SUGGESTION');
  
  if (varietyRecs.length > 0) {
    console.log(`\n⚠️  Found ${varietyRecs.length} FOOD_SUGGESTION recommendations`);
    console.log(`These may need to be deleted if they were created before the fix.\n`);
  }
}

checkRecommendations()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
