'use client';

import { useState } from 'react';
import { useProgress, useProgressStats } from '@/hooks/useProgress';
import { useProgressDays } from '@/hooks/useProgressDays';
import ProgressTracker from '@/components/progress/ProgressTracker';
import ProgressCharts from '@/components/progress/ProgressCharts';
import ScoreCard5x5x5 from '@/components/progress/ScoreCard5x5x5';
import MealTimeTracker from '@/components/progress/MealTimeTracker';
import SystemProgressChart from '@/components/progress/SystemProgressChart';
import SmartRecommendations from '@/components/progress/SmartRecommendations';
import FoodLogModal from '@/components/progress/FoodLogModal';
import { addDays, subDays, isToday, format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import type { MealTime } from '@/components/progress/MealTimeTracker';

export default function ProgressPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [showFoodLogModal, setShowFoodLogModal] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('BREAKFAST');

  const { progress, dailyProgress, loading: progressLoading, logFood } = useProgress(selectedDate);
  const { stats, loading: statsLoading, refetch: refetchStats } = useProgressStats('week');
  const { daysWithProgress } = useProgressDays();

  const handleLogFood = async (system: any, foods: string[], notes?: string) => {
    await logFood(system, foods, notes);
  };

  const handleMealTimeClick = (mealTime: MealTime) => {
    setSelectedMealTime(mealTime);
    setShowFoodLogModal(true);
  };

  const handleFoodLogSuccess = () => {
    // Refresh progress data after successful food log
    window.location.reload();
  };

  const handleFoodRecommendationClick = (food: any) => {
    // Open food log modal with the selected food pre-populated
    setShowFoodLogModal(true);
  };

  // Convert progress data to the format expected by ProgressTracker
  const currentProgress = dailyProgress?.systems || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                My Progress Tracker
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your daily 5x5x5 journey and visualize your health progress
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Today's Progress</span>
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Weekly Analytics</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'today' ? (
          <div className="space-y-6">
            {progressLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* Score Card */}
                <ScoreCard5x5x5 
                  date={selectedDate} 
                  onRefresh={() => window.location.reload()}
                />

                {/* Meal Time Tracker */}
                <MealTimeTracker
                  date={selectedDate}
                  onMealClick={handleMealTimeClick}
                />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* System Progress Chart */}
                  <SystemProgressChart date={selectedDate} />

                  {/* Smart Recommendations */}
                  <SmartRecommendations 
                    date={selectedDate}
                    onFoodClick={handleFoodRecommendationClick}
                  />
                </div>

                {/* Original Progress Tracker (collapsed) */}
                <details className="bg-white rounded-lg shadow-lg">
                  <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
                    Advanced Progress Tracker
                  </summary>
                  <div className="p-6 border-t border-gray-200">
                    <ProgressTracker
                      currentProgress={currentProgress}
                      onLogFood={handleLogFood}
                      date={selectedDate}
                      onDateChange={setSelectedDate}
                      daysWithProgress={daysWithProgress}
                    />
                  </div>
                </details>
              </>
            )}
          </div>
        ) : (
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
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <ProgressCharts weeklyData={stats} />
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Outside conditional rendering */}
      {activeTab === 'today' && (
        <button
          onClick={() => setShowFoodLogModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-30 pointer-events-auto"
          title="Log Food"
          aria-label="Log Food"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Food Log Modal - Outside conditional rendering */}
      <FoodLogModal
        isOpen={showFoodLogModal}
        defaultMealTime={selectedMealTime}
        onClose={() => setShowFoodLogModal(false)}
        onSuccess={handleFoodLogSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}