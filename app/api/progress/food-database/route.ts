import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { foodDatabaseSearchSchema } from '@/lib/validations';
import { DefenseSystem } from '@prisma/client';

/**
 * GET /api/progress/food-database
 * 
 * Search and browse the food database
 * Supports filtering by category, defense systems, and multi-system count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const minSystemCount = searchParams.get('minSystemCount') 
      ? parseInt(searchParams.get('minSystemCount')!)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Parse defense systems array from comma-separated string
    const defenseSystemsParam = searchParams.get('defenseSystems');
    const defenseSystems = defenseSystemsParam
      ? defenseSystemsParam.split(',').filter(s => s) as DefenseSystem[]
      : undefined;

    // Build where clause
    const where: any = {};

    // Text search (name or category)
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          category: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    // Category filter
    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive' as const,
      };
    }

    // Defense systems filter (has at least one of the specified systems)
    if (defenseSystems && defenseSystems.length > 0) {
      where.defenseSystems = {
        hasSome: defenseSystems,
      };
    }

    // Fetch all matching foods
    let foods = await prisma.foodDatabase.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    // Filter by minimum system count (can't do this in Prisma query)
    if (minSystemCount) {
      foods = foods.filter(food => food.defenseSystems.length >= minSystemCount);
    }

    // Apply limit
    foods = foods.slice(0, limit);

    // Get unique categories for filtering
    const allCategories = await prisma.foodDatabase.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    // Format response
    const formattedFoods = foods.map(food => ({
      id: food.id,
      name: food.name,
      category: food.category,
      defenseSystems: food.defenseSystems,
      systemBenefits: food.systemBenefits,
      nutrients: food.nutrients,
      systemCount: food.defenseSystems.length,
      isMultiSystem: food.defenseSystems.length >= 3,
    }));

    // Calculate statistics
    const stats = {
      total: formattedFoods.length,
      multiSystemCount: formattedFoods.filter(f => f.isMultiSystem).length,
      averageSystemCount: formattedFoods.length > 0
        ? formattedFoods.reduce((sum, f) => sum + f.systemCount, 0) / formattedFoods.length
        : 0,
      byCategory: Object.entries(
        formattedFoods.reduce((acc, food) => {
          acc[food.category] = (acc[food.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([category, count]) => ({ category, count })),
    };

    return NextResponse.json({
      foods: formattedFoods,
      stats,
      filters: {
        categories: allCategories.map(c => c.category),
        defenseSystems: Object.values(DefenseSystem),
      },
    });
  } catch (error: any) {
    console.error('Error fetching food database:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch food database' },
      { status: 500 }
    );
  }
}
