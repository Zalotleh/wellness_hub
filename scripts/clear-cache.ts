import { prisma } from '../lib/prisma';

async function clearCache() {
  console.log('🗑️  Clearing all cached progress scores...\n');
  
  const result = await prisma.dailyProgressScore.deleteMany({});
  
  console.log(`✅ Deleted ${result.count} cached score entries`);
  console.log('\nFresh scores will be calculated on next page load with timezone-aware code!');
  
  await prisma.$disconnect();
}

clearCache()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
