import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthResponses } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * Get platform-wide analytics and statistics (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch various platform statistics
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalRecipes,
      totalMealPlans,
      totalShoppingLists,
      aiQuestionsCount,
      recipeGenerationsCount,
      subscriptionStats,
      usersByTier,
      recentActivity,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within period)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: startDate,
          },
        },
      }),

      // New users in period
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Total recipes
      prisma.recipe.count(),

      // Total meal plans
      prisma.mealPlan.count(),

      // Total shopping lists
      prisma.shoppingList.count(),

      // Sum of AI questions asked
      prisma.user.aggregate({
        _sum: {
          aiQuestionsThisMonth: true,
        },
      }),

      // Sum of recipes generated
      prisma.user.aggregate({
        _sum: {
          recipeGenerationsThisMonth: true,
        },
      }),

      // Subscription statistics
      prisma.user.groupBy({
        by: ['subscriptionStatus'],
        _count: true,
      }),

      // Users by subscription tier
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      }),

      // Recent activity (last 10 recipes, meal plans, etc.)
      {
        recipes: await prisma.recipe.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        mealPlans: await prisma.mealPlan.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
      },
    ]);

    // Calculate API usage metrics
    const apiMetrics = {
      aiQuestions: aiQuestionsCount._sum.aiQuestionsThisMonth || 0,
      recipeGenerations: recipeGenerationsCount._sum.recipeGenerationsThisMonth || 0,
    };

    // Format subscription stats
    const formattedSubscriptionStats = subscriptionStats.reduce(
      (acc, stat) => {
        acc[stat.subscriptionStatus || 'none'] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const formattedTierStats = usersByTier.reduce(
      (acc, stat) => {
        acc[stat.subscriptionTier] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      period: days,
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        byTier: formattedTierStats,
      },
      content: {
        recipes: totalRecipes,
        mealPlans: totalMealPlans,
        shoppingLists: totalShoppingLists,
      },
      apiUsage: apiMetrics,
      subscriptions: formattedSubscriptionStats,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching admin analytics:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      const response = error.message.includes('Unauthorized')
        ? AuthResponses.unauthorized()
        : AuthResponses.adminOnly();
      return NextResponse.json(
        { error: response.error },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
