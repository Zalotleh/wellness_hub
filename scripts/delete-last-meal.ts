import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLastMeal() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  // Find all meals for this user
  const meals = await prisma.foodConsumption.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      mealTime: true,
      date: true,
      createdAt: true,
      recipe: {
        select: {
          title: true
        }
      }
    }
  });
  
  console.log(`Found ${meals.length} meals for user ${userId}:\n`);
  meals.forEach((meal, index) => {
    console.log(`${index + 1}. ${meal.id}`);
    console.log(`   Meal Time: ${meal.mealTime}`);
    console.log(`   Date: ${meal.date}`);
    console.log(`   Created: ${meal.createdAt}`);
    console.log(`   Recipe: ${meal.recipe?.title || 'N/A'}`);
    console.log('');
  });
  
  if (meals.length === 0) {
    console.log('No meals to delete');
    await prisma.$disconnect();
    return;
  }
  
  // Delete the most recent meal (first in the list since we sorted by createdAt desc)
  const mealToDelete = meals[0];
  
  console.log(`\nDeleting most recent meal: ${mealToDelete.id}`);
  console.log(`Recipe: ${mealToDelete.recipe?.title || 'N/A'}`);
  console.log(`Meal Time: ${mealToDelete.mealTime}`);
  console.log(`Created: ${mealToDelete.createdAt}`);
  
  await prisma.foodConsumption.delete({
    where: {
      id: mealToDelete.id
    }
  });
  
  console.log('\n✅ Meal deleted successfully!');
  
  // Show remaining meals
  const remainingMeals = await prisma.foodConsumption.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\nRemaining meals: ${remainingMeals.length}`);
  
  await prisma.$disconnect();
}

deleteLastMeal();
