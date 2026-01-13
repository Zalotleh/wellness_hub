import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentRecipe() {
  const recipe = await prisma.recipe.findFirst({
    where: {
      userId: 'cmk8sltuv00026lmf3ui32pge'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      mealType: true,
      createdAt: true
    }
  });
  
  console.log('Most recent recipe:');
  console.log(JSON.stringify(recipe, null, 2));
  
  await prisma.$disconnect();
}

checkRecentRecipe();
