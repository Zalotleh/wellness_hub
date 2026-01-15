import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, parseISO } from 'date-fns';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      weekStart,
      weekEnd,
      selectedDays, // Array of yyyy-MM-dd strings
      dietaryRestrictions = [],
      focusSystems = [],
      servings = 2,
    } = body;

    if (!weekStart || !weekEnd || !selectedDays || selectedDays.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating weekly meal plan structure:', {
      weekStart,
      weekEnd,
      selectedDays,
      focusSystems,
      servings,
    });

    // Check if meal plan already exists for this week
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
      },
    });

    if (existingPlan) {
      // Delete existing plan and create new one
      await prisma.mealPlan.delete({
        where: { id: existingPlan.id },
      });
    }

    // Create meal plan structure with placeholder meals
    // Users will use existing AI generate endpoints to fill in recipes
    const dailyMenus = selectedDays.map((dayString: string) => {
      const date = parseISO(dayString);
      
      return {
        date,
        meals: {
          create: MEAL_TYPES.map(mealType => ({
            mealType,
            mealName: `${mealType.charAt(0) + mealType.slice(1).toLowerCase()} Placeholder`,
            servings: servings,
            defenseSystems: focusSystems,
          })),
        },
      };
    });

    // Create the meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        title: `Week of ${format(new Date(weekStart), 'MMM d')}`,
        description: `Weekly meal plan with ${selectedDays.length} days`,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        dietaryRestrictions,
        dailyMenus: {
          create: dailyMenus,
        },
      },
      include: {
        dailyMenus: {
          include: {
            meals: true,
          },
        },
      },
    });

    console.log('Meal plan structure created successfully:', {
      id: mealPlan.id,
      days: mealPlan.dailyMenus.length,
      totalMeals: mealPlan.dailyMenus.reduce((sum: number, dm: any) => sum + dm.meals.length, 0),
    });

    // Note: Recipes need to be generated individually through the meal planner UI
    // This creates the structure, users can then generate recipes for each meal

    return NextResponse.json({
      success: true,
      mealPlan: {
        id: mealPlan.id,
        weekStart: mealPlan.weekStart,
        weekEnd: mealPlan.weekEnd,
        daysPlanned: mealPlan.dailyMenus.length,
        totalMeals: mealPlan.dailyMenus.reduce(
          (sum: number, dm: any) => sum + dm.meals.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Error generating weekly meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
