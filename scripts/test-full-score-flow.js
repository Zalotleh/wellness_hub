const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullScoreFlow() {
  const userId = 'cmk8iqvfs0001grf3xfj0ofc9';
  const dateStr = '2026-01-10';
  const date = new Date(dateStr);
  
  console.log('=== Testing Full Score Calculation Flow ===\n');
  console.log('Input date string:', dateStr);
  console.log('Parsed date:', date.toISOString());
  
  // Step 1: Normalize date (like getCachedOrCalculateScore does)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dateOnly = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  console.log('Normalized date for query:', dateOnly.toISOString());
  
  // Step 2: Check cache (like getCachedOrCalculateScore does)
  const cached = await prisma.dailyProgressScore.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
  });
  
  console.log('\nCached score:', cached ? 'FOUND' : 'NOT FOUND');
  
  if (cached) {
    console.log('  - Overall Score:', cached.overallScore);
    console.log('  - Systems: ANG=' + cached.angiogenesisCount);
  }
  
  // Step 3: Calculate fresh (like calculate5x5x5Score does)
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: dateOnly,
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
  });
  
  console.log('\n=== Fresh Calculation ===');
  console.log('Food consumptions found:', foodConsumptions.length);
  
  if (foodConsumptions.length > 0) {
    console.log('\n✅ SUCCESS: Found food consumption data');
    
    // Count defense systems
    const systemCounts = {};
    foodConsumptions.forEach(consumption => {
      consumption.foodItems.forEach(foodItem => {
        foodItem.defenseSystems.forEach(sysBenefit => {
          const system = sysBenefit.defenseSystem;
          systemCounts[system] = (systemCounts[system] || 0) + 1;
        });
      });
    });
    
    console.log('\nDefense System Counts:');
    Object.entries(systemCounts).forEach(([system, count]) => {
      console.log(`  ${system}: ${count} foods`);
    });
    
    console.log('\n📊 Expected Score Metrics:');
    console.log(`  - Systems Covered: ${Object.keys(systemCounts).length}/5`);
    console.log(`  - Total Foods: ${Object.values(systemCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`  - ANGIOGENESIS Progress: ${systemCounts.ANGIOGENESIS || 0}/5`);
    
  } else {
    console.log('\n❌ PROBLEM: No food consumption data found');
    console.log('This would result in zeros showing on the UI');
    
    // Debug: Check what dates exist
    const allDates = await prisma.foodConsumption.findMany({
      where: { userId },
      select: { date: true },
    });
    
    console.log('\nDates in database:');
    allDates.forEach(entry => {
      console.log(`  - ${entry.date.toISOString()}`);
      console.log(`    Matches query date? ${entry.date.getTime() === dateOnly.getTime()}`);
    });
  }
  
  await prisma.$disconnect();
}

testFullScoreFlow().catch(console.error);
