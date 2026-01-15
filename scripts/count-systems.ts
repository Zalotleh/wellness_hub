import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.defenseSystemBenefit.count({
  where: {
    foodItem: {
      consumption: {
        userId: 'cmk8sltuv00026lmf3ui32pge'
      }
    }
  }
}).then(count => {
  console.log('Defense systems for user:', count);
  return prisma.$disconnect();
}).then(() => process.exit(0));
