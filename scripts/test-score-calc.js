const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testScoreCalculation() {
  const userId = 'cmk8iqvfs0001grf3xfj0ofc9'; // john@example.com
  const date = new Date('2026-01-10');
  
  console.log('Testing score calculation for', date.toISOString().split('T')[0]);
  
  // Normalize date like the API does
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const normalizedDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  console.log('Normalized date:', normalizedDate.toISOString());
  
  // Query like calculate5x5x5Score does
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: {
      userId,
      date: normalizedDate,
    },
    include: {
      foodItems: {
        include: {
          defenseSystems: true,
        },
      },
    },
  });
  
  console.log(`\nFound ${foodConsumptions.length} food consumption entries`);
  
  if (foodConsumptions.length > 0) {
    foodConsumptions.forEach((consumption, i) => {
      console.log(`\nEntry ${i + 1}:`);
      console.log(`  Date: ${consumption.date.toISOString()}`);
      console.log(`  Meal Time: ${consumption.mealTime}`);
      console.log(`  Food Items: ${consumption.foodItems.length}`);
      
      // Group by defense system
      const systemGroups = new Map();
      consumption.foodItems.forEach(foodItem => {
        foodItem.defenseSystems.forEach(sysBenefit => {
          const system = sysBenefit.defenseSystem;
          if (!systemGroups.has(system)) {
            systemGroups.set(system, []);
          }
          systemGroups.get(system).push(foodItem.name);
        });
      });
      
      console.log('  Defense Systems:');
      systemGroups.forEach((foods, system) => {
        console.log(`    ${system}: ${foods.length} foods`);
      });
    });
  } else {
    console.log('\n❌ No entries found! This is why score shows zeros.');
    console.log('\nChecking what dates exist in database:');
    
    const allConsumptions = await prisma.foodConsumption.findMany({
      where: { userId },
      select: { date: true },
    });
    
    console.log('Dates in database:');
    allConsumptions.forEach(c => {
      console.log(`  - ${c.date.toISOString()}`);
    });
  }
  
  await prisma.$disconnect();
}

testScoreCalculation().catch(console.error);
