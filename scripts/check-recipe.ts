import { prisma } from '../lib/prisma';

async function checkRecipe() {
  const recipeId = 'cmj4h6kw7003gtmqo17u2jh2l';
  
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      title: true,
      ingredients: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recipe) {
    console.log('Recipe not found');
    return;
  }

  console.log('\n=== RECIPE DETAILS ===');
  console.log('ID:', recipe.id);
  console.log('Title:', recipe.title);
  console.log('Created:', recipe.createdAt);
  console.log('Updated:', recipe.updatedAt);
  console.log('\n=== INGREDIENTS ===');
  
  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach((ingredient: any, index: number) => {
      console.log(`\n${index + 1}. ${ingredient.name || 'Unnamed ingredient'}`);
      console.log('   Raw data:', JSON.stringify(ingredient, null, 2));
      
      // Check different possible formats
      if (ingredient.quantity !== undefined && ingredient.unit !== undefined) {
        console.log('   ✓ New format: quantity + unit');
        console.log('   - Quantity:', ingredient.quantity);
        console.log('   - Unit:', ingredient.unit);
      } else if (ingredient.amount !== undefined) {
        console.log('   ✓ Old format: amount (combined)');
        console.log('   - Amount:', ingredient.amount);
      } else {
        console.log('   ⚠ Unknown format');
      }
    });
  } else {
    console.log('Ingredients is not an array:', recipe.ingredients);
  }

  await prisma.$disconnect();
}

checkRecipe().catch(console.error);
