'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Score5x5x5 {
  overallScore: number; // 0-100%
  systemScore: number;  // 0-100% (5 systems coverage)
  foodScore: number;    // 0-100% (5 foods per system)
  frequencyScore: number; // 0-100% (5 meal times)
  performanceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
}

interface ScoreCard5x5x5Props {
  date: Date;
  onRefresh?: () => void;
  className?: string;
}

const performanceLevels = {
  Beginner: { min: 0, max: 20, color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🌱' },
  Intermediate: { min: 20, max: 40, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '📈' },
  Advanced: { min: 40, max: 60, color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '🎯' },
  Expert: { min: 60, max: 80, color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '⭐' },
  Master: { min: 80, max: 100, color: 'text-green-600', bgColor: 'bg-green-100', icon: '🏆' },
};

export default function ScoreCard5x5x5({
  date,
  onRefresh,
  className = '',
}: ScoreCard5x5x5Props) {
  const [score, setScore] = useState<Score5x5x5 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

  const fetchScore = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/progress/daily-summary?date=${dateStr}`);

      if (!response.ok) {
        throw new Error('Failed to fetch score');
      }

      const data = await response.json();

      // Calculate performance level based on overall score
      let performanceLevel: Score5x5x5['performanceLevel'] = 'Beginner';
      const overall = data.score?.overall || 0;

      if (overall >= 80) performanceLevel = 'Master';
      else if (overall >= 60) performanceLevel = 'Expert';
      else if (overall >= 40) performanceLevel = 'Advanced';
      else if (overall >= 20) performanceLevel = 'Intermediate';

      const scoreData: Score5x5x5 = {
        overallScore: overall,
        systemScore: data.score?.dimensions?.systems?.score || 0,
        foodScore: data.score?.dimensions?.foods?.score || 0,
        frequencyScore: data.score?.dimensions?.frequency?.score || 0,
        performanceLevel,
      };

      setScore(scoreData);

      // Determine trend (you could compare with previous day in future enhancement)
      if (overall >= 70) setTrend('up');
      else if (overall <= 30) setTrend('down');
      else setTrend('neutral');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const handleRefresh = () => {
    fetchScore();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">{error || 'Failed to load score'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const levelInfo = performanceLevels[score.performanceLevel];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">5×5×5 Score</h2>
          <TrendIcon
            className={`w-5 h-5 ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'
            }`}
          />
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh score"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold text-gray-900">
            {Math.round(score.overallScore)}
          </span>
          <span className="text-2xl text-gray-500">/ 100</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${score.overallScore}%` }}
          />
        </div>

        {/* Performance Level Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${levelInfo.bgColor}`}>
          <span className="text-2xl">{levelInfo.icon}</span>
          <span className={`font-semibold ${levelInfo.color}`}>
            {score.performanceLevel}
          </span>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Dimension Breakdown</h3>

        {/* Systems Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-gray-700">Defense Systems</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${score.systemScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-10 text-right">
              {Math.round(score.systemScore)}%
            </span>
          </div>
        </div>

        {/* Foods Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">Food Variety</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${score.foodScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-10 text-right">
              {Math.round(score.foodScore)}%
            </span>
          </div>
        </div>

        {/* Frequency Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-700">Meal Frequency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${score.frequencyScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-10 text-right">
              {Math.round(score.frequencyScore)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Target: 5 systems × 5 foods × 5 meal times per day
        </p>
      </div>
    </div>
  );
}
