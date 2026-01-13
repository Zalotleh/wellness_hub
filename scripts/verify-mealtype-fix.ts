import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMealTypeFlow() {
  // Get the recent breakfast recipe
  const recipe = await prisma.recipe.findFirst({
    where: {
      userId: 'cmk8sltuv00026lmf3ui32pge',
      mealType: 'breakfast'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      mealType: true
    }
  });
  
  console.log('Breakfast recipe found:');
  console.log(JSON.stringify(recipe, null, 2));
  
  if (recipe && recipe.mealType) {
    console.log('\n✅ Recipe has mealType:', recipe.mealType);
    console.log('✅ Will be converted to uppercase:', recipe.mealType.toUpperCase());
    console.log('✅ This will be sent to the API as mealTime:', recipe.mealType.toUpperCase());
    console.log('\n📌 Expected behavior:');
    console.log(`   - Recipe saved with mealType: "${recipe.mealType}"`);
    console.log(`   - Log meal API will receive: { mealTime: "${recipe.mealType.toUpperCase()}" }`);
    console.log(`   - Database will store FoodConsumption with: mealTime = "${recipe.mealType.toUpperCase()}"`);
  }
  
  await prisma.$disconnect();
}

testMealTypeFlow();
