import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mealPlanId = 'cmkgvc0uy0005bchx1twot85j'; // The incorrect meal plan
  
  console.log('🔍 Deleting meal plan:', mealPlanId);
  
  // Delete the meal plan (cascades will delete dailyMenus and meals)
  await prisma.mealPlan.delete({
    where: { id: mealPlanId },
  });
  
  console.log('✅ Meal plan deleted successfully');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
