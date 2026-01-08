import { calculate5x5x5Score } from './5x5x5-score';
import { cacheDailyScore } from './score-cache';
import { startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { WeeklyScore, MonthlyScore, Score5x5x5 } from './types';

/**
 * Calculate scores for the past 7 days
 */
export async function calculateWeeklyScores(
  userId: string,
  endDate: Date = new Date()
): Promise<WeeklyScore> {
  const weekStart = startOfWeek(endDate);
  const weekEnd = endOfWeek(endDate);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const dailyScores: Score5x5x5[] = [];
  let totalScore = 0;

  for (const day of days) {
    const score = await calculate5x5x5Score(userId, day);
    dailyScores.push(score);
    totalScore += score.overallScore;
  }

  const averageScore = totalScore / days.length;

  // Find best and worst days
  const sortedDays = dailyScores
    .map((score, index) => ({ score, day: days[index] }))
    .sort((a, b) => b.score.overallScore - a.score.overallScore);

  const bestDay = sortedDays[0].day;
  const worstDay = sortedDays[sortedDays.length - 1].day;

  // Determine trend
  const firstHalf = dailyScores.slice(0, Math.ceil(days.length / 2));
  const secondHalf = dailyScores.slice(Math.ceil(days.length / 2));
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.overallScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.overallScore, 0) / secondHalf.length;
  
  const trend = secondAvg > firstAvg + 5 ? 'improving' :
                secondAvg < firstAvg - 5 ? 'declining' : 'stable';

  return {
    weekStart,
    weekEnd,
    averageScore: Math.round(averageScore),
    dailyScores,
    trend,
    bestDay,
    worstDay,
  };
}

/**
 * Calculate scores for the past 30 days (monthly view)
 */
export async function calculateMonthlyScores(
  userId: string,
  monthDate: Date = new Date()
): Promise<MonthlyScore> {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Calculate weekly scores for each week in the month
  const weeks = [];
  let currentWeekStart = startOfWeek(monthStart);
  
  while (currentWeekStart <= monthEnd) {
    const weekScore = await calculateWeeklyScores(userId, currentWeekStart);
    weeks.push(weekScore);
    currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const averageScore = weeks.reduce((sum, w) => sum + w.averageScore, 0) / weeks.length;

  // Find best and worst weeks
  const sortedWeeks = weeks.sort((a, b) => b.averageScore - a.averageScore);
  const bestWeek = sortedWeeks[0].weekStart;
  const worstWeek = sortedWeeks[sortedWeeks.length - 1].weekStart;

  // Determine trend
  const firstHalf = weeks.slice(0, Math.ceil(weeks.length / 2));
  const secondHalf = weeks.slice(Math.ceil(weeks.length / 2));
  const firstAvg = firstHalf.reduce((sum, w) => sum + w.averageScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, w) => sum + w.averageScore, 0) / secondHalf.length;
  
  const trend = secondAvg > firstAvg + 5 ? 'improving' :
                secondAvg < firstAvg - 5 ? 'declining' : 'stable';

  return {
    month: monthStart,
    averageScore: Math.round(averageScore),
    weeklyScores: weeks,
    trend,
    bestWeek,
    worstWeek,
  };
}

/**
 * Recalculate score after food logging
 * Called automatically when user logs progress
 */
export async function recalculateScoreAfterFoodLog(
  userId: string,
  date: Date
): Promise<Score5x5x5> {
  const score = await calculate5x5x5Score(userId, date);
  await cacheDailyScore(userId, date, score);
  return score;
}

/**
 * Get score comparison between two dates
 */
export async function compareScores(
  userId: string,
  date1: Date,
  date2: Date
): Promise<{
  date1Score: Score5x5x5;
  date2Score: Score5x5x5;
  improvement: number;
  improvementPercent: number;
}> {
  const [score1, score2] = await Promise.all([
    calculate5x5x5Score(userId, date1),
    calculate5x5x5Score(userId, date2),
  ]);

  const improvement = score2.overallScore - score1.overallScore;
  const improvementPercent = score1.overallScore > 0 
    ? (improvement / score1.overallScore) * 100 
    : 0;

  return {
    date1Score: score1,
    date2Score: score2,
    improvement,
    improvementPercent: Math.round(improvementPercent),
  };
}
