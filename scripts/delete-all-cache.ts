import { prisma } from '../lib/prisma';

async function checkCacheDetails() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const scores = await prisma.dailyProgressScore.findMany({
    where: {
      userId: user.id
    }
  });
  
  console.log(`Found ${scores.length} cached scores for John Davis\n`);
  
  scores.forEach((s, i) => {
    console.log(`Cache Entry ${i + 1}:`);
    console.log(`  ID: ${s.id}`);
    console.log(`  Date (raw): ${s.date}`);
    console.log(`  Date (ISO): ${s.date.toISOString()}`);
    console.log(`  Overall Score: ${s.overallScore}`);
    console.log(`  All fields:`, JSON.stringify(s, null, 2));
    console.log('');
  });
  
  // Delete ALL cache entries for this user
  console.log('Deleting ALL cache entries for John Davis...');
  const deleted = await prisma.dailyProgressScore.deleteMany({
    where: {
      userId: user.id
    }
  });
  console.log(`Deleted ${deleted.count} entries`);
  
  // Also check and delete old recommendations
  const oldRecs = await prisma.recommendation.deleteMany({
    where: {
      userId: user.id
    }
  });
  console.log(`Deleted ${oldRecs.count} old recommendations`);
}

checkCacheDetails().finally(() => process.exit(0));
