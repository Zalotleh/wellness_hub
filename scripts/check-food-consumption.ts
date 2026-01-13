import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFoodConsumption() {
  const consumption = await prisma.foodConsumption.findMany({
    where: {
      userId: 'cmk8sltuv00026lmf3ui32pge',
      recipeId: 'cmkcqnx1l0003lbpynoatysms'
    },
    select: {
      id: true,
      mealTime: true,
      date: true,
      createdAt: true,
      recipe: {
        select: {
          title: true,
          mealType: true
        }
      }
    }
  });
  
  console.log('Food consumption entries for this recipe:');
  console.log(JSON.stringify(consumption, null, 2));
  
  await prisma.$disconnect();
}

checkFoodConsumption();
