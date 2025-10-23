'use client';

import { useState } from 'react';
import { useProgress, useProgressStats } from '@/hooks/useProgress';
import ProgressTracker from '@/components/progress/ProgressTracker';
import ProgressCharts from '@/components/progress/ProgressCharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

export default function ProgressPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  const { progress, dailyProgress, loading: progressLoading, logFood } = useProgress(selectedDate);
  const { stats, loading: statsLoading } = useProgressStats('week');

  const handleLogFood = async (system: any, foods: string[], notes?: string) => {
    await logFood(system, foods, notes);
  };

  // Convert progress data to the format expected by ProgressTracker
  const currentProgress = dailyProgress?.systems || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                My Progress Tracker
              </h1>
              <p className="text-gray-600">
                Track your daily 5x5x5 journey and visualize your health progress
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
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
                  : 'text-gray-600 hover:bg-gray-50'
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
              />
            )}

            {/* Date Selector */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                View Progress for Different Date
              </h3>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Quick Tips */}
            <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3">
                💡 Tips for Success
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
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