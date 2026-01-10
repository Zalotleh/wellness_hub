import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all shopping lists for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch shopping lists with related meal plan data
    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        mealPlan: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include computed stats
    const transformedLists = shoppingLists.map((list: any) => {
      // Parse items properly (handle Prisma Json type)
      let items = [];
      if (Array.isArray(list.items)) {
        items = list.items;
      } else if (typeof list.items === 'string') {
        try {
          items = JSON.parse(list.items);
        } catch (e) {
          console.error('Failed to parse items as JSON:', e);
          items = [];
        }
      } else if (list.items && typeof list.items === 'object') {
        items = Object.values(list.items);
      }

      console.log(`List "${list.title}": Parsed ${items.length} items, typeof items:`, typeof list.items);
      
      const checkedItems = items.filter((item: any) => item.checked === true);
      const pendingItems = items.filter((item: any) => item.checked !== true);

      console.log(`  → ${checkedItems.length} checked, ${pendingItems.length} pending`);

      // Parse sourceIds if it's JSON
      let sourceIds = [];
      if (Array.isArray(list.sourceIds)) {
        sourceIds = list.sourceIds;
      } else if (typeof list.sourceIds === 'string') {
        try {
          sourceIds = JSON.parse(list.sourceIds);
        } catch (e) {
          sourceIds = [];
        }
      } else if (list.sourceIds && typeof list.sourceIds === 'object') {
        sourceIds = Object.values(list.sourceIds);
      }

      return {
        id: list.id,
        title: list.title,
        mealPlanId: list.mealPlanId,
        mealPlan: list.mealPlan,
        sourceType: list.sourceType,
        sourceIds: sourceIds,
        totalItems: items.length, // Use actual items count instead of stored value
        checkedItems: checkedItems.length,
        pendingItems: pendingItems.length,
        totalCost: list.totalCost,
        currency: list.currency,
        pantryFiltered: list.pantryFiltered,
        lastExported: list.lastExported,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        items: items,
      };
    });

    // Calculate summary statistics using transformed data
    const stats = {
      totalLists: transformedLists.length,
      totalItems: transformedLists.reduce((sum: number, list: any) => sum + list.totalItems, 0),
      completedItems: transformedLists.reduce((sum: number, list: any) => sum + list.checkedItems, 0),
      thisWeekLists: shoppingLists.filter(
        (list: any) => new Date(list.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };

    console.log('📊 Shopping Lists Stats:', stats);

    return NextResponse.json({
      success: true,
      data: transformedLists,
      stats,
    });

  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 }
    );
  }
}

// POST - Create a new shopping list from scratch
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
    const { title, name, mealPlanId, recipeId, items = [] } = body;

    const listTitle = title || name || 'Shopping List';

    if (!listTitle) {
      return NextResponse.json(
        { error: 'Shopping list title is required' },
        { status: 400 }
      );
    }

    // If recipeId is provided, get ingredients from recipe
    let listItems = items;
    let sourceIds = [];
    let sourceType = 'MANUAL';

    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
      });

      if (!recipe) {
        return NextResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        );
      }

      // Parse ingredients from recipe
      const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : JSON.parse(recipe.ingredients as string);

      listItems = ingredients.map((ing: any, idx: number) => ({
        id: `item-${idx}`,
        name: typeof ing === 'string' ? ing : ing.name || ing.item,
        quantity: typeof ing === 'string' ? '1' : ing.amount || ing.quantity || '1',
        unit: typeof ing === 'string' ? '' : ing.unit || '',
        category: typeof ing === 'string' ? 'Other' : ing.category || 'Other',
        checked: false,
      }));

      sourceIds = [recipeId];
      sourceType = 'RECIPE';
    }

    // If mealPlanId is provided, verify it belongs to the user
    if (mealPlanId) {
      const mealPlan = await prisma.mealPlan.findFirst({
        where: {
          id: mealPlanId,
          userId: session.user.id,
        },
      });

      if (!mealPlan) {
        return NextResponse.json(
          { error: 'Meal plan not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create the shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: session.user.id,
        mealPlanId: mealPlanId || '', // Use empty string if no meal plan
        title: listTitle,
        sourceType,
        sourceIds: JSON.stringify(sourceIds),
        items: JSON.stringify(listItems),
        totalItems: listItems.length,
        pantryFiltered: false,
      },
      include: {
        mealPlan: mealPlanId ? {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
        } : false,
      },
    });

    return NextResponse.json({
      success: true,
      data: shoppingList,
      message: 'Shopping list created successfully',
    });

  } catch (error) {
    console.error('Error creating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    );
  }
}