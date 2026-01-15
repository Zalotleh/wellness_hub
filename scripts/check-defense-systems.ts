import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDefenseSystems() {
  try {
    const foodItems = await prisma.foodItem.findMany({
      where: { consumptionId: { startsWith: 'cmk' } },
      include: { defenseSystems: true },
      take: 5
    });
    
    console.log('Sample food items:');
    foodItems.forEach(item => {
      console.log(`  - ${item.name}: ${item.defenseSystems.length} defense systems`);
    });
    
    const totalDefenseSystems = await prisma.defenseSystemBenefit.count();
    console.log(`\nTotal DefenseSystemBenefit records: ${totalDefenseSystems}`);
    
    const totalFoodItems = await prisma.foodItem.count({
      where: { consumptionId: { startsWith: 'cmk' } }
    });
    console.log(`Total FoodItem records: ${totalFoodItems}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDefenseSystems();
