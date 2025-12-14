const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecipe() {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: 'cmj4h6kw7003gtmqo17u2jh2l' },
      select: {
        id: true,
        title: true,
        ingredients: true,
        createdAt: true,
      },
    });

    if (!recipe) {
      console.log('❌ Recipe not found');
      await prisma.$disconnect();
      return;
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RECIPE DETAILS                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📝 Title:', recipe.title);
    console.log('🆔 ID:', recipe.id);
    console.log('📅 Created:', recipe.createdAt.toISOString());
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    INGREDIENTS LIST                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    recipe.ingredients.forEach((ing, i) => {
      console.log(`${i + 1}. 🥕 ${ing.name}`);
      
      // Check format
      if (ing.quantity !== undefined && ing.unit !== undefined) {
        console.log(`   ✅ Format: NEW (quantity + unit)`);
        console.log(`   📊 Quantity: ${ing.quantity}`);
        console.log(`   📏 Unit: ${ing.unit || '(none)'}`);
      } else if (ing.amount !== undefined) {
        console.log(`   ⚠️  Format: OLD (combined amount)`);
        console.log(`   📊 Amount: ${ing.amount}`);
      } else {
        console.log(`   ❓ Format: UNKNOWN`);
      }
      
      console.log(`   📋 Raw JSON: ${JSON.stringify(ing)}`);
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkRecipe();
