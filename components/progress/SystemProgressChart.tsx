'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, TrendingUp, Award } from 'lucide-react';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { getSystemColor } from '@/components/ui/MultiSystemBadge';

interface SystemData {
  system: DefenseSystem;
  current: number;
  target: number;
}

interface DailyProgress5x5x5 {
  systemBreakdown: Array<{
    system: DefenseSystem;
    foodCount: number;
    target: number;
    percentage: number;
    foods: string[];
  }>;
}

interface SystemProgressChartProps {
  date: Date;
  data?: DailyProgress5x5x5;
  className?: string;
}

export default function SystemProgressChart({
  date,
  data: propData,
  className = '',
}: SystemProgressChartProps) {
  const [data, setData] = useState<DailyProgress5x5x5 | null>(propData || null);
  const [loading, setLoading] = useState(!propData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Add timestamp to bust cache and get fresh data
      const response = await fetch(`/api/progress/daily-summary?date=${dateStr}&t=${Date.now()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    // Always fetch data when date changes, ignore propData
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-80">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">{error || 'Failed to load chart data'}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const TARGET = 5; // Target: 5 foods per system
  
  // Map system to abbreviation
  const systemAbbreviations: Record<DefenseSystem, string> = {
    ANGIOGENESIS: 'A',
    REGENERATION: 'R',
    MICROBIOME: 'M',
    DNA_PROTECTION: 'D',
    IMMUNITY: 'I',
  };
  
  const chartData = data.systemBreakdown.map((item) => {
    const systemInfo = DEFENSE_SYSTEMS[item.system];
    return {
      system: systemAbbreviations[item.system],
      fullName: systemInfo.displayName,
      current: item.foodCount,
      target: TARGET,
      percentage: Math.round((item.foodCount / TARGET) * 100),
      color: getSystemColor(item.system),
    };
  });

  // Calculate statistics
  const totalFoods = chartData.reduce((sum, item) => sum + item.current, 0);
  const targetTotal = TARGET * chartData.length; // 5 foods * 5 systems = 25 total
  const missingFoods = targetTotal - totalFoods;
  const systemsComplete = chartData.filter((item) => item.current >= TARGET).length;
  const completionPercentage = Math.round((systemsComplete / chartData.length) * 100);
  const overallCoverage = Math.round((totalFoods / targetTotal) * 100);
  
  // Find best covered system
  const bestSystem = chartData.reduce((best, current) => 
    current.current > best.current ? current : best
  , chartData[0]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Defense Systems Progress</h2>
          <p className="text-sm text-gray-500 mt-1">
            Target: 5 foods per system per day
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh chart"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Best Covered</span>
          </div>
          <div className="text-lg font-bold text-blue-900">{bestSystem.fullName}</div>
          <div className="text-xs text-blue-600 mt-1">{bestSystem.current} of {bestSystem.target} foods</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Complete Systems</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {systemsComplete}<span className="text-lg text-purple-600">/5</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">{completionPercentage}%</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Overall Coverage</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {overallCoverage}%
          </div>
          <div className="text-xs text-green-600 mt-1">{totalFoods} of {targetTotal} foods</div>
        </div>
      </div>

      {/* System Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">System Details</h3>
        {chartData.map((item) => {
          const systemBreakdown = data.systemBreakdown.find(
            (s) => systemAbbreviations[s.system] === item.system
          );
          
          return (
            <div key={item.system} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {item.fullName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.current} / {item.target}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                {systemBreakdown && systemBreakdown.foods && systemBreakdown.foods.length > 0 && (
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {systemBreakdown.foods.slice(0, 3).join(', ')}
                    {systemBreakdown.foods.length > 3 && '...'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Badge */}
      {completionPercentage === 100 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="font-bold text-green-900">All Systems Complete!</div>
              <div className="text-sm text-green-700">
                You've reached 5 foods for all 5 defense systems
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
