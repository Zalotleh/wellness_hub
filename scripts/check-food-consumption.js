const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFoodConsumption() {
  const userEmail = 'john@example.com';
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log(`User ${userEmail} not found!`);
    return;
  }

  console.log(`\nChecking food consumption for ${userEmail}...`);
  console.log(`User ID: ${user.id}`);

  const consumptions = await prisma.foodConsumption.findMany({
    where: { userId: user.id },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  console.log(`\nTotal food consumption entries: ${consumptions.length}`);

  if (consumptions.length > 0) {
    console.log('\nRecent entries:');
    consumptions.slice(0, 3).forEach((entry) => {
      console.log(`\nDate: ${entry.date.toISOString().split('T')[0]}`);
      console.log(`Meal Time: ${entry.mealTime}`);
      console.log(`Food Items: ${entry.foodItems.length}`);
      entry.foodItems.forEach((item) => {
        console.log(`  - ${item.name} (${item.defenseSystems.map(ds => ds.defenseSystem).join(', ')})`);
      });
    });
  } else {
    console.log('\nNo food consumption entries found!');
  }

  // Check cached scores
  const cachedScores = await prisma.dailyProgressScore.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  console.log(`\nCached scores: ${cachedScores.length}`);
  if (cachedScores.length > 0) {
    console.log('\nRecent cached scores:');
    cachedScores.slice(0, 3).forEach((score) => {
      console.log(`\nDate: ${score.date.toISOString().split('T')[0]}`);
      console.log(`Overall Score: ${score.overallScore}`);
      console.log(`Systems: ANG=${score.angiogenesisCount}, REG=${score.regenerationCount}, MIC=${score.microbiomeCount}, DNA=${score.dnaProtectionCount}, IMM=${score.immunityCount}`);
      console.log(`Created: ${score.createdAt.toISOString()}`);
    });
  }

  await prisma.$disconnect();
}

checkFoodConsumption().catch(console.error);
