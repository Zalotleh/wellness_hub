'use client';

import { useState, useEffect } from 'react';
import { useProgress, useProgressStats } from '@/hooks/useProgress';
import { useProgressDays } from '@/hooks/useProgressDays';
import MealTimeTracker from '@/components/progress/MealTimeTracker';
import SystemProgressChart from '@/components/progress/SystemProgressChart';
import SmartRecommendations from '@/components/progress/SmartRecommendations';
import FoodLogModal from '@/components/progress/FoodLogModal';
import OverallScoreCard from '@/components/progress/OverallScoreCard';
import TimeFilter, { ViewType } from '@/components/progress/TimeFilter';
import SmartActionsPanel from '@/components/progress/SmartActionsPanel';
import { RecommendationCards } from '@/components/progress/RecommendationCards';
import { ProgressErrorBoundary } from '@/components/progress/ProgressErrorBoundary';
import EmptyStateWelcome from '@/components/progress/EmptyStateWelcome';
import { addDays, subDays, isToday, format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Plus, Info } from 'lucide-react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import type { MealTime } from '@/components/progress/MealTimeTracker';
import type { DefenseSystem } from '@/types';

export default function ProgressPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('daily');
  const [showFoodLogModal, setShowFoodLogModal] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('BREAKFAST');
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const { progress, dailyProgress, loading: progressLoading, logFood, refetch: refetchProgress } = useProgress(selectedDate);
  const { stats, loading: statsLoading, refetch: refetchStats } = useProgressStats('week');
  const { daysWithProgress } = useProgressDays();

  // Fetch recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [selectedDate]);

  // Refetch data when arriving from another page with updates
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('updated')) {
      refetchProgress();
      fetchRecommendations();
      // Clean up the URL
      window.history.replaceState({}, '', '/progress');
    }
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const { data } = await response.json();
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleLogFood = async (system: any, foods: string[], notes?: string) => {
    await logFood(system, foods, notes);
  };

  const handleMealTimeClick = (mealTime: MealTime) => {
    setSelectedMealTime(mealTime);
    setShowFoodLogModal(true);
  };

  const handleFoodLogSuccess = async () => {
    // Refresh progress data after successful food log
    await refetchProgress();
    await fetchRecommendations();
  };

  const handleFoodRecommendationClick = (food: any) => {
    // Open food log modal with the selected food pre-populated
    setShowFoodLogModal(true);
  };

  const handleSystemClick = (system: DefenseSystem) => {
    setSelectedSystem(system);
    // Could scroll to system details or open a modal
  };

  // Check if user has any progress data by checking if any defense system has foods logged
  const hasAnyProgress = dailyProgress && Object.values(dailyProgress.systems).some(system => system.count > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Health Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your 5x5x5 wellness journey
                </p>
              </div>
            </div>
            
            {/* Info Button */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Information"
            >
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📊 Why the 5x5x5 Framework Matters
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Based on Dr. William Li's groundbreaking research, the 5x5x5 framework helps you activate your body's natural defense systems through food. Each "5" represents:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                  <span><strong>5 Defense Systems:</strong> Angiogenesis, Regeneration, Microbiome, DNA Protection, and Immunity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                  <span><strong>5 Foods per System:</strong> Eat at least 5 different foods that support each defense system daily</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                  <span><strong>5 Times per Day:</strong> Distribute these foods across multiple meals and snacks throughout the day</span>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                Your overall score (0-100) reflects how well you're following this framework. Higher scores indicate better activation of your body's defense systems!
              </p>
            </div>
          )}
        </div>

        {/* Time Filter */}
        <TimeFilter
          view={view}
          date={selectedDate}
          onViewChange={setView}
          onDateChange={setSelectedDate}
        />

        {/* Overall Score Card - Horizontal Layout */}
        {view === 'daily' && (hasAnyProgress || !isToday(selectedDate)) && (
          <ProgressErrorBoundary>
            <OverallScoreCard date={selectedDate} className="horizontal" />
          </ProgressErrorBoundary>
        )}

        {/* Content */}
        <div className="space-y-6 mt-6">
          {/* Daily View */}
          {view === 'daily' && (
            <>
              {/* Show Welcome Screen for New Users */}
              {!progressLoading && !hasAnyProgress && isToday(selectedDate) && (
                <EmptyStateWelcome />
              )}

              {/* Show Normal Progress Dashboard for Users with Data */}
              {(hasAnyProgress || !isToday(selectedDate)) && (
                <>
                  {/* Smart Actions Panel */}
                  <ProgressErrorBoundary>
                    <SmartActionsPanel date={selectedDate} />
                  </ProgressErrorBoundary>

                  {/* Recommendation Cards (replaces WorkflowProgressBar) */}
                  <ProgressErrorBoundary>
                    {!loadingRecs && (
                      <RecommendationCards 
                        recommendations={recommendations}
                        onRefresh={fetchRecommendations}
                      />
                    )}
                    {loadingRecs && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">Loading recommendations...</p>
                      </div>
                    )}
                  </ProgressErrorBoundary>

              {/* Defense Systems Progress */}
              <ProgressErrorBoundary>
                <SystemProgressChart date={selectedDate} />
              </ProgressErrorBoundary>

              {/* Food Suggestions - Full Width */}
              <ProgressErrorBoundary>
                <SmartRecommendations 
                  date={selectedDate}
                  onFoodClick={handleFoodRecommendationClick}
                />
              </ProgressErrorBoundary>

              {/* Meal Time Tracker */}
              <ProgressErrorBoundary>
                <MealTimeTracker
                  date={selectedDate}
                  onMealClick={handleMealTimeClick}
                />
              </ProgressErrorBoundary>
                </>
              )}
            </>
          )}

          {/* Weekly View */}
          {view === 'weekly' && (
            <div>
              {/* Refresh Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => refetchStats()}
                  className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  disabled={statsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
              </div>

              {statsLoading || !stats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Weekly Charts</h3>
                  <p className="text-gray-500 dark:text-gray-400">Coming soon - Weekly progress visualization</p>
                </div>
              )}
            </div>
          )}

          {/* Monthly View */}
          {view === 'monthly' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Monthly View Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We're working on comprehensive monthly analytics and trends.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  For now, use the weekly view to track your progress over time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {view === 'daily' && (
        <button
          onClick={() => setShowFoodLogModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-30 pointer-events-auto"
          title="Log Food"
          aria-label="Log Food"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Food Log Modal */}
      <FoodLogModal
        isOpen={showFoodLogModal}
        defaultMealTime={selectedMealTime}
        date={selectedDate}
        onClose={() => setShowFoodLogModal(false)}
        onSuccess={handleFoodLogSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}