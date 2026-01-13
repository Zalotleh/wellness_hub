import { prisma } from '../lib/prisma';

async function checkMicrobiomeRecommendation() {
  const recId = 'cmkbf6i660009g6upg6876ckk';
  
  console.log('=== Checking Microbiome Recommendation ===\n');
  
  const rec = await prisma.recommendation.findUnique({
    where: { id: recId },
  });
  
  if (!rec) {
    console.log('❌ Recommendation not found');
    return;
  }
  
  console.log('Title:', rec.title);
  console.log('Type:', rec.type);
  console.log('Status:', rec.status);
  console.log('Action URL:', rec.actionUrl);
  console.log('\nAction Data:', rec.actionData);
  console.log('Action Data Type:', typeof rec.actionData);
  console.log('Action Data JSON:', JSON.stringify(rec.actionData, null, 2));
  
  await prisma.$disconnect();
}

checkMicrobiomeRecommendation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
