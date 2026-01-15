#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.defenseSystemBenefit.count({
    where: {
      foodItem: {
        consumption: {
          userId: 'cmk8sltuv00026lmf3ui32pge'
        }
      }
    }
  });
  console.log(`DefenseSystemBenefits for user: ${count}`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
