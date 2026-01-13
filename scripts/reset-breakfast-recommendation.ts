import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetBreakfastRecommendation() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  // Find the COMPLETED breakfast recommendation
  const rec = await prisma.recommendation.findFirst({
    where: {
      userId: userId,
      status: 'COMPLETED',
      description: {
        contains: 'BREAKFAST'
      }
    }
  });
  
  if (!rec) {
    console.log('No completed breakfast recommendation found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Found COMPLETED breakfast recommendation:');
  console.log(`  ID: ${rec.id}`);
  console.log(`  Title: ${rec.title}`);
  console.log(`  Status: ${rec.status}`);
  console.log(`  Completed At: ${rec.completedAt}`);
  console.log(`  Linked Meal Log: ${rec.linkedMealLogId}`);
  
  // Reset to PENDING and clear completion data
  const updated = await prisma.recommendation.update({
    where: { id: rec.id },
    data: {
      status: 'PENDING',
      completedAt: null,
      linkedMealLogId: null
    }
  });
  
  console.log('\n✅ Recommendation reset to PENDING');
  console.log(`  New Status: ${updated.status}`);
  
  await prisma.$disconnect();
}

resetBreakfastRecommendation();
