import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess, Feature } from '@/lib/features/feature-flags';

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
    const { searchParams } = new URL(request.url);
    const includeRecipes = searchParams.get('includeRecipes') === 'true';
    const includeShoppingList = searchParams.get('includeShoppingList') === 'true';
    const includeNutrition = searchParams.get('includeNutrition') === 'true';

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Simple feature check - for now allow all users
    const hasFeatureAccess = true;
    
    // Check PDF export permission
    if (!hasFeatureAccess) {
      return NextResponse.json(
        {
          error: 'PDF export requires Premium',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // Fetch meal plan with all related data
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, create a mock meal plan structure since the model doesn't exist
    const mockMealPlan = {
      id: mealPlanId,
      title: 'Weekly Meal Plan',
      userId: session.user.id,
      weekStart: new Date().toISOString(),
      weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      defaultServings: 4,
      status: 'ACTIVE',
      description: 'A healthy meal plan focusing on defense system foods',
      dietaryRestrictions: ['None'],
      focusSystems: ['Immune Support', 'Heart Health'],
      dailyMenus: [
        {
          id: '1',
          date: new Date().toISOString(),
          meals: [
            {
              id: '1',
              type: 'BREAKFAST',
              name: 'Green Smoothie Bowl',
              description: 'Antioxidant-rich breakfast',
              prepTime: '10 mins',
              defenseSystems: ['Immune Support'],
              generatedRecipes: includeRecipes ? [{
                id: '1',
                name: 'Green Smoothie Bowl',
                servings: 2,
                prepTime: '10 mins',
                cookTime: '0 mins',
                totalTime: '10 mins',
                description: 'A nutrient-packed breakfast bowl',
                ingredients: [
                  { item: 'Spinach', quantity: '2', unit: 'cups', notes: 'fresh' },
                  { item: 'Banana', quantity: '1', unit: 'large', notes: 'frozen' },
                  { item: 'Blueberries', quantity: '1/2', unit: 'cup', notes: 'fresh or frozen' },
                ],
                instructions: [
                  { step: 1, instruction: 'Blend all ingredients until smooth', time: '2 mins' },
                  { step: 2, instruction: 'Pour into bowl and add toppings', time: '1 min' },
                ],
                calories: 250,
                protein: 8,
                carbs: 45,
                fat: 5,
              }] : [],
            },
          ],
        },
      ],
    };

    // Fetch shopping list if requested
    let shoppingList = null;
    if (includeShoppingList) {
      shoppingList = {
        id: 'mock-shopping-list',
        title: `Shopping List - ${mockMealPlan.title}`,
        items: [
          {
            id: '1',
            ingredient: 'Spinach',
            quantity: 2,
            unit: 'cups',
            category: 'Produce',
            checked: false,
            estimatedCost: 3.99,
          },
          {
            id: '2',
            ingredient: 'Banana',
            quantity: 1,
            unit: 'large',
            category: 'Produce',
            checked: false,
            estimatedCost: 0.79,
          },
        ],
        totalCost: 4.78,
        totalItems: 2,
      };
    }

    // Prepare data for PDF generation
    const pdfData = {
      mealPlan: mockMealPlan,
      user,
      shoppingList,
      options: {
        includeRecipes,
        includeShoppingList: includeShoppingList,
        includeNutrition,
      },
    };

    // For now, return a simple text response
    // TODO: Implement proper React PDF generation
    const textContent = `
5x5x5 Wellness Hub - Meal Plan

Title: ${mockMealPlan.title}
Week: ${mockMealPlan.weekStart} to ${mockMealPlan.weekEnd}
Servings: ${mockMealPlan.defaultServings}

${mockMealPlan.dailyMenus.map((day: any) => `
${day.dayName.toUpperCase()}
${day.meals.map((meal: any) => `
  ${meal.mealType}: ${meal.title}
  Description: ${meal.description}
  ${meal.prepTime ? `Prep Time: ${meal.prepTime}` : ''}
  ${meal.cookTime ? `Cook Time: ${meal.cookTime}` : ''}
`).join('')}
`).join('')}

${includeShoppingList && shoppingList ? `
SHOPPING LIST
Total Items: ${shoppingList.totalItems}
Total Cost: $${shoppingList.totalCost.toFixed(2)}

${shoppingList.items.map((item: any) => `- ${item.quantity} ${item.unit} ${item.ingredient} (${item.category})`).join('\n')}
` : ''}

Generated by 5x5x5 Wellness Hub
    `;

    // Return as plain text for now
    return new NextResponse(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="meal-plan-${mealPlanId}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}