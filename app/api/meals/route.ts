import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Add a new meal to a meal plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, day, slot, mealType, mealName, servings, defenseSystems } = body;

    console.log('📝 Add meal request:', { planId, day, slot, mealType, servings });

    if (!planId || !day || !slot) {
      return NextResponse.json(
        { error: 'planId, day, and slot are required' },
        { status: 400 }
      );
    }

    // Verify the meal plan belongs to the user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
      include: {
        dailyMenus: {
          include: {
            meals: true,
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Map day name to date
    const dayMapping: Record<string, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    };

    const dayOffset = dayMapping[day.toLowerCase()];
    if (dayOffset === undefined) {
      return NextResponse.json(
        { error: 'Invalid day. Must be monday-sunday' },
        { status: 400 }
      );
    }

    // Calculate the date for this day
    const weekStart = new Date(mealPlan.weekStart);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    console.log('📅 Target date:', targetDate, 'for day:', day);

    // Find or create the DailyMenu for this date
    let dailyMenu = mealPlan.dailyMenus.find(menu => {
      const menuDate = new Date(menu.date);
      menuDate.setHours(0, 0, 0, 0);
      return menuDate.getTime() === targetDate.getTime();
    });

    if (!dailyMenu) {
      console.log('🆕 Creating new DailyMenu for', targetDate);
      dailyMenu = await prisma.dailyMenu.create({
        data: {
          mealPlanId: planId,
          date: targetDate,
          servings: servings || 2,
        },
        include: {
          meals: true,
        },
      });
    }

    // Get the next position for this meal type
    const existingMeals = dailyMenu?.meals || [];
    const sameMealTypeMeals = existingMeals.filter(m => m.mealType === slot);
    const nextPosition = sameMealTypeMeals.length;

    console.log('📍 Creating meal at position', nextPosition, 'for slot', slot);

    // Create the new meal
    const newMeal = await prisma.meal.create({
      data: {
        dailyMenuId: dailyMenu.id,
        mealType: mealType || slot,
        slot: slot, // Persist the slot so meal stays in place on refresh
        mealName: mealName || `New ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
        servings: servings || 2,
        defenseSystems: defenseSystems || [],
        position: nextPosition,
        recipeGenerated: false,
      },
      include: {
        generatedRecipe: {
          select: {
            id: true,
            name: true,
            prepTime: true,
            cookTime: true,
            defenseSystems: true,
            ingredients: true,
            instructions: true,
          },
        },
      },
    });

    console.log('✅ Meal created successfully:', newMeal.id);

    // Calculate week number from the meal plan
    const planWeekStart = new Date(mealPlan.weekStart);
    const mealDate = new Date(dailyMenu.date);
    const weekNumber = Math.floor((mealDate.getTime() - planWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Return the meal with the day, slot, and week info for client state management
    return NextResponse.json({
      ...newMeal,
      day,
      slot,
      week: weekNumber,
    });
  } catch (error: any) {
    console.error('💥 Error adding meal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add meal' },
      { status: 500 }
    );
  }
}

// PATCH - Update a meal
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mealId, updates } = body;

    console.log('📝 Update meal request:', { mealId, updates });

    if (!mealId) {
      return NextResponse.json(
        { error: 'mealId is required' },
        { status: 400 }
      );
    }

    // Verify the meal exists and belongs to user's meal plan
    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        dailyMenu: {
          mealPlan: {
            userId: session.user.id,
          },
        },
      },
      include: {
        dailyMenu: {
          include: {
            mealPlan: true,
          },
        },
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the meal
    const updatedMeal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        generatedRecipe: {
          select: {
            id: true,
            name: true,
            prepTime: true,
            cookTime: true,
            defenseSystems: true,
            ingredients: true,
            instructions: true,
          },
        },
      },
    });

    console.log('✅ Meal updated successfully:', updatedMeal.id);

    // Calculate day, slot, and week from the meal's dailyMenu
    const mealDate = new Date(meal.dailyMenu.date);
    const planWeekStart = new Date(meal.dailyMenu.mealPlan.weekStart);
    const dayOfWeek = mealDate.getDay();
    const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const day = dayMapping[dayOfWeek];
    const weekNumber = Math.floor((mealDate.getTime() - planWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Return the complete meal object with day, slot (from DB or fallback to mealType), and week
    return NextResponse.json({
      ...updatedMeal,
      day,
      slot: updatedMeal.slot || updatedMeal.mealType, // Use persisted slot, fallback to mealType for backward compatibility
      week: weekNumber,
    });
  } catch (error: any) {
    console.error('💥 Error updating meal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update meal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a meal
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId');

    console.log('🗑️ Delete meal request:', { mealId });

    if (!mealId) {
      return NextResponse.json(
        { error: 'mealId is required' },
        { status: 400 }
      );
    }

    // Verify the meal exists and belongs to user's meal plan
    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        dailyMenu: {
          mealPlan: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the meal (and its generated recipe via cascade)
    await prisma.meal.delete({
      where: { id: mealId },
    });

    console.log('✅ Meal deleted successfully:', mealId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('💥 Error deleting meal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
