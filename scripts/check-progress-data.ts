import { prisma } from '../lib/prisma';
import { startOfWeek, endOfWeek, format } from 'date-fns';

async function checkProgressData() {
  try {
    // Find user ziad
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'ziad', mode: 'insensitive' } },
          { name: { contains: 'ziad', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      console.log('❌ User ziad not found');
      return;
    }

    console.log('\n✅ Found user:', user);

    // Get current week
    const now = new Date();
    const startDate = startOfWeek(now, { weekStartsOn: 1 });
    const endDate = endOfWeek(now, { weekStartsOn: 1 });

    console.log('\n📅 Date Range:');
    console.log('  Start:', format(startDate, 'yyyy-MM-dd (EEEE)'));
    console.log('  End:', format(endDate, 'yyyy-MM-dd (EEEE)'));
    console.log('  Today:', format(now, 'yyyy-MM-dd (EEEE)'));

    // Get all progress entries for this week
    const progressEntries = await prisma.progress.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    console.log('\n📊 Progress Entries Found:', progressEntries.length);

    if (progressEntries.length === 0) {
      console.log('❌ No progress entries found for this week');
    } else {
      console.log('\n📝 Detailed Entries:');
      progressEntries.forEach((entry, index) => {
        console.log(`\n${index + 1}. ${format(new Date(entry.date), 'yyyy-MM-dd (EEEE)')}`);
        console.log('   System:', entry.defenseSystem);
        console.log('   Foods:', entry.foodsConsumed);
        console.log('   Count:', entry.count);
        console.log('   Created:', entry.createdAt);
      });
    }

    // Get ALL progress entries for this user (not just this week)
    const allEntries = await prisma.progress.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    console.log('\n📋 Recent 20 Progress Entries (All Time):');
    if (allEntries.length === 0) {
      console.log('❌ No progress entries found at all');
    } else {
      allEntries.forEach((entry, index) => {
        console.log(`\n${index + 1}. ${format(new Date(entry.date), 'yyyy-MM-dd (EEEE)')}`);
        console.log('   System:', entry.defenseSystem);
        console.log('   Count:', entry.count);
        console.log('   Foods:', JSON.stringify(entry.foodsConsumed));
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkProgressData();
