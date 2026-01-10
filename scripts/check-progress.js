const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
  console.log('Checking progress data for ziadmn@yahoo.com...\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'ziadmn@yahoo.com' },
    include: {
      foodConsumptions: {
        orderBy: { date: 'desc' },
        take: 10
      }
    }
  });
  
  if (!user) {
    console.log('User not found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Total progress entries:', user.foodConsumptions.length);
  console.log('\nRecent entries:');
  user.foodConsumptions.forEach(entry => {
    console.log(`- ${entry.date.toISOString().split('T')[0]} | ${entry.defenseSystem} | ${entry.mealTime} | Foods: ${entry.foodsConsumed.length} | Count: ${entry.count}`);
  });
  
  if (user.foodConsumptions.length === 0) {
    console.log('\nNo progress entries found! This is why welcome state shows.');
  }
  
  await prisma.$disconnect();
}

checkProgress().catch(console.error);
