'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Award, CheckCircle2, Circle, Clock, CalendarPlus, CheckCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import WeeklyMealPlannerModal from './WeeklyMealPlannerModal';

interface DayProgress {
  date: Date;
  score: number;
  mealsLogged: number;
  mealsPlanned: number;
  totalMeals: number;
  systemsCovered: number;
  totalSystems: number;
  hasData: boolean;
  hasPlannedMeals: boolean;
  plannedMeals: PlannedMeal[];
}

interface PlannedMeal {
  id: string;
  mealTime: string;
  recipeId: string;
  recipeTitle: string;
  isLogged: boolean;
  mealPlanId?: string;
}

interface WeeklyStats {
  averageScore: number;
  totalMeals: number;
  daysCompleted: number;
  streak: number;
  bestDay: {
    date: Date;
    score: number;
  } | null;
}

interface WeekPlanInfo {
  exists: boolean;
  mealPlan: {
    id: string;
    weekStart: Date;
    weekEnd: Date;
    createdAt: Date;
    stats: {
      totalMeals: number;
      loggedMeals: number;
      remainingMeals: number;
    };
  } | null;
}

interface WeeklyProgressViewProps {
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  className?: string;
}

export default function WeeklyProgressView({
  selectedWeek,
  onWeekChange,
  className = '',
}: WeeklyProgressViewProps) {
  const router = useRouter();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [weekPlanInfo, setWeekPlanInfo] = useState<WeekPlanInfo | null>(null);
  const [loggingPlan, setLoggingPlan] = useState(false);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Calculate week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchWeekData();
    checkWeekPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      
      // Fetch both progress and planned meals
      const [progressResponse, plannedResponse] = await Promise.all([
        fetch(`/api/progress/weekly?startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`),
        fetch(`/api/meal-planner/weekly-planned?startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`)
      ]);
      
      if (!progressResponse.ok) {
        throw new Error('Failed to fetch weekly data');
      }

      const progressData = await progressResponse.json();
      const plannedData = plannedResponse.ok ? await plannedResponse.json() : { plannedMeals: [] };
      
      console.log('Weekly Progress Data:', {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        progressDays: progressData.days?.length || 0,
        plannedMeals: plannedData.plannedMeals?.length || 0,
      });
      
      // Map API data to day progress
      const dayProgressData: DayProgress[] = daysInWeek.map(day => {
        // Normalize day for comparison
        const dayString = format(day, 'yyyy-MM-dd');
        
        type ApiDay = { date: string; score?: number; mealsLogged?: number; systemsCovered?: number; hasData?: boolean };
        type ApiMeal = { date: string; id: string; mealTime: string; recipeId: string; recipeTitle: string; isLogged?: boolean; mealPlanId?: string };

        const dayData = progressData.days?.find((d: ApiDay) => {
          const apiDayString = format(new Date(d.date), 'yyyy-MM-dd');
          return apiDayString === dayString;
        });

        const dayPlanned: ApiMeal[] = plannedData.plannedMeals?.filter((meal: ApiMeal) => {
          const mealDayString = format(new Date(meal.date), 'yyyy-MM-dd');
          return mealDayString === dayString;
        }) || [];
        
        console.log(`Day ${dayString}:`, {
          hasProgressData: !!dayData,
          score: dayData?.score || 0,
          mealsLogged: dayData?.mealsLogged || 0,
          plannedCount: dayPlanned.length,
        });

        return {
          date: day,
          score: dayData?.score || 0,
          mealsLogged: dayData?.mealsLogged || 0,
          mealsPlanned: dayPlanned.length,
          totalMeals: 5,
          systemsCovered: dayData?.systemsCovered || 0,
          totalSystems: 5,
          hasData: dayData?.hasData || false,
          hasPlannedMeals: dayPlanned.length > 0,
          plannedMeals: dayPlanned.map((meal) => ({
            id: meal.id,
            mealTime: meal.mealTime,
            recipeId: meal.recipeId,
            recipeTitle: meal.recipeTitle,
            isLogged: meal.isLogged || false,
            mealPlanId: meal.mealPlanId,
          })),
        };
      });

      setWeekData(dayProgressData);

      // Extract logged dates (days with meals logged)
      const logged = new Set<string>();
      dayProgressData.forEach(day => {
        if (day.mealsLogged > 0) {
          logged.add(format(day.date, 'yyyy-MM-dd'));
        }
      });
      setLoggedDates(logged);

      // Calculate weekly stats
      const daysWithData = dayProgressData.filter(d => d.hasData);
      const totalScore = daysWithData.reduce((sum, d) => sum + d.score, 0);
      const totalMeals = daysWithData.reduce((sum, d) => sum + d.mealsLogged, 0);
      const daysCompleted = daysWithData.filter(d => d.score >= 80).length;
      
      const bestDay = daysWithData.length > 0
        ? daysWithData.reduce((best, current) => 
            current.score > best.score ? current : best
          )
        : null;

      setWeeklyStats({
        averageScore: daysWithData.length > 0 ? Math.round(totalScore / daysWithData.length) : 0,
        totalMeals,
        daysCompleted,
        streak: calculateStreak(dayProgressData),
        bestDay: bestDay ? { date: bestDay.date, score: bestDay.score } : null,
      });

    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (days: DayProgress[]): number => {
    let streak = 0;
    const sortedDays = [...days].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const day of sortedDays) {
      if (isFuture(day.date)) continue;
      if (day.hasData && day.score >= 50) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const checkWeekPlan = async () => {
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/meal-planner/check-week-plan?weekStart=${startDate}&weekEnd=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setWeekPlanInfo(data);
      }
    } catch (error) {
      console.error('Error checking week plan:', error);
    }
  };

  const handleLogWeekPlan = async () => {
    if (!weekPlanInfo?.mealPlan?.id) return;

    if (!confirm('Log all remaining meals from your weekly plan?')) {
      return;
    }

    setLoggingPlan(true);
    try {
      const response = await fetch('/api/meal-planner/log-week-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId: weekPlanInfo.mealPlan.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to log week plan');
      }

      console.log('Week plan logged:', result);

      // Refresh data
      await Promise.all([fetchWeekData(), checkWeekPlan()]);
      
      if (result.logged > 0) {
        alert(result.message || `Successfully logged ${result.logged} meal${result.logged > 1 ? 's' : ''}!`);
      } else {
        alert(result.message || 'No meals were logged');
      }
    } catch (error) {
      console.error('Error logging week plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to log week plan');
    } finally {
      setLoggingPlan(false);
    }
  };

  const handlePlanCreated = async () => {
    await Promise.all([fetchWeekData(), checkWeekPlan()]);
  };

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedWeek, 1));
  };

  const handleToday = () => {
    onWeekChange(new Date());
  };

  const handleDayClick = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const expandedDayString = expandedDay ? format(expandedDay, 'yyyy-MM-dd') : null;

    setSelectedCard(prev => prev === dayString ? null : dayString);

    if (expandedDayString === dayString) {
      setExpandedDay(null);
    } else {
      setExpandedDay(day);
    }
  };

  const handleNavigateToDay = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    router.push(`/dashboard?date=${dateString}`);
  };

  const handleLogPlannedMeal = async (mealId: string, dayDate: Date) => {
    try {
      const response = await fetch(`/api/meal-planner/log-planned-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId, date: format(dayDate, 'yyyy-MM-dd') }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to log meal');
      }

      // Refresh week data
      await fetchWeekData();
    } catch (error) {
      console.error('Error logging planned meal:', error);
      throw error; // Re-throw to be caught by caller
    }
  };

  const handleLogAllPlannedMeals = async (dayDate: Date) => {
    const dayDateString = format(dayDate, 'yyyy-MM-dd');
    const dayData = weekData.find(d => format(d.date, 'yyyy-MM-dd') === dayDateString);
    if (!dayData || !dayData.plannedMeals.length) return;

    try {
      const unloggedMeals = dayData.plannedMeals.filter(m => !m.isLogged);
      
      let successCount = 0;
      let failureCount = 0;
      let placeholderCount = 0;

      for (const meal of unloggedMeals) {
        try {
          await handleLogPlannedMeal(meal.id, dayDate);
          successCount++;
        } catch (error: unknown) {
          if (error instanceof Error && error.message?.includes('placeholder')) {
            placeholderCount++;
          } else {
            failureCount++;
          }
        }
      }
      
      // Final refresh after all meals processed
      await fetchWeekData();

      // Show appropriate message
      if (successCount > 0) {
        if (placeholderCount > 0) {
          alert(`Logged ${successCount} meal${successCount > 1 ? 's' : ''}. ${placeholderCount} placeholder meal${placeholderCount > 1 ? 's need' : ' needs'} a recipe first.`);
        } else {
          alert(`Successfully logged ${successCount} meal${successCount > 1 ? 's' : ''}!`);
        }
      } else if (placeholderCount > 0) {
        alert(`Cannot log ${placeholderCount} placeholder meal${placeholderCount > 1 ? 's' : ''}. Generate recipes first.`);
      } else if (failureCount > 0) {
        alert('Failed to log meals');
      }
    } catch (error) {
      console.error('Error logging all planned meals:', error);
      alert('Failed to log meals');
    }
  };

  const getDayStatus = (day: DayProgress) => {
    if (isFuture(day.date)) {
      return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-100', label: 'Future' };
    }
    if (!day.hasData || day.mealsLogged === 0) {
      return { icon: Circle, color: 'text-gray-400', bgColor: 'bg-gray-100', label: 'No data' };
    }
    if (day.score >= 80) {
      return { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Complete' };
    }
    if (day.score >= 50) {
      return { icon: TrendingUp, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Good' };
    }
    return { icon: Circle, color: 'text-orange-500', bgColor: 'bg-orange-100', label: 'Partial' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Weekly Progress
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium"
            >
              This Week
            </button>
            
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Planning Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPlannerModal(true)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center justify-center gap-3"
          >
            <CalendarPlus className="w-5 h-5 flex-shrink-0" />
            <div className="font-bold text-sm leading-tight">Generate a full week of meals at once</div>
          </button>
          
          {weekPlanInfo?.exists && weekPlanInfo.mealPlan && weekPlanInfo.mealPlan.stats && (
            <button
              onClick={handleLogWeekPlan}
              disabled={loggingPlan || weekPlanInfo.mealPlan.stats.remainingMeals === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-5 h-5" />
              {loggingPlan ? 'Logging...' : `Log Meal Plan (${weekPlanInfo.mealPlan.stats.remainingMeals} meals)`}
            </button>
          )}
        </div>

        {/* Week Plan Info */}
        {weekPlanInfo?.exists && weekPlanInfo.mealPlan?.stats && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Week Plan Active
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>Total Meals: {weekPlanInfo.mealPlan.stats.totalMeals}</div>
              <div>Logged: {weekPlanInfo.mealPlan.stats.loggedMeals}</div>
              <div>Remaining: {weekPlanInfo.mealPlan.stats.remainingMeals}</div>
            </div>
          </div>
        )}

        {/* Weekly Stats */}
        {weeklyStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Avg Score</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(weeklyStats.averageScore)}`}>
                {weeklyStats.averageScore}%
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Meals</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {weeklyStats.totalMeals}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">Days Complete</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {weeklyStats.daysCompleted}/7
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {weeklyStats.streak} days
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 overflow-visible">
        {weekData.map((dayData) => {
          const status = getDayStatus(dayData);
          const StatusIcon = status.icon;
          const dayString = format(dayData.date, 'yyyy-MM-dd');
          const isTodayDate = isToday(dayData.date);
          const isFutureDay = isFuture(dayData.date);

          // SVG ring values
          const radius = 22;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference * (1 - (dayData.hasData ? dayData.score : 0) / 100);
          const ringStroke =
            dayData.score >= 80 ? '#16a34a'
            : dayData.score >= 60 ? '#ca8a04'
            : dayData.score >= 40 ? '#ea580c'
            : dayData.score > 0  ? '#dc2626'
            : '#d1d5db';

          // Top accent bar colour
          const accentBar = isFutureDay || !dayData.hasData
            ? 'bg-gray-200 dark:bg-gray-700'
            : dayData.score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500'
            : dayData.score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
            : dayData.score >= 40 ? 'bg-gradient-to-r from-orange-400 to-orange-500'
            : 'bg-gradient-to-r from-red-400 to-red-500';

          const isHovered = hoveredCard === dayString;
          const isSelected = selectedCard === dayString;
          const isActive = isHovered || isSelected;
          const anyActive = hoveredCard !== null || selectedCard !== null;

          return (
            <div
              key={dayString}
              onMouseEnter={() => setHoveredCard(dayString)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                transform: isActive
                  ? 'scale(1.07) translateY(-10px)'
                  : anyActive
                  ? 'scale(0.96) translateY(4px)'
                  : 'scale(1) translateY(0px)',
                zIndex: isActive ? 20 : 0,
                opacity: anyActive && !isActive ? 0.82 : 1,
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, opacity 0.25s ease',
              }}
              className={`relative rounded-2xl overflow-hidden ${
                isActive ? 'shadow-2xl' : 'shadow-md'
              } ${isTodayDate ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
            >
              {/* Clickable card face */}
              <div
                className="bg-white dark:bg-gray-800 cursor-pointer select-none"
                onClick={() => handleDayClick(dayData.date)}
              >
                {/* Accent bar */}
                <div className={`h-1.5 w-full ${accentBar}`} />

                <div className="p-3 sm:p-4">
                  {/* Day label row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className={`text-[11px] font-bold uppercase tracking-widest ${
                        isTodayDate ? 'text-purple-500 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {format(dayData.date, 'EEE')}
                      </div>
                      <div className={`text-2xl font-extrabold leading-none mt-0.5 ${
                        isTodayDate ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-white'
                      }`}>
                        {format(dayData.date, 'd')}
                      </div>
                    </div>
                    {isTodayDate && (
                      <span className="text-[9px] font-bold uppercase bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full tracking-wide">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Score ring */}
                  <div className="flex justify-center my-2">
                    {isFutureDay ? (
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    ) : (
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
                          <circle
                            cx="26" cy="26" r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          {dayData.hasData && (
                            <circle
                              cx="26" cy="26" r={radius}
                              fill="none"
                              stroke={ringStroke}
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {dayData.hasData ? (
                            <span className={`text-[11px] font-black ${getScoreColor(dayData.score)}`}>
                              {dayData.score}%
                            </span>
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mini stats */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Meals</span>
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        {dayData.mealsLogged}
                        <span className="font-semibold text-gray-500 dark:text-gray-400">/{dayData.totalMeals}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Systems</span>
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        {dayData.systemsCovered}
                        <span className="font-semibold text-gray-500 dark:text-gray-400">/{dayData.totalSystems}</span>
                      </span>
                    </div>
                    {dayData.hasPlannedMeals && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Planned</span>
                        <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400">
                          {dayData.mealsPlanned}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status chip */}
                <div className="px-3 sm:px-4 pb-3">
                  <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 w-fit border ${
                    isFutureDay || !dayData.hasData
                      ? 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-600'
                      : dayData.score >= 80
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : dayData.score >= 50
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                  }`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded day panel — rendered below the grid so cards never shift */}
      {expandedDay && (() => {
        const expandedDayString = format(expandedDay, 'yyyy-MM-dd');
        const dayData = weekData.find(d => format(d.date, 'yyyy-MM-dd') === expandedDayString);
        if (!dayData) return null;
        const isFutureDay = isFuture(dayData.date);
        return (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {format(dayData.date, 'EEEE, MMMM d')}
              </span>
              <button
                onClick={() => setExpandedDay(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            {dayData.hasPlannedMeals && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-1">
                  Planned Meals
                </div>
                {dayData.plannedMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      meal.isLogged ? 'bg-green-500' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {meal.mealTime}
                      </div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {meal.recipeTitle}
                      </div>
                    </div>
                    {meal.isLogged ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : !isFutureDay ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLogPlannedMeal(meal.id, dayData.date); }}
                        className="flex-shrink-0 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Log
                      </button>
                    ) : null}
                  </div>
                ))}

                {dayData.plannedMeals.some(m => !m.isLogged) && !isFutureDay && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLogAllPlannedMeals(dayData.date); }}
                    className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Log All Planned Meals
                  </button>
                )}
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); handleNavigateToDay(dayData.date); }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Day Details
            </button>

            {dayData.hasPlannedMeals && dayData.plannedMeals[0]?.mealPlanId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const dayName = format(dayData.date, 'EEEE').toLowerCase();
                  const planId = dayData.plannedMeals[0].mealPlanId;
                  router.push(`/meal-planner/${planId}?day=${dayName}`);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open {format(dayData.date, 'EEEE')} Meal Plan
              </button>
            )}
          </div>
        );
      })()}

      {/* Best Day Highlight */}
      {weeklyStats?.bestDay && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border-2 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="font-bold text-yellow-900 dark:text-yellow-100">Best Day This Week!</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {format(weeklyStats.bestDay.date, 'EEEE, MMM d')} - {weeklyStats.bestDay.score}% score
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Weekly Meal Planner Modal */}
      <WeeklyMealPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onPlanCreated={handlePlanCreated}
        loggedDates={loggedDates}
      />
    </div>
  );
}
