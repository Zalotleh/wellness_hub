'use client';

import { useEffect, useState } from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { format } from 'date-fns';
import 'react-circular-progressbar/dist/styles.css';
import type { Score5x5x5 } from '@/lib/tracking/types';

interface OverallScoreCardProps {
  date: Date;
  onRefresh?: () => void;
}

export default function OverallScoreCard({ date, onRefresh }: OverallScoreCardProps) {
  const [score, setScore] = useState<Score5x5x5 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchScore();
  }, [date]);

  const fetchScore = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/progress/score?date=${dateStr}&view=daily`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch score');
      }
      
      const data = await res.json();
      setScore(data.score);
    } catch (err) {
      console.error('Error fetching score:', err);
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return '#10b981'; // green-500
    if (scoreValue >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getScoreLabel = (scoreValue: number) => {
    if (scoreValue >= 90) return 'Excellent!';
    if (scoreValue >= 80) return 'Great Job!';
    if (scoreValue >= 60) return 'Good Progress';
    if (scoreValue >= 40) return 'Keep Going';
    return "Let's Improve";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="flex justify-center mb-8">
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'No data available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start logging your food intake to see your score!
          </p>
          <button
            onClick={fetchScore}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const systemsCovered = score.defenseSystems.filter(s => s.foodsConsumed > 0).length;
  const mealsLogged = score.mealTimes.filter(m => m.hasFood).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your 5x5x5 Score
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle information"
        >
          <Info className={`w-5 h-5 ${showInfo ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}`} />
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Why This Matters
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Your 5x5x5 score reflects how well you&apos;re following Dr. William Li&apos;s framework:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
            <li>
              <strong className="text-gray-900 dark:text-gray-200">5 Defense Systems:</strong> Coverage of all health defense mechanisms
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-200">5 Foods per System:</strong> Variety within each defense system
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-200">5 Meal Times:</strong> Spreading nutrition throughout the day
            </li>
          </ul>
          <p className="mt-2 text-gray-700 dark:text-gray-300 font-medium">
            Aim for 80+ for optimal health benefits! 🎯
          </p>
        </div>
      )}

      {/* Score Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-48 h-48">
          <CircularProgressbar
            value={score.overallScore}
            text={`${score.overallScore}`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: getScoreColor(score.overallScore),
              textColor: getScoreColor(score.overallScore),
              trailColor: '#e5e7eb',
              pathTransitionDuration: 0.5,
            })}
          />
        </div>
      </div>

      {/* Score Label */}
      <div className="text-center mb-6">
        <p
          className="text-2xl font-bold mb-1"
          style={{ color: getScoreColor(score.overallScore) }}
        >
          {getScoreLabel(score.overallScore)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {score.insights.recommendation}
        </p>
      </div>

      {/* Next Steps */}
      {score.insights.nextSteps && score.insights.nextSteps.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
            Next Steps:
          </h4>
          <ul className="space-y-1">
            {score.insights.nextSteps.slice(0, 3).map((step, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
              >
                <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {systemsCovered}/5
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Systems Covered</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {mealsLogged}/4
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Meals Logged</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {score.foodVariety.totalUniqueFoods}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Unique Foods</p>
        </div>
      </div>

      {/* System Balance Indicator */}
      {score.insights.systemBalance !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">System Balance:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {score.insights.systemBalance}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${score.insights.systemBalance}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {score.insights.systemBalance >= 80
              ? 'Excellently balanced across all systems!'
              : score.insights.systemBalance >= 60
              ? 'Good balance, room for improvement'
              : 'Focus on evening out your defense system coverage'}
          </p>
        </div>
      )}
    </div>
  );
}
