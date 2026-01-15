'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isFuture, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, TrendingUp, Award, CheckCircle2, Circle, Clock, CalendarPlus, LibraryBig, CheckCheck, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Calculate week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchWeekData();
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
      
      // Map API data to day progress
      const dayProgressData: DayProgress[] = daysInWeek.map(day => {
        const dayData = progressData.days?.find((d: any) => 
          isSameDay(new Date(d.date), day)
        );

        const dayPlanned = plannedData.plannedMeals?.filter((meal: any) => 
          isSameDay(new Date(meal.date), day)
        ) || [];

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
          plannedMeals: dayPlanned.map((meal: any) => ({
            id: meal.id,
            mealTime: meal.mealTime,
            recipeId: meal.recipeId,
            recipeTitle: meal.recipeTitle,
            isLogged: meal.isLogged || false,
          })),
        };
      });

      setWeekData(dayProgressData);

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
    if (expandedDay && isSameDay(expandedDay, day)) {
      setExpandedDay(null);
    } else {
      setExpandedDay(day);
    }
  };

  const handleNavigateToDay = (day: Date) => {
    router.push(`/progress?date=${format(day, 'yyyy-MM-dd')}&view=daily`);
  };

  const handleQuickAddMeal = (day: Date) => {
    router.push(`/recipes/ai-generate?date=${format(day, 'yyyy-MM-dd')}&from=weekly-view`);
  };

  const handleLogPlannedMeal = async (mealId: string, dayDate: Date) => {
    try {
      const response = await fetch(`/api/meal-planner/log-planned-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId, date: format(dayDate, 'yyyy-MM-dd') }),
      });

      if (!response.ok) throw new Error('Failed to log meal');

      // Refresh week data
      await fetchWeekData();
    } catch (error) {
      console.error('Error logging planned meal:', error);
      alert('Failed to log meal');
    }
  };

  const handleLogAllPlannedMeals = async (dayDate: Date) => {
    const dayData = weekData.find(d => isSameDay(d.date, dayDate));
    if (!dayData || !dayData.plannedMeals.length) return;

    try {
      await Promise.all(
        dayData.plannedMeals
          .filter(meal => !meal.isLogged)
          .map(meal => handleLogPlannedMeal(meal.id, dayDate))
      );
    } catch (error) {
      console.error('Error logging all planned meals:', error);
    }
  };

  const handlePlanWeek = () => {
    // Navigate to meal planner with week mode
    router.push(`/meal-planner?mode=week&startDate=${format(weekStart, 'yyyy-MM-dd')}`);
  };

  const handleApplyMealPlan = () => {
    setShowApplyModal(true);
  };

  const getDayStatus = (day: DayProgress) => {
    if (isFuture(day.date)) {
      return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-100', label: 'Future' };
    }
    if (!day.hasData) {
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
            onClick={handlePlanWeek}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center justify-center gap-2 shadow-md"
          >
            <CalendarPlus className="w-5 h-5" />
            Plan This Week
          </button>
          
          <button
            onClick={handleApplyMealPlan}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 shadow-md"
          >
            <LibraryBig className="w-5 h-5" />
            Apply Meal Plan
          </button>
        </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {weekData.map((dayData) => {
          const status = getDayStatus(dayData);
          const StatusIcon = status.icon;
          const isExpanded = expandedDay && isSameDay(expandedDay, dayData.date);
          const isTodayDate = isToday(dayData.date);

          return (
            <div
              key={dayData.date.toISOString()}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all ${
                isTodayDate ? 'ring-2 ring-purple-500' : ''
              } ${isExpanded ? 'lg:col-span-2 xl:col-span-2' : ''}`}
            >
              {/* Day Header */}
              <div
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${status.bgColor}`}
                onClick={() => handleDayClick(dayData.date)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      {format(dayData.date, 'EEE')}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {format(dayData.date, 'd')}
                    </div>
                  </div>
                  <StatusIcon className={`w-6 h-6 ${status.color}`} />
                </div>

                {/* Score */}
                {dayData.hasData && (
                  <div className={`text-3xl font-bold mb-2 ${getScoreColor(dayData.score)}`}>
                    {dayData.score}%
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {dayData.hasPlannedMeals && (
                    <div className="flex items-center justify-between">
                      <span>📋 Planned</span>
                      <span className="font-semibold">{dayData.mealsPlanned}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>✅ Logged</span>
                    <span className="font-semibold">{dayData.mealsLogged}/{dayData.totalMeals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Systems</span>
                    <span className="font-semibold">{dayData.systemsCovered}/{dayData.totalSystems}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Actions */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                  {/* Planned Meals List */}
                  {dayData.hasPlannedMeals && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Planned Meals:</div>
                      {dayData.plannedMeals.map((meal) => (
                        <div key={meal.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">{meal.mealTime}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{meal.recipeTitle}</div>
                          </div>
                          {!meal.isLogged && !isFuture(dayData.date) && (
                            <button
                              onClick={() => handleLogPlannedMeal(meal.id, dayData.date)}
                              className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" />
                              Log
                            </button>
                          )}
                          {meal.isLogged && (
                            <span className="ml-2 text-green-600 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Logged
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {/* Log All Button */}
                      {dayData.plannedMeals.some(m => !m.isLogged) && !isFuture(dayData.date) && (
                        <button
                          onClick={() => handleLogAllPlannedMeals(dayData.date)}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Log All Planned Meals
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <button
                    onClick={() => handleNavigateToDay(dayData.date)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    View Day Details
                  </button>
                  
                  {!isFuture(dayData.date) && (
                    <button
                      onClick={() => handleQuickAddMeal(dayData.date)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Meal
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
}
