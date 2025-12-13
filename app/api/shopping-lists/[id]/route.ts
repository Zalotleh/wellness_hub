import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific shopping list
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
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
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    // Parse items from JSON
    // Prisma Json type can be: Array, Object, or need parsing
    let items = [];
    if (Array.isArray(shoppingList.items)) {
      items = shoppingList.items;
    } else if (typeof shoppingList.items === 'string') {
      try {
        items = JSON.parse(shoppingList.items);
      } catch (e) {
        console.error('Failed to parse items JSON:', e);
        items = [];
      }
    } else if (shoppingList.items && typeof shoppingList.items === 'object') {
      // If it's already an object, check if it's array-like or wrap it
      items = Object.values(shoppingList.items);
    }

    console.log('📦 Shopping list items:', {
      id: shoppingList.id,
      totalItems: shoppingList.totalItems,
      itemsType: typeof shoppingList.items,
      itemsIsArray: Array.isArray(shoppingList.items),
      parsedItemsCount: items.length,
      firstItem: items[0],
    });

    return NextResponse.json({
      success: true,
      data: {
        ...shoppingList,
        items,
      },
    });

  } catch (error) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}

// PATCH - Update shopping list items
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, title } = body;

    // Verify shopping list belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (items) {
      updateData.items = JSON.stringify(items);
      updateData.totalItems = items.length;
    }
    
    if (title) {
      updateData.title = title;
    }

    // Update the shopping list
    const updatedList = await prisma.shoppingList.update({
      where: {
        id: params.id,
      },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedList,
        items: Array.isArray(updatedList.items) ? updatedList.items : [],
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
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Verify shopping list belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    // Delete the shopping list
    await prisma.shoppingList.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
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