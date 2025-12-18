import { prisma } from '@/lib/prisma';
import { DefenseSystem } from '@/types';

interface LogGenerationParams {
  userId: string;
  generationType: 'recipe' | 'mealplan';
  success: boolean;
  qualityScore?: number;
  defenseSystem?: DefenseSystem;
  ingredientCount?: number;
  hasDietaryRestrictions?: boolean;
  hasMealType?: boolean;
  validationErrors?: string[];
  inputData?: any;
  outputData?: any;
  apiResponseTime?: number;
  modelUsed?: string;
  tokensUsed?: number;
}

/**
 * Log an AI generation attempt for analytics
 */
export async function logAIGeneration(params: LogGenerationParams) {
  try {
    await prisma.aIGenerationLog.create({
      data: {
        userId: params.userId,
        generationType: params.generationType,
        success: params.success,
        qualityScore: params.qualityScore,
        defenseSystem: params.defenseSystem,
        ingredientCount: params.ingredientCount || 0,
        hasDietaryRestrictions: params.hasDietaryRestrictions || false,
        hasMealType: params.hasMealType || false,
        validationErrors: params.validationErrors || [],
        inputData: params.inputData || {},
        outputData: params.outputData || {},
        apiResponseTime: params.apiResponseTime,
        modelUsed: params.modelUsed,
        tokensUsed: params.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Failed to log AI generation:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Get generation analytics for admin dashboard
 */
export async function getGenerationAnalytics(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Overall stats
    const totalGenerations = await prisma.aIGenerationLog.count({
      where: { createdAt: { gte: startDate } },
    });

    const successfulGenerations = await prisma.aIGenerationLog.count({
      where: {
        createdAt: { gte: startDate },
        success: true,
      },
    });

    const failedGenerations = await prisma.aIGenerationLog.count({
      where: {
        createdAt: { gte: startDate },
        success: false,
      },
    });

    // Success rate by type
    const recipeStats = await prisma.aIGenerationLog.groupBy({
      by: ['success'],
      where: {
        createdAt: { gte: startDate },
        generationType: 'recipe',
      },
      _count: true,
    });

    const mealplanStats = await prisma.aIGenerationLog.groupBy({
      by: ['success'],
      where: {
        createdAt: { gte: startDate },
        generationType: 'mealplan',
      },
      _count: true,
    });

    // Most common validation errors
    const failedLogs = await prisma.aIGenerationLog.findMany({
      where: {
        createdAt: { gte: startDate },
        success: false,
      },
      select: {
        validationErrors: true,
        generationType: true,
      },
    });

    // Count error frequencies
    const errorFrequency: Record<string, number> = {};
    failedLogs.forEach((log) => {
      log.validationErrors.forEach((error) => {
        errorFrequency[error] = (errorFrequency[error] || 0) + 1;
      });
    });

    // Sort errors by frequency
    const topErrors = Object.entries(errorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    // Average quality score
    const avgQualityScore = await prisma.aIGenerationLog.aggregate({
      where: {
        createdAt: { gte: startDate },
        qualityScore: { not: null },
      },
      _avg: {
        qualityScore: true,
      },
    });

    // Average response time
    const avgResponseTime = await prisma.aIGenerationLog.aggregate({
      where: {
        createdAt: { gte: startDate },
        apiResponseTime: { not: null },
      },
      _avg: {
        apiResponseTime: true,
      },
    });

    // Success rate by defense system
    const systemStats = await prisma.aIGenerationLog.groupBy({
      by: ['defenseSystem', 'success'],
      where: {
        createdAt: { gte: startDate },
        defenseSystem: { not: null },
      },
      _count: true,
    });

    // Success rate by ingredient count
    const ingredientStats = await prisma.aIGenerationLog.groupBy({
      by: ['ingredientCount', 'success'],
      where: {
        createdAt: { gte: startDate },
        generationType: 'recipe',
      },
      _count: true,
    });

    // Daily trend
    const dailyStats = await prisma.$queryRaw<
      Array<{ date: Date; total: bigint; successful: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful
      FROM "AIGenerationLog"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      overview: {
        totalGenerations,
        successfulGenerations,
        failedGenerations,
        successRate:
          totalGenerations > 0
            ? (successfulGenerations / totalGenerations) * 100
            : 0,
        avgQualityScore: avgQualityScore._avg.qualityScore || 0,
        avgResponseTime: avgResponseTime._avg.apiResponseTime || 0,
      },
      byType: {
        recipe: {
          total: recipeStats.reduce((sum, stat) => sum + stat._count, 0),
          successful:
            recipeStats.find((s) => s.success)?._count || 0,
          failed:
            recipeStats.find((s) => !s.success)?._count || 0,
        },
        mealplan: {
          total: mealplanStats.reduce((sum, stat) => sum + stat._count, 0),
          successful:
            mealplanStats.find((s) => s.success)?._count || 0,
          failed:
            mealplanStats.find((s) => !s.success)?._count || 0,
        },
      },
      topValidationErrors: topErrors,
      byDefenseSystem: systemStats,
      byIngredientCount: ingredientStats,
      dailyTrend: dailyStats.map((stat) => ({
        date: stat.date,
        total: Number(stat.total),
        successful: Number(stat.successful),
      })),
    };
  } catch (error) {
    console.error('Failed to get generation analytics:', error);
    throw error;
  }
}

/**
 * Get user-specific generation history
 */
export async function getUserGenerationHistory(
  userId: string,
  limit: number = 50
) {
  try {
    return await prisma.aIGenerationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        generationType: true,
        success: true,
        qualityScore: true,
        defenseSystem: true,
        validationErrors: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('Failed to get user generation history:', error);
    throw error;
  }
}
