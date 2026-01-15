import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = 'cmk8sltuv00026lmf3ui32pge';

async function repairDefenseSystems() {
  try {
    console.log('🔄 Repairing defense systems for user food items...\n');
    
    // Get all user's food consumptions with food items
    const consumptions = await prisma.foodConsumption.findMany({
      where: { userId: USER_ID },
      include: {
        foodItems: {
          include: {
            defenseSystems: true
          }
        }
      }
    });
    
    console.log(`Found ${consumptions.length} consumptions`);
    
    let totalFixed = 0;
    let totalItems = 0;
    
    for (const consumption of consumptions) {
      console.log(`\nProcessing consumption from ${consumption.date.toISOString().split('T')[0]} (${consumption.mealTime})`);
      
      for (const foodItem of consumption.foodItems) {
        totalItems++;
        
        // Skip if already has defense systems
        if (foodItem.defenseSystems.length > 0) {
          console.log(`  ✓ ${foodItem.name} - already has ${foodItem.defenseSystems.length} systems`);
          continue;
        }
        
        // Look up in master food database
        const masterFood = await prisma.foodDatabase.findFirst({
          where: {
            name: {
              equals: foodItem.name,
              mode: 'insensitive'
            }
          }
        });
        
        if (masterFood && masterFood.systemBenefits) {
          // masterFood.systemBenefits is a JSON object like:
          // { "INFLAMMATION_CONTROL": "HIGH", "DNA_PROTECTION": "MEDIUM" }
          const systems = masterFood.systemBenefits as Record<string, string>;
          const systemsToCreate = Object.entries(systems).map(([system, strength]) => ({
            defenseSystem: system as any,
            strength: strength as any,
            foodItemId: foodItem.id
          }));
          
          if (systemsToCreate.length > 0) {
            await prisma.defenseSystemBenefit.createMany({
              data: systemsToCreate
            });
            
            console.log(`  ✅ ${foodItem.name} - added ${systemsToCreate.length} systems`);
            totalFixed++;
          }
        } else {
          console.log(`  ⚠️  ${foodItem.name} - not found in master database`);
        }
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`  Total food items: ${totalItems}`);
    console.log(`  Items fixed: ${totalFixed}`);
    console.log(`  Items not found: ${totalItems - totalFixed - consumptions.reduce((sum, c) => sum + c.foodItems.filter(f => f.defenseSystems.length > 0).length, 0)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

repairDefenseSystems();
