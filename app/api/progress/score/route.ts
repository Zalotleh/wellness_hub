import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCachedOrCalculateScore } from '@/lib/tracking/score-cache';
import { calculateWeeklyScores, calculateMonthlyScores } from '@/lib/tracking/score-calculator';
import { startOfDay } from 'date-fns';

/**
 * GET /api/progress/score
 * 
 * Calculate and return 5x5x5 progress scores
 * 
 * Query Parameters:
 * - date: ISO date string (defaults to today)
 * - view: 'daily' | 'weekly' | 'monthly' (defaults to 'daily')
 * 
 * Returns:
 * - Daily view: Single Score5x5x5 object
 * - Weekly view: WeeklyScore with 7 days of data
 * - Monthly view: MonthlyScore with ~30 days of data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const view = searchParams.get('view') || 'daily';

    // Parse date or default to today
    let date: Date;
    try {
      date = dateStr ? new Date(dateStr) : new Date();
      
      // Validate date
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (err) {
      return NextResponse.json(
        { 
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
          details: err instanceof Error ? err.message : 'Date parsing failed'
        },
        { status: 400 }
      );
    }

    // Validate view parameter
    if (!['daily', 'weekly', 'monthly'].includes(view)) {
      return NextResponse.json(
        { 
          error: 'Invalid view parameter. Must be: daily, weekly, or monthly',
          received: view
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { error: 'User not found in database. Please sign out and sign in again.' },
        { status: 404 }
      );
    }

    // Calculate score based on view
    if (view === 'daily') {
      const startTime = Date.now();
      
      try {
        // Use cached score if available, otherwise calculate
        const score = await getCachedOrCalculateScore(userId, date);
        
        const duration = Date.now() - startTime;
        
        return NextResponse.json({
          score,
          meta: {
            date: startOfDay(date).toISOString(),
            view: 'daily',
            calculationTime: `${duration}ms`,
            cached: score ? true : false,
          },
        });
      } catch (err: any) {
        console.error('Daily score calculation error:', err);
        return NextResponse.json(
          { 
            error: 'Failed to calculate daily score',
            details: err instanceof Error ? err.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else if (view === 'weekly') {
      const startTime = Date.now();
      
      try {
        const weeklyScore = await calculateWeeklyScores(userId, date);
        
        const duration = Date.now() - startTime;
        
        return NextResponse.json({
          score: weeklyScore,
          meta: {
            weekStart: weeklyScore.weekStart.toISOString(),
            view: 'weekly',
            calculationTime: `${duration}ms`,
          },
        });
      } catch (err: any) {
        console.error('Weekly score calculation error:', err);
        return NextResponse.json(
          { 
            error: 'Failed to calculate weekly score',
            details: err instanceof Error ? err.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else if (view === 'monthly') {
      const startTime = Date.now();
      
      try {
        const monthlyScore = await calculateMonthlyScores(userId, date);
        
        const duration = Date.now() - startTime;
        
        return NextResponse.json({
          score: monthlyScore,
          meta: {
            month: monthlyScore.month.toISOString(),
            view: 'monthly',
            calculationTime: `${duration}ms`,
          },
        });
      } catch (err: any) {
        console.error('Monthly score calculation error:', err);
        return NextResponse.json(
          { 
            error: 'Failed to calculate monthly score',
            details: err instanceof Error ? err.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Score calculation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
