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
      const items = Array.isArray(list.items) ? list.items : [];
      const checkedItems = items.filter((item: any) => item.checked === true);
      const pendingItems = items.filter((item: any) => item.checked !== true);

      return {
        id: list.id,
        title: list.title,
        mealPlanId: list.mealPlanId,
        mealPlan: list.mealPlan,
        totalItems: list.totalItems,
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

    // Calculate summary statistics
    const stats = {
      totalLists: shoppingLists.length,
      totalItems: shoppingLists.reduce((sum: number, list: any) => sum + list.totalItems, 0),
      completedItems: transformedLists.reduce((sum: number, list: any) => sum + list.checkedItems, 0),
      thisWeekLists: shoppingLists.filter(
        (list: any) => new Date(list.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };

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
    const { title, mealPlanId, items = [] } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Shopping list title is required' },
        { status: 400 }
      );
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
        title,
        items: JSON.stringify(items),
        totalItems: items.length,
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