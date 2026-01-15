import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificItem() {
  try {
    // Check a food item that we know has defense systems
    const item = await prisma.foodItem.findFirst({
      where: { name: 'broccoli sprouts' },
      include: { defenseSystems: true }
    });
    
    console.log('Broccoli sprouts food item:');
    console.log(JSON.stringify(item, null, 2));
    
    // Check one from a consumption
    const consumption = await prisma.foodConsumption.findFirst({
      where: { userId: 'cmk8sltuv00026lmf3ui32pge' },
      include: {
        foodItems: {
          include: {
            defenseSystems: true
          }
        }
      }
    });
    
    console.log('\n\nFirst consumption with food items:');
    console.log(JSON.stringify(consumption, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificItem();
