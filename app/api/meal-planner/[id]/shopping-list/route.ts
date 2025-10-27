import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess, Feature } from '@/lib/features/feature-flags';

interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  originalUnit?: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  notes?: string;
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    defenseSystems?: string[];
  };
}

// Enhanced category mapping with more comprehensive keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Produce': [
    'lettuce', 'tomato', 'onion', 'garlic', 'spinach', 'broccoli', 'carrot', 'pepper', 'cucumber', 
    'avocado', 'banana', 'apple', 'berries', 'lemon', 'lime', 'herbs', 'cilantro', 'parsley', 
    'basil', 'mint', 'oregano', 'thyme', 'rosemary', 'kale', 'cabbage', 'celery', 'potato', 
    'sweet potato', 'mushroom', 'zucchini', 'eggplant', 'cauliflower', 'asparagus', 'green beans',
    'orange', 'grapefruit', 'strawberry', 'blueberry', 'raspberry', 'grape', 'pineapple', 'mango'
  ],
  'Proteins': [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'eggs', 'tofu', 
    'tempeh', 'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans', 'quinoa', 
    'nuts', 'almonds', 'walnuts', 'peanuts', 'seeds', 'chia seeds', 'hemp seeds'
  ],
  'Dairy': [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'greek yogurt', 'cottage cheese',
    'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta', 'cream cheese'
  ],
  'Grains & Pasta': [
    'rice', 'brown rice', 'wild rice', 'pasta', 'bread', 'tortilla', 'oats', 'flour', 'couscous',
    'barley', 'bulgur', 'quinoa', 'millet', 'buckwheat', 'whole wheat', 'sourdough'
  ],
  'Pantry': [
    'olive oil', 'oil', 'coconut oil', 'vinegar', 'balsamic', 'salt', 'pepper', 'spices', 'honey', 
    'maple syrup', 'soy sauce', 'tamari', 'broth', 'stock', 'vanilla', 'baking powder', 'baking soda',
    'garlic powder', 'onion powder', 'paprika', 'cumin', 'turmeric', 'cinnamon', 'nutmeg'
  ],
  'Frozen': ['frozen', 'ice cream', 'frozen berries', 'frozen vegetables', 'frozen fruit'],
  'Beverages': ['coffee', 'tea', 'juice', 'water', 'sparkling water', 'kombucha', 'herbal tea'],
  'Snacks': ['nuts', 'chips', 'crackers', 'cookies', 'popcorn', 'dark chocolate'],
  'Other': [],
};

// Comprehensive unit conversion system
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Volume conversions (to ml)
  'volume': {
    'ml': 1,
    'milliliter': 1,
    'milliliters': 1,
    'l': 1000,
    'liter': 1000,
    'liters': 1000,
    'cup': 236.588,
    'cups': 236.588,
    'tbsp': 14.787,
    'tablespoon': 14.787,
    'tablespoons': 14.787,
    'tsp': 4.929,
    'teaspoon': 4.929,
    'teaspoons': 4.929,
    'fl oz': 29.574,
    'fluid ounce': 29.574,
    'fluid ounces': 29.574,
    'pint': 473.176,
    'pints': 473.176,
    'quart': 946.353,
    'quarts': 946.353,
    'gallon': 3785.41,
    'gallons': 3785.41,
  },
  // Weight conversions (to grams)
  'weight': {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'kilogram': 1000,
    'kilograms': 1000,
    'oz': 28.35,
    'ounce': 28.35,
    'ounces': 28.35,
    'lb': 453.592,
    'pound': 453.592,
    'pounds': 453.592,
    'lbs': 453.592,
  },
  // Count/piece units
  'count': {
    'piece': 1,
    'pieces': 1,
    'item': 1,
    'items': 1,
    'clove': 1,
    'cloves': 1,
    'slice': 1,
    'slices': 1,
    'whole': 1,
    'head': 1,
    'heads': 1,
    'bunch': 1,
    'bunches': 1,
  }
};

function getUnitType(unit: string): string {
  const normalizedUnit = unit.toLowerCase().trim();
  
  for (const [type, conversions] of Object.entries(UNIT_CONVERSIONS)) {
    if (conversions[normalizedUnit] !== undefined) {
      return type;
    }
  }
  
  return 'unknown';
}

function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
  const fromUnitNormalized = fromUnit.toLowerCase().trim();
  const toUnitNormalized = toUnit.toLowerCase().trim();
  
  // Find which conversion table contains both units
  for (const conversions of Object.values(UNIT_CONVERSIONS)) {
    if (conversions[fromUnitNormalized] !== undefined && conversions[toUnitNormalized] !== undefined) {
      const baseValue = quantity * conversions[fromUnitNormalized];
      return baseValue / conversions[toUnitNormalized];
    }
  }
  
  return null;
}

