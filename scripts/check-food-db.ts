import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFoodDatabase() {
  try {
    const count = await prisma.foodDatabase.count();
    console.log(`Total items in FoodDatabase: ${count}`);
    
    const sample = await prisma.foodDatabase.findMany({ take: 10 });
    console.log('\nSample foods:');
    sample.forEach(f => console.log(`  - ${f.name} (${f.category})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFoodDatabase();
