import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess, Feature } from '@/lib/features/feature-flags';

interface ShoppingListItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
}

// POST - Create shopping list from multiple sources (meal plans or recipes)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      type, // 'meal-plans' or 'recipes'
      sourceIds, // Array of meal plan or recipe IDs
      title, // Optional custom title
      filterPantry = false // Optional pantry filtering
    } = body;

    if (!type || !sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Type and sourceIds are required.' },
        { status: 400 }
      );
    }

    // Check pantry feature permission if filtering is requested
    if (filterPantry) {
      // Get user with subscription info
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionTier: true,
          trialEndsAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const featureAccess = getUserFeatureAccess(user);
      if (!featureAccess.hasFeature(Feature.PANTRY_MANAGEMENT)) {
        return NextResponse.json(
          {
            error: 'Pantry management requires Premium',
            upgradeRequired: true,
            message: featureAccess.getUpgradeMessage(Feature.PANTRY_MANAGEMENT),
          },
          { status: 403 }
        );
      }
    }

    let consolidatedIngredients: ShoppingListItem[] = [];
    let generatedTitle = title;

    if (type === 'meal-plans') {
    // Fetch meal plans with their meals and ingredients through dailyMenus
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        id: { in: sourceIds },
        userId: session.user.id,
      },
      include: {
        dailyMenus: {
          include: {
            meals: {
              include: {
                generatedRecipe: true,
              },
            },
          },
        },
      },
    });      if (mealPlans.length === 0) {
        return NextResponse.json(
          { error: 'No valid meal plans found.' },
          { status: 404 }
        );
      }

      // Extract ingredients from all recipes in meal plans
      const allIngredients: Array<{item: string, quantity: string, unit: string}> = [];
      
      for (const mealPlan of mealPlans) {
        for (const dailyMenu of mealPlan.dailyMenus) {
          for (const meal of dailyMenu.meals) {
            if (meal.generatedRecipe && meal.generatedRecipe.ingredients) {
              const ingredients = Array.isArray(meal.generatedRecipe.ingredients) 
                ? meal.generatedRecipe.ingredients 
                : JSON.parse(meal.generatedRecipe.ingredients as string);
              
              for (const ingredient of ingredients) {
                // Handle both ingredient formats
                const item = ingredient.name || ingredient.ingredient || ingredient.item;
                const quantity = ingredient.amount || ingredient.quantity || '1';
                const unit = ingredient.unit || '';
                
                if (item) {
                  allIngredients.push({
                    item: item.trim(),
                    quantity: quantity.toString(),
                    unit: unit.trim(),
                  });
                }
              }
            }
          }
        }
      }

      consolidatedIngredients = consolidateIngredients(allIngredients);
      
      if (!generatedTitle) {
        generatedTitle = mealPlans.length === 1 
          ? `Shopping List - ${mealPlans[0].title}`
          : `Shopping List - ${mealPlans.length} Meal Plans`;
      }

    } else if (type === 'recipes') {
      // Handle recipes
      const recipes = await prisma.recipe.findMany({
        where: {
          id: { in: sourceIds },
          userId: session.user.id,
        },
      });

      if (recipes.length === 0) {
        return NextResponse.json(
          { error: 'No valid recipes found.' },
          { status: 404 }
        );
      }

      // Extract ingredients from all recipes
      const allIngredients: Array<{item: string, quantity: string, unit: string}> = [];
      
      for (const recipe of recipes) {
        if (recipe.ingredients) {
          const ingredients = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients 
            : JSON.parse(recipe.ingredients as string);
          
          for (const ingredient of ingredients) {
            // Handle both ingredient formats
            const item = ingredient.name || ingredient.ingredient || ingredient.item;
            const quantity = ingredient.amount || ingredient.quantity || '1';
            const unit = ingredient.unit || '';
            
            if (item) {
              allIngredients.push({
                item: item.trim(),
                quantity: quantity.toString(),
                unit: unit.trim(),
              });
            }
          }
        }
      }

      consolidatedIngredients = consolidateIngredients(allIngredients);
      
      if (!generatedTitle) {
        generatedTitle = recipes.length === 1 
          ? `Shopping List - ${recipes[0].title}`
          : `Shopping List - ${recipes.length} Recipes`;
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "meal-plans" or "recipes".' },
        { status: 400 }
      );
    }

    if (consolidatedIngredients.length === 0) {
      return NextResponse.json(
        { error: 'No ingredients found to create shopping list.' },
        { status: 400 }
      );
    }

    // Filter out pantry items if requested
    if (filterPantry) {
      const pantryItems = await prisma.pantryItem.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { alwaysHave: true },
            { quantity: { gt: 0 } },
          ],
        },
        select: {
          name: true,
          quantity: true,
          unit: true,
        },
      });

      const pantryMap = new Map(pantryItems.map(p => [p.name.toLowerCase(), p]));
      
      consolidatedIngredients = consolidatedIngredients.filter(item => {
        const pantryItem = pantryMap.get(item.ingredient.toLowerCase());
        if (!pantryItem) return true;
        
        // Simple check: if we have this item in pantry, skip it
        // TODO: Add proper unit conversion and quantity checking
        if (pantryItem.quantity && pantryItem.quantity > 0) {
          return false; // Have some in pantry, skip
        }
        
        return true; // Keep in shopping list
      });
    }

    // Create the shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: session.user.id,
        mealPlanId: type === 'meal-plans' && sourceIds.length === 1 ? sourceIds[0] : null,
        title: generatedTitle || 'Custom Shopping List',
        items: JSON.stringify(consolidatedIngredients),
        totalItems: consolidatedIngredients.length,
        pantryFiltered: filterPantry,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...shoppingList,
        items: consolidatedIngredients,
      },
      message: `Shopping list created successfully from ${sourceIds.length} ${type === 'meal-plans' ? 'meal plan' : 'recipe'}${sourceIds.length === 1 ? '' : 's'}`,
    });

  } catch (error) {
    console.error('Error creating shopping list from sources:', error);
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    );
  }
}

