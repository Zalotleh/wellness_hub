import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format as formatDate } from 'date-fns';

/**
 * GET /api/user/data-export
 * 
 * Export all user data in JSON or CSV format
 * Compliant with GDPR Article 20 (Right to data portability)
 * 
 * Query Parameters:
 * - format: 'json' | 'csv' (defaults to 'json')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use json or csv' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        foodConsumptions: {
          include: {
            foodItems: {
              include: {
                defenseSystems: true,
              },
            },
          },
        },
        dailyScores: {
          orderBy: { date: 'desc' },
        },
        recipes: {
          include: {
            ratings: true,
            comments: true,
          },
        },
        generatedRecipes: true,
        mealPlans: {
          include: {
            dailyMenus: true,
          },
        },
        shoppingLists: true,
        pantryItems: true,
        favorites: {
          include: {
            recipe: true,
          },
        },
        ratings: true,
        comments: true,
        recommendations: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const {
      password,
      stripeCustomerId,
      stripeSubscriptionId,
      ...safeUserData
    } = userData as any;

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: format,
      userData: {
        personalInfo: {
          id: safeUserData.id,
          name: safeUserData.name,
          email: safeUserData.email,
          createdAt: safeUserData.createdAt,
          updatedAt: safeUserData.updatedAt,
        },
        preferences: {
          measurementSystem: safeUserData.measurementSystem,
          language: safeUserData.language,
          theme: safeUserData.theme,
          country: safeUserData.country,
          timezone: safeUserData.timezone,
          defaultDietaryRestrictions: safeUserData.defaultDietaryRestrictions,
          defaultFocusSystems: safeUserData.defaultFocusSystems,
          defaultServings: safeUserData.defaultServings,
        },
        subscription: {
          tier: safeUserData.subscriptionTier,
          status: safeUserData.subscriptionStatus,
          endsAt: safeUserData.subscriptionEndsAt,
          trialEndsAt: safeUserData.trialEndsAt,
        },
        usage: {
          mealPlansThisMonth: safeUserData.mealPlansThisMonth,
          aiQuestionsThisMonth: safeUserData.aiQuestionsThisMonth,
          imageGenerationsThisMonth: safeUserData.imageGenerationsThisMonth,
          pdfExportsThisMonth: safeUserData.pdfExportsThisMonth,
          recipeGenerationsThisMonth: safeUserData.recipeGenerationsThisMonth,
        },
        progressData: {
          totalDays: safeUserData.progress.length,
          entries: safeUserData.progress.map((p: any) => ({
            date: p.date,
            foodConsumptions: p.FoodConsumption.map((fc: any) => ({
              mealTime: fc.mealTime,
              servings: fc.servings,
              notes: fc.notes,
              foods: fc.foodItems.map((fi: any) => ({
                name: fi.name,
                quantity: fi.quantity,
                unit: fi.unit,
                defenseSystems: fi.defenseSystems.map((ds: any) => ({
                  system: ds.defenseSystem,
                  strength: ds.strength,
                })),
              })),
            })),
          })),
        },
        scores: {
          total: safeUserData.dailyScores.length,
          scores: safeUserData.dailyScores.map((s: any) => ({
            date: s.date,
            overallScore: s.overallScore,
            systemScore: s.systemScore,
            mealScore: s.mealScore,
            varietyScore: s.varietyScore,
          })),
        },
        recipes: {
          total: safeUserData.recipes.length,
          recipes: safeUserData.recipes.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            defenseSystem: r.defenseSystem,
            mealType: r.mealType,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            servings: r.servings,
            difficulty: r.difficulty,
            createdAt: r.createdAt,
            ratingsCount: r.ratings.length,
            commentsCount: r.comments.length,
          })),
        },
        generatedRecipes: {
          total: safeUserData.generatedRecipes.length,
          recipes: safeUserData.generatedRecipes.map((gr: any) => ({
            id: gr.id,
            generationType: gr.generationType,
            defenseSystem: gr.defenseSystem,
            success: gr.success,
            qualityScore: gr.qualityScore,
            createdAt: gr.createdAt,
          })),
        },
        mealPlans: {
          total: safeUserData.mealPlans.length,
          plans: safeUserData.mealPlans.map((mp: any) => ({
            id: mp.id,
            title: mp.title,
            description: mp.description,
            duration: mp.durationWeeks,
            mealsCount: mp.meals.length,
            createdAt: mp.createdAt,
          })),
        },
        shoppingLists: {
          total: safeUserData.shoppingLists.length,
          lists: safeUserData.shoppingLists.map((sl: any) => ({
            id: sl.id,
            name: sl.name,
            itemsCount: sl.items.length,
            createdAt: sl.createdAt,
          })),
        },
        pantry: {
          total: safeUserData.pantryItems.length,
          items: safeUserData.pantryItems.map((pi: any) => ({
            name: pi.name,
            category: pi.category,
            quantity: pi.quantity,
            unit: pi.unit,
            expiryDate: pi.expiryDate,
          })),
        },
        favorites: {
          total: safeUserData.favorites.length,
          recipes: safeUserData.favorites.map((f: any) => ({
            recipeId: f.recipeId,
            recipeTitle: f.recipe?.title,
            createdAt: f.createdAt,
          })),
        },
        recommendations: {
          total: safeUserData.recommendations.length,
          items: safeUserData.recommendations.map((r: any) => ({
            type: r.type,
            priority: r.priority,
            status: r.status,
            title: r.title,
            createdAt: r.createdAt,
            acceptedAt: r.acceptedAt,
            dismissedAt: r.dismissedAt,
          })),
        },
      },
      summary: {
        totalProgressDays: safeUserData.progress.length,
        totalScores: safeUserData.dailyScores.length,
        totalRecipes: safeUserData.recipes.length,
        totalGeneratedRecipes: safeUserData.generatedRecipes.length,
        totalMealPlans: safeUserData.mealPlans.length,
        totalShoppingLists: safeUserData.shoppingLists.length,
        totalPantryItems: safeUserData.pantryItems.length,
        totalFavorites: safeUserData.favorites.length,
        totalRecommendations: safeUserData.recommendations.length,
      },
    };

    if (format === 'json') {
      // Return JSON
      const fileName = `wellness-hub-data-${userId}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
      
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // Return CSV (simplified - main data points)
      const csvRows = [
        // Header
        ['Export Date', exportData.exportDate],
        ['User ID', exportData.userData.personalInfo.id],
        ['Email', exportData.userData.personalInfo.email],
        ['Account Created', exportData.userData.personalInfo.createdAt],
        [],
        ['Summary'],
        ['Total Progress Days', exportData.summary.totalProgressDays],
        ['Total Scores', exportData.summary.totalScores],
        ['Total Recipes', exportData.summary.totalRecipes],
        ['Total Meal Plans', exportData.summary.totalMealPlans],
        ['Total Shopping Lists', exportData.summary.totalShoppingLists],
        [],
        ['Progress Data'],
        ['Date', 'Meals Logged', 'Foods Count'],
      ];

      // Add progress data
      exportData.userData.progressData.entries.forEach((entry: any) => {
        const foodsCount = entry.foodConsumptions.reduce(
          (sum: any, fc: any) => sum + fc.foods.length,
          0
        );
        csvRows.push([
          formatDate(new Date(entry.date), 'yyyy-MM-dd'),
          entry.foodConsumptions.length.toString(),
          foodsCount.toString(),
        ]);
      });

      const csvContent = csvRows.map((row: any) => row.join(',')).join('\n');
      const fileName = `wellness-hub-data-${userId}-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
