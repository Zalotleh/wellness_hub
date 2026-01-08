import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const date = dateStr ? new Date(dateStr) : new Date();
    
    // Validate date
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate view parameter
    if (!['daily', 'weekly', 'monthly'].includes(view)) {
      return NextResponse.json(
        { error: 'Invalid view parameter. Must be: daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Calculate score based on view
    if (view === 'daily') {
      const startTime = Date.now();
      
      // Use cached score if available, otherwise calculate
      const score = await getCachedOrCalculateScore(userId, date);
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        score,
        meta: {
          date: startOfDay(date).toISOString(),
          view: 'daily',
          calculationTime: `${duration}ms`,
        },
      });
    } else if (view === 'weekly') {
      const startTime = Date.now();
      
      const weeklyScore = await calculateWeeklyScores(userId, date);
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        score: weeklyScore,
        meta: {
          weekStart: weeklyScore.weekStart.toISOString(),
          weekEnd: weeklyScore.weekEnd.toISOString(),
          view: 'weekly',
          calculationTime: `${duration}ms`,
        },
      });
    } else if (view === 'monthly') {
      const startTime = Date.now();
      
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