// Helper function to consolidate ingredients
function consolidateIngredients(items: Array<{item: string, quantity: string, unit: string}>): ShoppingListItem[] {
  const consolidated = new Map<string, ShoppingListItem>();

  items.forEach((item) => {
    if (!item.item?.trim()) return;

    const key = `${item.item.toLowerCase().trim()}-${item.unit.toLowerCase().trim()}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      // Try to add quantities if they're numeric
      const existingQty = parseFloat(existing.quantity.toString()) || 0;
      const newQty = parseFloat(item.quantity) || 0;
      
      if (existingQty > 0 && newQty > 0) {
        existing.quantity = existingQty + newQty;
      } else {
        // If not numeric, combine as text
        existing.quantity = `${existing.quantity}, ${item.quantity}` as any;
      }
    } else {
      consolidated.set(key, {
        ingredient: item.item.trim(),
        quantity: parseFloat(item.quantity) || item.quantity as any,
        unit: item.unit.trim(),
        category: categorizeIngredient(item.item),
        checked: false,
        estimatedCost: 0,
      });
    }
  });

  return Array.from(consolidated.values()).sort((a, b) => 
    a.category.localeCompare(b.category) || a.ingredient.localeCompare(b.ingredient)
  );
}

// Helper function to categorize ingredients
function categorizeIngredient(ingredient: string): string {
  const item = ingredient.toLowerCase();
  
  if (item.includes('meat') || item.includes('beef') || item.includes('chicken') || 
      item.includes('pork') || item.includes('fish') || item.includes('salmon') ||
      item.includes('turkey') || item.includes('lamb')) {
    return 'Meat & Seafood';
  }
  
  if (item.includes('milk') || item.includes('cheese') || item.includes('yogurt') ||
      item.includes('butter') || item.includes('cream') || item.includes('egg')) {
    return 'Dairy & Eggs';
  }
  
  if (item.includes('apple') || item.includes('banana') || item.includes('orange') ||
      item.includes('berry') || item.includes('grape') || item.includes('lemon') ||
      item.includes('fruit')) {
    return 'Fruits';
  }
  
  if (item.includes('carrot') || item.includes('onion') || item.includes('potato') ||
      item.includes('tomato') || item.includes('lettuce') || item.includes('pepper') ||
      item.includes('vegetable') || item.includes('spinach') || item.includes('broccoli')) {
    return 'Vegetables';
  }
  
  if (item.includes('bread') || item.includes('rice') || item.includes('pasta') ||
      item.includes('flour') || item.includes('cereal') || item.includes('grain')) {
    return 'Grains & Bakery';
  }
  
  if (item.includes('oil') || item.includes('vinegar') || item.includes('salt') ||
      item.includes('pepper') || item.includes('spice') || item.includes('herb') ||
      item.includes('sauce') || item.includes('dressing')) {
    return 'Condiments & Spices';
  }
  
  return 'Other';
}