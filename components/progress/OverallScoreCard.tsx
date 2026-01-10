'use client';

import { useEffect, useState } from 'react';
import { Info, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { format } from 'date-fns';
import 'react-circular-progressbar/dist/styles.css';
import type { Score5x5x5 } from '@/lib/tracking/types';
import { Button } from '@/components/ui/button';
import { useBreakpoint, getOptimalChartSize, getFontSize, getSpacing } from '@/lib/utils/mobile-responsive';

interface OverallScoreCardProps {
  date: Date;
  onRefresh?: () => void;
  className?: string;
}

export default function OverallScoreCard({ date, onRefresh, className }: OverallScoreCardProps) {
  const [score, setScore] = useState<Score5x5x5 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const isHorizontal = className?.includes('horizontal');

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
        throw new Error(`Failed to fetch score: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setScore(data.score);
    } catch (err) {
      console.error('Error fetching score:', err);
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    fetchScore();
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

  const breakpoint = useBreakpoint();
  const chartSize = getOptimalChartSize(breakpoint);
  const spacing = getSpacing(breakpoint);
  const fontSize = getFontSize(breakpoint);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${spacing.card}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="flex justify-center mb-8">
            <div className={`bg-gray-200 dark:bg-gray-700 rounded-full`} style={{ width: chartSize, height: chartSize }}></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${spacing.card} border-2 border-red-200`}>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`${fontSize.heading} font-semibold text-gray-900 dark:text-white mb-2`}>
            {error ? 'Error Loading Score' : 'No Data Available'}
          </h3>
          <p className={`${fontSize.body} text-gray-600 dark:text-gray-400 mb-6`}>
            {error || 'Start logging your food intake to see your score!'}
          </p>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="outline"
            className="mx-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  const systemsCovered = score.defenseSystems.filter(s => s.foodsConsumed > 0).length;
  const mealsLogged = score.mealTimes.filter(m => m.hasFood).length;

  // Horizontal layout for placement under tabs
  if (isHorizontal) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-8">
          {/* Score Circle - Smaller for horizontal layout */}
          <div className="flex-shrink-0">
            <div style={{ width: 120, height: 120 }}>
              <CircularProgressbar
                value={score.overallScore}
                text={`${score.overallScore}`}
                styles={buildStyles({
                  textSize: '28px',
                  pathColor: getScoreColor(score.overallScore),
                  textColor: getScoreColor(score.overallScore),
                  trailColor: '#e5e7eb',
                  pathTransitionDuration: 0.5,
                })}
              />
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Your 5x5x5 Score
            </h2>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: getScoreColor(score.overallScore) }}
            >
              {getScoreLabel(score.overallScore)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {score.insights.recommendation}
            </p>
          </div>

          {/* Quick Stats - Horizontal */}
          <div className="flex gap-6 pr-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemsCovered}/5
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Systems
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mealsLogged}/4
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Meals
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {score.foodVariety.totalUniqueFoods}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Foods
              </p>
            </div>
          </div>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle information"
          >
            <Info className={`w-5 h-5 ${showInfo ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}`} />
          </button>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
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
      </div>
    );
  }

  // Original vertical layout
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${spacing.card}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`${fontSize.heading} font-bold text-gray-900 dark:text-white`}>
            Your 5x5x5 Score
          </h2>
          <p className={`${fontSize.body} text-gray-500 dark:text-gray-400`}>
            {format(date, breakpoint.mobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
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
        <div style={{ width: chartSize, height: chartSize }}>
          <CircularProgressbar
            value={score.overallScore}
            text={`${score.overallScore}`}
            styles={buildStyles({
              textSize: breakpoint.mobile ? '28px' : '24px',
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
          className={`${fontSize.subheading} font-bold mb-1`}
          style={{ color: getScoreColor(score.overallScore) }}
        >
          {getScoreLabel(score.overallScore)}
        </p>
        <p className={`${fontSize.body} text-gray-600 dark:text-gray-400`}>
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
          <p className={`${fontSize.subheading} font-bold text-gray-900 dark:text-white`}>
            {systemsCovered}/5
          </p>
          <p className={`${fontSize.small} text-gray-500 dark:text-gray-400`}>
            Systems {breakpoint.mobile ? '' : 'Covered'}
          </p>
        </div>
        <div className="text-center">
          <p className={`${fontSize.subheading} font-bold text-gray-900 dark:text-white`}>
            {mealsLogged}/4
          </p>
          <p className={`${fontSize.small} text-gray-500 dark:text-gray-400`}>
            Meals {breakpoint.mobile ? '' : 'Logged'}
          </p>
        </div>
        <div className="text-center">
          <p className={`${fontSize.subheading} font-bold text-gray-900 dark:text-white`}>
            {score.foodVariety.totalUniqueFoods}
          </p>
          <p className={`${fontSize.small} text-gray-500 dark:text-gray-400`}>
            {breakpoint.mobile ? 'Foods' : 'Unique Foods'}
          </p>
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
