import { prisma } from '../lib/prisma';

async function checkBreakfastRec() {
  console.log('=== Checking Breakfast Recommendation ===\n');
  
  const rec = await prisma.recommendation.findFirst({
    where: {
      title: { contains: 'BREAKFAST' },
      status: 'PENDING',
    },
  });
  
  if (!rec) {
    console.log('No breakfast recommendation found');
    return;
  }
  
  console.log('Title:', rec.title);
  console.log('Action Label:', rec.actionLabel);
  console.log('Action URL:', rec.actionUrl);
  console.log('Target Meal Time:', rec.targetMealTime);
  console.log('\nAction Data:');
  console.log(JSON.stringify(rec.actionData, null, 2));
  
  await prisma.$disconnect();
}

checkBreakfastRec()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
