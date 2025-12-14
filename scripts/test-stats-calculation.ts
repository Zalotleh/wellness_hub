import { prisma } from '../lib/prisma';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

async function testStatsCalculation() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'ziad', mode: 'insensitive' } },
          { name: { contains: 'ziad', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const baseDate = new Date();
    const startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(baseDate, { weekStartsOn: 1 });

    console.log('\n📅 Week Range:');
    console.log('Start:', format(startDate, 'yyyy-MM-dd'));
    console.log('End:', format(endDate, 'yyyy-MM-dd'));

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

    console.log('\n📊 Found Entries:', progressEntries.length);

    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    console.log('\n📆 Daily Breakdown:');
    const dailyStats = daysInRange.map((day) => {
      const dayString = format(day, 'yyyy-MM-dd');
      const dayEntries = progressEntries.filter(
        (entry) => format(new Date(entry.date), 'yyyy-MM-dd') === dayString
      );

      console.log(`\n${format(day, 'EEE, MMM dd')}:`);
      console.log(`  Entries: ${dayEntries.length}`);
      
      let totalFoods = 0;
      dayEntries.forEach(entry => {
        console.log(`    ${entry.defenseSystem}: ${entry.count} foods`);
        totalFoods += entry.count;
      });
      console.log(`  Total Foods: ${totalFoods}`);

      return {
        date: dayString,
        entries: dayEntries.length,
        totalFoods,
      };
    });

    const totalFoodsLogged = progressEntries.reduce((sum, entry) => sum + entry.count, 0);
    const maxPossibleFoods = daysInRange.length * 5 * 5;
    const overallCompletion = Math.round((totalFoodsLogged / maxPossibleFoods) * 100);

    console.log('\n📈 Weekly Summary:');
    console.log(`Total Foods Logged: ${totalFoodsLogged}`);
    console.log(`Max Possible: ${maxPossibleFoods}`);
    console.log(`Overall Completion: ${overallCompletion}%`);
    console.log(`Days Active: ${[...new Set(progressEntries.map(e => e.date.getTime()))].length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

testStatsCalculation();
