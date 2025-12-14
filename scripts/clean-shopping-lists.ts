// Script to clean shopping list data from unit "0" issues

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanShoppingListData() {
  console.log('🧹 Starting shopping list data cleanup...');
  
  try {
    // Fetch all shopping lists
    const lists = await prisma.shoppingList.findMany({
      select: {
        id: true,
        items: true,
        title: true,
      },
    });
    
    console.log(`📦 Found ${lists.length} shopping lists to process`);
    
    let updatedCount = 0;
    
    for (const list of lists) {
      let items: any[] = [];
      let needsUpdate = false;
      
      // Parse items
      if (Array.isArray(list.items)) {
        items = list.items;
      } else if (typeof list.items === 'string') {
        try {
          items = JSON.parse(list.items);
        } catch (e) {
          console.error(`❌ Failed to parse items for list ${list.id}`);
          continue;
        }
      } else if (list.items && typeof list.items === 'object') {
        items = Object.values(list.items);
      }
      
      // Clean each item
      const cleanedItems = items.map((item: any) => {
        const cleaned = { ...item };
        let itemChanged = false;
        
        // Clean unit field
        if (cleaned.unit === '0' || cleaned.unit === 0 || cleaned.unit === null) {
          cleaned.unit = '';
          itemChanged = true;
        }
        
        // Ensure quantity is proper type
        if (typeof cleaned.quantity === 'string') {
          const numQty = parseFloat(cleaned.quantity);
          if (!isNaN(numQty)) {
            cleaned.quantity = numQty;
            itemChanged = true;
          }
        }
        
        // Clean retailUnit
        if (cleaned.retailUnit === '0' || cleaned.retailUnit === 0 || cleaned.retailUnit === null) {
          cleaned.retailUnit = undefined;
          itemChanged = true;
        }
        
        if (itemChanged) {
          needsUpdate = true;
        }
        
        return cleaned;
      });
      
      // Update if needed
      if (needsUpdate) {
        await prisma.shoppingList.update({
          where: { id: list.id },
          data: {
            items: JSON.stringify(cleanedItems),
            totalItems: cleanedItems.length,
          },
        });
        
        updatedCount++;
        console.log(`✅ Cleaned list: ${list.title} (${list.id})`);
      }
    }
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   Updated: ${updatedCount} lists`);
    console.log(`   Unchanged: ${lists.length - updatedCount} lists`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  cleanShoppingListData();
}

export { cleanShoppingListData };
