import { prisma } from '../lib/prisma';

async function checkCache() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log(`Checking cache for John Davis (${user.id})\n`);
  
  // Check DailyProgressScore cache
  const scores = await prisma.dailyProgressScore.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      date: 'desc'
    },
    take: 5
  });
  
  console.log(`Cached scores: ${scores.length}`);
  scores.forEach(s => {
    console.log(`\nDate: ${s.date.toDateString()}`);
    console.log(`  Overall Score: ${s.overallScore}`);
    console.log(`  Systems Complete: ${s.systemsComplete}`);
    console.log(`  Systems Covered: ${s.systemsCovered}`);
    console.log(`  Total Foods: ${s.totalFoods}`);
    console.log(`  Meals Logged: ${s.mealsLogged}`);
    console.log(`  Defense Systems:`, s.defenseSystems);
  });
  
  // Clear the cache for today
  const today = new Date('2026-01-12');
  today.setHours(0, 0, 0, 0);
  
  console.log(`\n\nDeleting cache for ${today.toDateString()}...`);
  
  try {
    const deleted = await prisma.dailyProgressScore.deleteMany({
      where: {
        userId: user.id,
        date: today
      }
    });
    console.log(`Deleted ${deleted.count} cache entries`);
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
}

checkCache().finally(() => process.exit(0));
