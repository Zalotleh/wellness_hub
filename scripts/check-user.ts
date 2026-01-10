import { prisma } from '../lib/prisma';

async function checkUser() {
  try {
    console.log('Checking users in database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            dailyScores: true,
            progress: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'No name'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Daily Scores: ${user._count.dailyScores}`);
      console.log(`   Progress Entries: ${user._count.progress}`);
      console.log('');
    });

    // Check for orphaned DailyProgressScore records (scores where userId doesn't match any user)
    const allScores = await prisma.dailyProgressScore.findMany({
      select: {
        id: true,
        userId: true,
        date: true,
      }
    });

    const orphanedScores = [];
    for (const score of allScores) {
      const userExists = users.find(u => u.id === score.userId);
      if (!userExists) {
        orphanedScores.push(score);
      }
    }

    if (orphanedScores.length > 0) {
      console.log(`\n⚠️  Found ${orphanedScores.length} orphaned DailyProgressScore records:`);
      orphanedScores.forEach(score => {
        console.log(`   Score ID: ${score.id}, User ID: ${score.userId}, Date: ${score.date}`);
      });
    } else {
      console.log('\n✅ No orphaned DailyProgressScore records found');
    }

    // Check for orphaned Recommendation records
    const allRecommendations = await prisma.recommendation.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
      }
    });

    const orphanedRecommendations = [];
    for (const rec of allRecommendations) {
      const userExists = users.find(u => u.id === rec.userId);
      if (!userExists) {
        orphanedRecommendations.push(rec);
      }
    }

    if (orphanedRecommendations.length > 0) {
      console.log(`\n⚠️  Found ${orphanedRecommendations.length} orphaned Recommendation records:`);
      orphanedRecommendations.forEach(rec => {
        console.log(`   Rec ID: ${rec.id}, User ID: ${rec.userId}, Type: ${rec.type}`);
      });
    } else {
      console.log('✅ No orphaned Recommendation records found');
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
