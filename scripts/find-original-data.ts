import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = 'cmk8sltuv00026lmf3ui32pge';

async function findOriginalData() {
  try {
    // Find all DefenseSystemBenefit records
    const allBenefits = await prisma.defenseSystemBenefit.findMany({
      include: {
        foodItem: {
          include: {
            consumption: true
          }
        }
      }
    });
    
    // Filter for our user
    const userBenefits = allBenefits.filter(b => 
      b.foodItem.consumption.userId === USER_ID
    );
    
    console.log(`Found ${userBenefits.length} defense system benefits for user's food items`);
    
    if (userBenefits.length > 0) {
      console.log('\nSample benefits:');
      userBenefits.slice(0, 5).forEach(b => {
        console.log(`  - ${b.foodItem.name}: ${b.defenseSystem} (${b.strength})`);
        console.log(`    Food Item ID: ${b.foodItemId}`);
        console.log(`    Consumption ID: ${b.foodItem.consumptionId}`);
      });
    }
    
    // Group by consumption
    const byConsumption = userBenefits.reduce((acc:any, b) => {
      const cId = b.foodItem.consumptionId;
      if (!acc[cId]) acc[cId] = [];
      acc[cId].push(b);
      return acc;
    }, {});
    
    console.log(`\nDefense systems spread across ${Object.keys(byConsumption).length} consumptions`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findOriginalData();
