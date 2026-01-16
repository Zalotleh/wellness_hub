import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mealPlanId = 'cmkgyj3uf000ljfbuytnsonxy';
  
  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      mealPlanId,
    },
    select: {
      id: true,
      date: true,
    },
  });
  
  console.log('Daily Menu Dates:');
  dailyMenus.forEach(dm => {
    console.log(`  ID: ${dm.id}`);
    console.log(`  Date object: ${dm.date}`);
    console.log(`  ISO String: ${dm.date.toISOString()}`);
    console.log(`  UTC Date: ${dm.date.toUTCString()}`);
    console.log();
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
