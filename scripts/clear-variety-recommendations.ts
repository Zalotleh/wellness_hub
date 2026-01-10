import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearVarietyRecommendations() {
  const userEmail = 'ziadmn@yahoo.com';
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n🔍 Checking variety recommendations for ${userEmail}...\n`);

    // Delete all FOOD_SUGGESTION recommendations
    const result = await prisma.recommendation.deleteMany({
      where: {
        userId: user.id,
        type: 'FOOD_SUGGESTION',
      },
    });

    console.log(`✅ Deleted ${result.count} FOOD_SUGGESTION recommendation(s)\n`);
    console.log('The app will generate new recommendations based on the fixed logic.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearVarietyRecommendations();
