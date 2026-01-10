const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRecommendationFlow() {
  const userId = 'cmk8iqvfs0001grf3xfj0ofc9';
  const dateStr = '2026-01-10';
  const rawDate = new Date(dateStr);
  
  console.log('=== Testing Recommendation Generation Flow ===\n');
  
  // Normalize date like the API does now
  const year = rawDate.getUTCFullYear();
  const month = rawDate.getUTCMonth();
  const day = rawDate.getUTCDate();
  const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  console.log('Normalized date:', date.toISOString());
  
  // Check for existing recommendations
  const existingRecs = await prisma.recommendation.findMany({
    where: {
      userId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });
  
  console.log(`\nExisting recommendations: ${existingRecs.length}`);
  
  if (existingRecs.length > 0) {
    console.log('\n❌ PROBLEM: Stale recommendations exist');
    existingRecs.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec.title} - ${rec.targetSystem}`);
    });
    console.log('\nThese should be deleted for fresh generation.');
  } else {
    console.log('✅ No cached recommendations - fresh generation will occur');
  }
  
  // Query food consumptions like calculate5x5x5Score does
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: date,
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
  });
  
  console.log(`\nFood consumptions found: ${foodConsumptions.length}`);
  
  if (foodConsumptions.length > 0) {
    // Analyze what systems are covered
    const systemCounts = {};
    foodConsumptions.forEach(consumption => {
      consumption.foodItems.forEach(foodItem => {
        foodItem.defenseSystems.forEach(sysBenefit => {
          const system = sysBenefit.defenseSystem;
          systemCounts[system] = (systemCounts[system] || 0) + 1;
        });
      });
    });
    
    console.log('\n📊 Current Progress:');
    const allSystems = ['ANGIOGENESIS', 'REGENERATION', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'];
    allSystems.forEach(system => {
      const count = systemCounts[system] || 0;
      const status = count === 0 ? '❌ MISSING' : count < 5 ? '⚠️  WEAK' : '✅ COMPLETE';
      console.log(`  ${system}: ${count}/5 ${status}`);
    });
    
    const missingSystems = allSystems.filter(s => !systemCounts[s] || systemCounts[s] === 0);
    const weakSystems = allSystems.filter(s => systemCounts[s] > 0 && systemCounts[s] < 5);
    
    console.log('\n📋 Expected Recommendations:');
    if (missingSystems.length > 0) {
      console.log(`  - Should recommend adding: ${missingSystems.join(', ')}`);
    }
    if (weakSystems.length > 0) {
      console.log(`  - Systems needing more foods: ${weakSystems.join(', ')}`);
    }
    
    console.log('\n❌ SHOULD NOT recommend:');
    Object.entries(systemCounts).forEach(([system, count]) => {
      if (count > 0) {
        console.log(`  - "${system}" (already has ${count} foods)`);
      }
    });
  }
  
  await prisma.$disconnect();
}

testRecommendationFlow().catch(console.error);
