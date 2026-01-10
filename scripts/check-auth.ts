import { prisma } from '../lib/prisma';

async function checkAuth() {
  try {
    console.log('Checking authentication tables...\n');
    
    // Check accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
      }
    });

    console.log(`Accounts: ${accounts.length}`);
    accounts.forEach(acc => {
      console.log(`  - Provider: ${acc.provider}, UserID: ${acc.userId}`);
    });

    // Check sessions
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        expires: true,
        sessionToken: true,
      }
    });

    console.log(`\nSessions: ${sessions.length}`);
    sessions.forEach(sess => {
      console.log(`  - UserID: ${sess.userId}, Expires: ${sess.expires}, Active: ${sess.expires > new Date()}`);
    });

    // Check if we can determine the missing user email from anywhere
    console.log('\nLooking for user traces in other tables...');
    
    const recipes = await prisma.recipe.findMany({
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const progress = await prisma.progress.findMany({
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const uniqueUserIds = new Set([
      ...accounts.map(a => a.userId),
      ...sessions.map(s => s.userId),
      ...recipes.map(r => r.userId),
      ...progress.map(p => p.userId),
    ]);

    console.log(`\nFound ${uniqueUserIds.size} unique user IDs referenced across tables:`);
    uniqueUserIds.forEach(id => console.log(`  - ${id}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuth();
