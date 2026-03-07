/**
 * Backfill ingredientSystemMap for existing recipes that were saved before
 * the per-ingredient defense-system mapping was introduced.
 *
 * Run once:
 *   npx ts-node --project tsconfig.json scripts/backfill-ingredient-system-map.ts
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { buildIngredientSystemMap } from '../lib/utils/food-matcher';

async function backfillIngredientSystemMap() {
  console.log('🔄 Starting ingredientSystemMap backfill...\n');

  // Only process recipes that have no map yet
  const recipes = await prisma.recipe.findMany({
    where: { ingredientSystemMap: { equals: Prisma.DbNull } },
    select: {
      id: true,
      title: true,
      ingredients: true,
      defenseSystems: true,
    },
  });

  console.log(`📋 Found ${recipes.length} recipe(s) without an ingredientSystemMap.\n`);

  // Load the food database once for all recipes
  const foodDatabase = await prisma.foodDatabase.findMany();

  let updated = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    const ingredients = (recipe.ingredients as Array<{ name: string }>);

    if (!ingredients || ingredients.length === 0) {
      skipped++;
      continue;
    }

    const map = await buildIngredientSystemMap(ingredients, foodDatabase);

    if (Object.keys(map).length === 0) {
      // No food-DB matches at all — leave null to avoid storing an empty object
      skipped++;
      continue;
    }

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { ingredientSystemMap: map },
    });

    console.log(`  ✅ ${recipe.title}`);
    console.log(`     Mapped ${Object.keys(map).length}/${ingredients.length} ingredient(s):`);
    for (const [name, systems] of Object.entries(map)) {
      const systemStr = Object.entries(systems)
        .map(([s, str]) => `${s}(${str})`)
        .join(', ');
      console.log(`       • ${name}: ${systemStr}`);
    }
    console.log();

    updated++;
  }

  console.log(`\n🎉 Backfill complete.`);
  console.log(`   Updated : ${updated} recipe(s)`);
  console.log(`   Skipped : ${skipped} recipe(s) (no ingredients or no DB matches)`);

  await prisma.$disconnect();
}

backfillIngredientSystemMap().catch((err) => {
  console.error('❌ Backfill failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
