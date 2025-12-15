'use client';

import { useState } from 'react';
import { useProgress, useProgressStats } from '@/hooks/useProgress';
import { useProgressDays } from '@/hooks/useProgressDays';
import ProgressTracker from '@/components/progress/ProgressTracker';
import ProgressCharts from '@/components/progress/ProgressCharts';
import { addDays, subDays, isToday, format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

export default function ProgressPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  const { progress, dailyProgress, loading: progressLoading, logFood } = useProgress(selectedDate);
  const { stats, loading: statsLoading, refetch: refetchStats } = useProgressStats('week');
  const { daysWithProgress } = useProgressDays();

  const handleLogFood = async (system: any, foods: string[], notes?: string) => {
    await logFood(system, foods, notes);
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
          <div>
            {progressLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <ProgressTracker
                currentProgress={currentProgress}
                onLogFood={handleLogFood}
                date={selectedDate}
                onDateChange={setSelectedDate}
                daysWithProgress={daysWithProgress}
              />
            )}



            {/* Quick Tips */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
                💡 Tips for Success
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>
                    <strong>Be consistent:</strong> Try to eat 5 foods from each system daily
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>
                    <strong>Variety matters:</strong> Rotate different foods to get diverse nutrients
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>
                    <strong>Log regularly:</strong> Make it a habit to track your meals
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>
                    <strong>Use recipes:</strong> Find recipes that incorporate multiple defense systems
                  </span>
                </li>
              </ul>
            </div>
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
    </div>
  );
}