import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking column types...\n');
  
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      table_name, 
      column_name, 
      data_type,
      datetime_precision
    FROM information_schema.columns 
    WHERE table_name IN ('DailyMenu', 'FoodConsumption', 'DailyProgressScore')
    AND column_name = 'date'
    ORDER BY table_name;
  `;
  
  console.log('Date Column Types:');
  result.forEach(row => {
    console.log(`  Table: ${row.table_name}`);
    console.log(`  Column: ${row.column_name}`);
    console.log(`  Type: ${row.data_type}`);
    console.log(`  Precision: ${row.datetime_precision}`);
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
