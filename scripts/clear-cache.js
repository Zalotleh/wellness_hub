const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearCache() {
  const user = await prisma.user.findUnique({ where: { email: 'john@example.com' } });
  if (!user) {
    console.log('User not found');
    await prisma.$disconnect();
    return;
  }
  
  const deleted = await prisma.recommendation.deleteMany({
    where: { userId: user.id }
  });
  
  console.log('Deleted', deleted.count, 'cached recommendations for john@example.com');
  
  const deletedScores = await prisma.dailyProgressScore.deleteMany({
    where: { userId: user.id }
  });
  
  console.log('Deleted', deletedScores.count, 'cached scores');
  
  await prisma.$disconnect();
}

clearCache().catch(console.error);
