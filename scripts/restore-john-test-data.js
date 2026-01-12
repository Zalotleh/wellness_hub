const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Restoring test data for John Davis...\n');

  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });

  if (!user) {
    console.log('❌ User john@example.com not found');
    return;
  }

  console.log('✅ Found user:', user.name);

  // Get today's date normalized to UTC noon
  const today = new Date();
  const normalizedToday = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    12, 0, 0
  ));

  // Get yesterday
  const yesterday = new Date(normalizedToday);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  // Get 2 days ago
  const twoDaysAgo = new Date(normalizedToday);
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

  console.log('\n📅 Creating entries for:');
  console.log(`  - Today: ${normalizedToday.toISOString().split('T')[0]}`);
  console.log(`  - Yesterday: ${yesterday.toISOString().split('T')[0]}`);
  console.log(`  - 2 days ago: ${twoDaysAgo.toISOString().split('T')[0]}`);

  // Sample food data for today - Complete 5x5x5
  const todayFoods = [
    // Breakfast
    { mealTime: 'BREAKFAST', name: 'Blueberries', systems: ['ANGIOGENESIS', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'BREAKFAST', name: 'Greek Yogurt', systems: ['MICROBIOME', 'REGENERATION'] },
    { mealTime: 'BREAKFAST', name: 'Walnuts', systems: ['DNA_PROTECTION', 'REGENERATION'] },
    
    // Lunch
    { mealTime: 'LUNCH', name: 'Salmon', systems: ['ANGIOGENESIS', 'REGENERATION', 'IMMUNITY'] },
    { mealTime: 'LUNCH', name: 'Kale', systems: ['ANGIOGENESIS', 'REGENERATION', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'LUNCH', name: 'Broccoli', systems: ['ANGIOGENESIS', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'LUNCH', name: 'Olive Oil', systems: ['ANGIOGENESIS', 'IMMUNITY'] },
    
    // Afternoon Snack
    { mealTime: 'AFTERNOON_SNACK', name: 'Apples', systems: ['ANGIOGENESIS', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'AFTERNOON_SNACK', name: 'Almonds', systems: ['DNA_PROTECTION', 'IMMUNITY'] },
    
    // Dinner
    { mealTime: 'DINNER', name: 'Tomatoes', systems: ['ANGIOGENESIS', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'DINNER', name: 'Garlic', systems: ['ANGIOGENESIS', 'MICROBIOME', 'IMMUNITY'] },
    { mealTime: 'DINNER', name: 'Mushrooms', systems: ['REGENERATION', 'IMMUNITY'] },
    { mealTime: 'DINNER', name: 'Sauerkraut', systems: ['MICROBIOME', 'REGENERATION'] },
    { mealTime: 'DINNER', name: 'Green Tea', systems: ['ANGIOGENESIS', 'DNA_PROTECTION'] },
  ];

  // Yesterday - Partial progress
  const yesterdayFoods = [
    { mealTime: 'BREAKFAST', name: 'Blueberries', systems: ['ANGIOGENESIS', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'BREAKFAST', name: 'Walnuts', systems: ['DNA_PROTECTION', 'REGENERATION'] },
    { mealTime: 'LUNCH', name: 'Salmon', systems: ['ANGIOGENESIS', 'REGENERATION', 'IMMUNITY'] },
    { mealTime: 'LUNCH', name: 'Broccoli', systems: ['ANGIOGENESIS', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'DINNER', name: 'Kale', systems: ['ANGIOGENESIS', 'REGENERATION', 'DNA_PROTECTION', 'IMMUNITY'] },
  ];

  // 2 days ago - Minimal progress
  const twoDaysAgoFoods = [
    { mealTime: 'BREAKFAST', name: 'Apples', systems: ['ANGIOGENESIS', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'] },
    { mealTime: 'LUNCH', name: 'Tomatoes', systems: ['ANGIOGENESIS', 'DNA_PROTECTION', 'IMMUNITY'] },
  ];

  // Helper function to create consumption entries
  async function createConsumptions(date, foods) {
    const grouped = foods.reduce((acc, food) => {
      if (!acc[food.mealTime]) acc[food.mealTime] = [];
      acc[food.mealTime].push(food);
      return acc;
    }, {});

    for (const [mealTime, mealFoods] of Object.entries(grouped)) {
      await prisma.foodConsumption.create({
        data: {
          userId: user.id,
          mealTime,
          sourceType: 'MANUAL',
          date,
          foodItems: {
            create: mealFoods.map(food => ({
              name: food.name,
              quantity: 1,
              unit: 'serving',
              defenseSystems: {
                create: food.systems.map(system => ({
                  defenseSystem: system,
                  strength: 'MEDIUM',
                }))
              }
            }))
          }
        }
      });
    }
  }

  console.log('\n🍽️  Creating food consumption entries...');
  
  await createConsumptions(normalizedToday, todayFoods);
  console.log(`  ✅ Today: ${todayFoods.length} foods across ${new Set(todayFoods.map(f => f.mealTime)).size} meals`);
  
  await createConsumptions(yesterday, yesterdayFoods);
  console.log(`  ✅ Yesterday: ${yesterdayFoods.length} foods across ${new Set(yesterdayFoods.map(f => f.mealTime)).size} meals`);
  
  await createConsumptions(twoDaysAgo, twoDaysAgoFoods);
  console.log(`  ✅ 2 days ago: ${twoDaysAgoFoods.length} foods across ${new Set(twoDaysAgoFoods.map(f => f.mealTime)).size} meals`);

  console.log('\n✨ Test data restored successfully!');
  console.log('\n💡 You should now see progress on the dashboard.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
