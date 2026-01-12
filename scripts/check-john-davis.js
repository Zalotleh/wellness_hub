const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' },
    select: { id: true, name: true, email: true }
  });
  
  if (!user) {
    console.log('❌ User john@example.com not found');
    return;
  }
  
  console.log('✅ User:', user.name, `(${user.email})`);
  console.log('');
  
  // Check FoodConsumption entries
  const foodConsumptions = await prisma.foodConsumption.findMany({
    where: { userId: user.id },
    include: {
      foodItems: {
        include: {
          defenseSystems: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });
  
  console.log('📊 FoodConsumption entries:', foodConsumptions.length);
  
  if (foodConsumptions.length > 0) {
    console.log('\nRecent entries:');
    foodConsumptions.slice(0, 5).forEach(fc => {
      const dateStr = fc.date.toISOString().split('T')[0];
      const foodCount = fc.foodItems.length;
      const foodNames = fc.foodItems.map(f => f.name).join(', ');
      console.log(`  - ${fc.mealTime} on ${dateStr}: ${foodCount} food(s) - ${foodNames}`);
    });
  } else {
    console.log('  ⚠️  No food consumption data found!');
  }
  
  console.log('');
  
  // Check Progress entries (old table)
  const progress = await prisma.progress.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  
  console.log('📈 Progress entries (old table):', progress.length);
  
  if (progress.length > 0) {
    console.log('\nRecent entries:');
    progress.slice(0, 3).forEach(p => {
      const dateStr = p.date.toISOString().split('T')[0];
      console.log(`  - ${p.defenseSystem} on ${dateStr}: ${p.count} foods`);
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
