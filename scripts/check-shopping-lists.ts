import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShoppingLists() {
  const userId = 'cmk8sltuv00026lmf3ui32pge';
  
  const lists = await prisma.shoppingList.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      mealPlan: true
    }
  });
  
  console.log(`Found ${lists.length} shopping lists for user ${userId}:\n`);
  
  lists.forEach((list, index) => {
    console.log(`${index + 1}. ${list.title}`);
    console.log(`   ID: ${list.id}`);
    console.log(`   Created: ${list.createdAt}`);
    console.log(`   Items type: ${typeof list.items}`);
    console.log(`   Items value:`, list.items);
    
    // Try to parse items
    let items = [];
    if (Array.isArray(list.items)) {
      items = list.items;
    } else if (typeof list.items === 'string') {
      try {
        items = JSON.parse(list.items);
      } catch (e) {
        console.log('   ⚠️ Failed to parse items as JSON');
      }
    } else if (list.items && typeof list.items === 'object') {
      items = Object.values(list.items);
    }
    
    console.log(`   Parsed items count: ${items.length}`);
    if (items.length > 0) {
      console.log(`   First item:`, items[0]);
    }
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkShoppingLists();