function getBestUnitForQuantity(quantity: number, unitType: string): { unit: string, quantity: number } {
  if (unitType === 'volume') {
    if (quantity >= 1000) {
      return { unit: 'l', quantity: quantity / 1000 };
    } else if (quantity >= 236.588) {
      return { unit: 'cup', quantity: quantity / 236.588 };
    } else if (quantity >= 14.787) {
      return { unit: 'tbsp', quantity: quantity / 14.787 };
    } else {
      return { unit: 'tsp', quantity: quantity / 4.929 };
    }
  } else if (unitType === 'weight') {
    if (quantity >= 1000) {
      return { unit: 'kg', quantity: quantity / 1000 };
    } else if (quantity >= 453.592) {
      return { unit: 'lb', quantity: quantity / 453.592 };
    } else {
      return { unit: 'g', quantity };
    }
  }
  
  return { unit: 'piece', quantity };
}

function categorizeIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

function consolidateIngredients(items: Array<{item: string, quantity: string, unit: string}>): ShoppingListItem[] {
  const consolidated = new Map<string, ShoppingListItem>();
  
  for (const item of items) {
    const key = item.item.toLowerCase().trim();
    const quantity = parseFloat(item.quantity) || 0;
    const unit = item.unit.toLowerCase().trim();
    const unitType = getUnitType(unit);
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      const existingUnitType = getUnitType(existing.unit);
      
      // Try to consolidate if units are convertible
      if (unitType === existingUnitType && unitType !== 'unknown') {
        const converted = convertUnit(quantity, unit, existing.unit);
        if (converted !== null) {
          existing.quantity += converted;
          // Optimize unit for better readability
          const optimized = getBestUnitForQuantity(existing.quantity, unitType);
          existing.quantity = Math.round(optimized.quantity * 100) / 100;
          existing.unit = optimized.unit;
        } else {
          // Couldn't convert, add as note
          existing.notes = existing.notes 
            ? `${existing.notes}; Also ${item.quantity} ${item.unit}`
            : `Also ${item.quantity} ${item.unit}`;
        }
      } else if (existing.unit === unit) {
        // Same unit, add directly
        existing.quantity += quantity;
      } else {
        // Different incompatible units, add as note
        existing.notes = existing.notes 
          ? `${existing.notes}; Also ${item.quantity} ${item.unit}`
          : `Also ${item.quantity} ${item.unit}`;
      }
    } else {
      // Optimize the unit for new items
      const optimized = getBestUnitForQuantity(quantity, unitType);
      
      consolidated.set(key, {
        id: `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ingredient: item.item,
        quantity: Math.round(optimized.quantity * 100) / 100,
        unit: optimized.unit,
        originalUnit: item.unit,
        category: categorizeIngredient(item.item),
        checked: false,
      });
    }
  }
  
  return Array.from(consolidated.values());
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;
    const body = await request.json();
    const { filterPantry = false, includeNutrition = false } = body;

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

    // Check pantry feature permission
    if (filterPantry && !featureAccess.hasFeature(Feature.PANTRY_MANAGEMENT)) {
      return NextResponse.json(
        {
          error: 'Pantry management requires Premium',
          upgrade: true,
          message: featureAccess.getUpgradeMessage(Feature.PANTRY_MANAGEMENT),
        },
        { status: 403 }
      );
    }

    // Check nutrition feature permission
    if (includeNutrition && !featureAccess.hasFeature(Feature.NUTRITION_ANALYSIS)) {
      return NextResponse.json(
        {
          error: 'Nutrition analysis requires Premium',
          upgrade: true,
          message: featureAccess.getUpgradeMessage(Feature.NUTRITION_ANALYSIS),
        },
        { status: 403 }
      );
    }

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
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
    });

    if (!mealPlan || mealPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Meal plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Collect all ingredients from generated recipes
    const allIngredients: Array<{item: string, quantity: string, unit: string, nutrition?: any}> = [];
    
    for (const dailyMenu of mealPlan.dailyMenus) {
      for (const meal of dailyMenu.meals) {
        const recipe = meal.generatedRecipe;
        if (recipe) {
          if (recipe.ingredients) {
            const ingredients = recipe.ingredients as any[];
            ingredients.forEach(ing => {
              allIngredients.push({
                item: ing.item,
                quantity: ing.quantity,
                unit: ing.unit,
                nutrition: includeNutrition ? {
                  calories: recipe.calories,
                  protein: recipe.protein,
                  defenseSystems: recipe.defenseSystems,
                } : undefined,
              });
            });
          }
        }
      }
    }

    if (allIngredients.length === 0) {
      return NextResponse.json(
        {
          error: 'No recipes found. Generate recipes first before creating a shopping list.',
          code: 'NO_RECIPES',
        },
        { status: 400 }
      );
    }

    // Consolidate ingredients with improved algorithm
    let shoppingItems = consolidateIngredients(allIngredients);

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
      
      shoppingItems = shoppingItems.filter(item => {
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

    // Add price estimates if premium
    if (featureAccess.hasFeature(Feature.PRICE_ESTIMATES)) {
      shoppingItems = await addPriceEstimates(shoppingItems);
    }

    // Add nutrition info if requested and premium
    if (includeNutrition && featureAccess.hasFeature(Feature.NUTRITION_ANALYSIS)) {
      shoppingItems = shoppingItems.map(item => ({
        ...item,
        nutritionInfo: allIngredients.find(ing => 
          ing.item.toLowerCase() === item.ingredient.toLowerCase()
        )?.nutrition,
      }));
    }

    // Sort by category and then alphabetically
    const categoryOrder = Object.keys(CATEGORY_KEYWORDS);
    shoppingItems.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.ingredient.localeCompare(b.ingredient);
    });

    // Calculate total cost
    const totalCost = shoppingItems.reduce(
      (sum, item) => sum + (item.estimatedCost || 0),
      0
    );

    // Check if shopping list already exists
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        userId: session.user.id,
        mealPlanId,
      },
    });

    const shoppingListData = {
      items: shoppingItems as any,
      totalItems: shoppingItems.length,
      totalCost,
      pantryFiltered: filterPantry,
    };

    if (existingList) {
      // Update existing list
      const updatedList = await prisma.shoppingList.update({
        where: { id: existingList.id },
        data: shoppingListData,
      });

      return NextResponse.json({
        data: updatedList,
        message: 'Shopping list updated successfully',
        stats: {
          totalItems: shoppingItems.length,
          categories: [...new Set(shoppingItems.map(item => item.category))].length,
          estimatedCost: totalCost,
        },
      });
    }

    // Create new shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: session.user.id,
        mealPlanId,
        title: `Shopping List - ${mealPlan.title}`,
        ...shoppingListData,
      },
    });

    return NextResponse.json({
      data: shoppingList,
      message: 'Shopping list generated successfully',
      stats: {
        totalItems: shoppingItems.length,
        categories: [...new Set(shoppingItems.map(item => item.category))].length,
        estimatedCost: totalCost,
      },
    });
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 }
    );
  }
}

// GET - Fetch shopping list for meal plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      select: { userId: true, title: true },
    });

    if (!mealPlan || mealPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Meal plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get shopping list
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        userId: session.user.id,
        mealPlanId,
      },
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const items = (shoppingList.items as unknown) as ShoppingListItem[];
    const checkedItems = items.filter(item => item.checked).length;
    const progress = items.length > 0 ? Math.round((checkedItems / items.length) * 100) : 0;

    return NextResponse.json({ 
      data: {
        ...shoppingList,
        progress,
        checkedItems,
      }
    });
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}

// PUT - Update shopping list (check items, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;
    const body = await request.json();
    const { items, itemId, checked } = body;

    // Verify shopping list ownership
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        mealPlanId,
        userId: session.user.id,
      },
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found or unauthorized' },
        { status: 404 }
      );
    }

    let updatedItems;

    // Handle single item update for real-time checking
    if (itemId !== undefined && checked !== undefined) {
      const currentItems = (shoppingList.items as unknown) as ShoppingListItem[];
      updatedItems = currentItems.map(item => 
        item.id === itemId ? { ...item, checked } : item
      );
    } else if (items) {
      // Handle bulk update
      updatedItems = items;
    } else {
      return NextResponse.json(
        { error: 'Invalid update data' },
        { status: 400 }
      );
    }

    // Update the shopping list items
    const updatedList = await prisma.shoppingList.update({
      where: { id: shoppingList.id },
      data: {
        items: updatedItems as any,
      },
    });

    // Calculate progress
    const checkedItems = updatedItems.filter((item: ShoppingListItem) => item.checked).length;
    const progress = updatedItems.length > 0 ? Math.round((checkedItems / updatedItems.length) * 100) : 0;

    return NextResponse.json({
      data: {
        ...updatedList,
        progress,
        checkedItems,
      },
      message: 'Shopping list updated successfully',
    });
  } catch (error) {
    console.error('Error updating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to update shopping list' },
      { status: 500 }
    );
  }
}

// DELETE - Delete shopping list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;

    // Verify shopping list ownership
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        mealPlanId,
        userId: session.user.id,
      },
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the shopping list
    await prisma.shoppingList.delete({
      where: { id: shoppingList.id },
    });

    return NextResponse.json({
      message: 'Shopping list deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to delete shopping list' },
      { status: 500 }
    );
  }
}

// Enhanced price estimation with category-specific pricing
async function addPriceEstimates(items: ShoppingListItem[]): Promise<ShoppingListItem[]> {
  // More sophisticated price estimation based on category and quantity
  const basePrices: Record<string, number> = {
    'Produce': 3.50,
    'Proteins': 12.00,
    'Dairy': 4.50,
    'Grains & Pasta': 2.80,
    'Pantry': 4.20,
    'Frozen': 5.00,
    'Beverages': 3.80,
    'Snacks': 4.50,
    'Other': 3.50,
  };

  // Quantity multipliers for bulk pricing
  const getQuantityMultiplier = (quantity: number): number => {
    if (quantity > 5) return 0.85; // Bulk discount
    if (quantity > 2) return 0.95; // Small discount
    return 1.0;
  };

  return items.map(item => {
    const basePrice = basePrices[item.category] || 3.50;
    const quantityMultiplier = getQuantityMultiplier(item.quantity);
    const estimatedCost = Math.round(basePrice * item.quantity * quantityMultiplier * 100) / 100;
    
    return {
      ...item,
      estimatedCost,
    };
  });
}