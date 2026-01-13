import { prisma } from '../lib/prisma';
import { getUserDayRangeUTC } from '../lib/utils/timezone';

async function checkJohnMeals() {
  const userId = 'cmk8sltur00016lmf3wecitlc';
  const targetDate = new Date('2026-01-13');
  
  console.log('=== John Davis Meal Check ===\n');
  console.log(`User ID: ${userId}`);
  console.log(`Date: January 13, 2026\n`);
  
  // Get user's timezone
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, timezone: true },
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`User: ${user.name}`);
  console.log(`Timezone: ${user.timezone || 'UTC (not set)'}\n`);
  
  const userTimezone = user.timezone || 'UTC';
  
  // Get day range using timezone-aware utility
  const { start, end } = getUserDayRangeUTC(userTimezone, targetDate);
  
  console.log('Query Range (UTC):');
  console.log(`  Start: ${start.toISOString()}`);
  console.log(`  End:   ${end.toISOString()}\n`);
  
  // Query food consumptions
  const consumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
    orderBy: {
      mealTime: 'asc',
    },
  });
  
  console.log(`📊 Total Meals Logged: ${consumptions.length}\n`);
  
  if (consumptions.length === 0) {
    console.log('No meals found for this date.');
  } else {
    console.log('Meal Details:');
    console.log('-------------');
    consumptions.forEach((consumption, index) => {
      console.log(`\n${index + 1}. ${consumption.mealTime}`);
      console.log(`   Date: ${consumption.date.toISOString()}`);
      console.log(`   Source: ${consumption.sourceType}`);
      console.log(`   Food Items: ${consumption.foodItems?.length || 0}`);
      
      if (consumption.foodItems && consumption.foodItems.length > 0) {
        consumption.foodItems.forEach((item) => {
          const systems = item.defenseSystems?.map(ds => ds.defenseSystem).join(', ') || 'none';
          console.log(`     - ${item.name} (${systems})`);
        });
      }
    });
  }
  
  await prisma.$disconnect();
}

checkJohnMeals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
