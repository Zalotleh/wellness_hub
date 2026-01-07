'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

interface ProgressChartsProps {
  weeklyData: {
    dailyStats: Array<{
      date: string;
      systems: Record<DefenseSystem, {
        foods: string[];
        count: number;
        target: number;
        percentage: number;
      }>;
      totalFoods: number;
      totalCompletion: number;
    }>;
    systemAverages: any;
    weeklyStats: {
      totalFoodsLogged: number;
      overallCompletion: number;
      daysActive: number;
      bestSystem: string;
      worstSystem: string;
    };
  };
}

export default function ProgressCharts({ weeklyData }: ProgressChartsProps) {
  // Prepare data for weekly trend chart
  const weeklyTrendData = weeklyData.dailyStats.map((day) => {
    return {
      date: new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      completion: Math.round(day.totalCompletion || 0),
      foods: day.totalFoods || 0,
    };
  });

  // Prepare data for system comparison
  const systemComparisonData = Object.entries(weeklyData.systemAverages).map(
    ([system, data]: [string, any]) => {
      const systemInfo = DEFENSE_SYSTEMS[system as DefenseSystem];
      return {
        system: systemInfo.displayName,
        percentage: data.percentage,
        average: data.average,
        icon: systemInfo.icon,
      };
    }
  );

  // Prepare data for radar chart
  const radarData = Object.entries(weeklyData.systemAverages).map(
    ([system, data]: [string, any]) => {
      const systemInfo = DEFENSE_SYSTEMS[system as DefenseSystem];
      return {
        system: systemInfo.displayName,
        value: data.percentage,
        fullMark: 100,
      };
    }
  );

  // Prepare daily breakdown data
  const dailyBreakdownData = weeklyData.dailyStats.map((day) => {
    const data: any = {
      date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    };

    Object.entries(day.systems).forEach(([system, sysData]: [string, any]) => {
      const systemInfo = DEFENSE_SYSTEMS[system as DefenseSystem];
      data[systemInfo.displayName] = sysData.count || 0;
    });

    return data;
  });

  const systemColors = {
    Angiogenesis: '#ef4444',      // Red
    Regeneration: '#3b82f6',      // Blue
    Microbiome: '#16a34a',        // Green
    'DNA Protection': '#9333ea',  // Purple
    Immunity: '#eab308',          // Yellow
  };

  return (
    <div className="space-y-6">
      {/* Weekly Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
            Overall Completion
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
            {weeklyData.weeklyStats.overallCompletion}%
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            Total Foods Logged
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-300">
            {weeklyData.weeklyStats.totalFoodsLogged}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
            Active Days
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
            {weeklyData.weeklyStats.daysActive}/7
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">
            Best System
          </div>
          {weeklyData.weeklyStats.totalFoodsLogged > 0 && weeklyData.weeklyStats.bestSystem ? (
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-300">
              {DEFENSE_SYSTEMS[weeklyData.weeklyStats.bestSystem as DefenseSystem]
                ?.icon || ''}{' '}
              {
                DEFENSE_SYSTEMS[weeklyData.weeklyStats.bestSystem as DefenseSystem]
                  ?.displayName
              }
            </div>
          ) : (
            <div className="text-sm text-yellow-700 dark:text-yellow-400 italic">
              Not enough activity yet
            </div>
          )}
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Weekly Progress Trend
        </h3>
        {weeklyTrendData.length === 0 || weeklyTrendData.every(d => d.completion === 0 && d.foods === 0) ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No data to display</p>
              <p className="text-sm">Start logging your daily foods to see your progress trend</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="completion"
                stroke="#22c55e"
                strokeWidth={3}
                name="Completion %"
                dot={{ fill: '#22c55e', r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="foods"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Foods"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* System Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            System Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="system"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '12px' }}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Bar dataKey="percentage" name="Completion %" radius={[8, 8, 0, 0]}>
                {systemComparisonData.map((entry, index) => {
                  const systemName = entry.system as keyof typeof systemColors;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={systemColors[systemName] || '#8884d8'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            5x5x5 Balance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#6b7280" />
              <PolarAngleAxis
                dataKey="system"
                style={{ fontSize: '12px' }}
                stroke="#6b7280"
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Completion %"
                dataKey="value"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Daily System Breakdown
        </h3>
        {dailyBreakdownData.length === 0 || dailyBreakdownData.every(d => 
          Object.keys(systemColors).every(sys => (d[sys] || 0) === 0)
        ) ? (
          <div className="flex items-center justify-center h-[350px] text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No data to display</p>
              <p className="text-sm">Log foods for each defense system to see the daily breakdown</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dailyBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Legend />
              {Object.keys(systemColors).map((system) => (
                <Bar
                  key={system}
                  dataKey={system}
                  stackId="a"
                  fill={systemColors[system as keyof typeof systemColors]}
                  name={system}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* System Averages Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Weekly System Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 dark:text-gray-300">Defense System</th>
                <th className="text-center py-3 px-4 dark:text-gray-300">Avg Foods/Day</th>
                <th className="text-center py-3 px-4 dark:text-gray-300">Completion</th>
                <th className="text-center py-3 px-4 dark:text-gray-300">Days Logged</th>
                <th className="text-center py-3 px-4 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {systemComparisonData
                .sort((a, b) => b.percentage - a.percentage)
                .map((system, index) => {
                  const systemKey = Object.keys(DEFENSE_SYSTEMS).find(
                    (key) =>
                      DEFENSE_SYSTEMS[key as DefenseSystem].displayName ===
                      system.system
                  ) as DefenseSystem;
                  const avgData = weeklyData.systemAverages[systemKey];

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{system.icon}</span>
                          <span className="font-medium dark:text-white">{system.system}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 dark:text-gray-300">
                        {system.average.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 dark:bg-green-600 h-2 rounded-full"
                              style={{ width: `${system.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium dark:text-gray-300">
                            {system.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 dark:text-gray-300">
                        {avgData.daysLogged}/7
                      </td>
                      <td className="text-center py-3 px-4">
                        {system.percentage >= 80 ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                            Excellent
                          </span>
                        ) : system.percentage >= 60 ? (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                            Good
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                            Needs Work
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          💡 Insights & Recommendations
        </h3>
        <div className="space-y-3">
          {weeklyData.weeklyStats.overallCompletion >= 80 ? (
            <div className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-sm text-gray-700">
                <strong>Excellent work!</strong> You're consistently hitting your 5x5x5 goals. Keep it up!
              </p>
            </div>
          ) : weeklyData.weeklyStats.overallCompletion >= 50 ? (
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 font-bold">→</span>
              <p className="text-sm text-gray-700">
                <strong>Good progress!</strong> Try to be more consistent with all five defense systems.
              </p>
            </div>
          ) : (
            <div className="flex items-start space-x-2">
              <span className="text-red-600 font-bold">!</span>
              <p className="text-sm text-gray-700">
                <strong>Let's improve!</strong> Focus on logging foods daily to build the habit.
              </p>
            </div>
          )}

          {weeklyData.weeklyStats.daysActive < 5 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">→</span>
              <p className="text-sm text-gray-700">
                Try to log foods at least 5 days per week for best results.
              </p>
            </div>
          )}

          {systemComparisonData.some((s) => s.percentage < 40) && (
            <div className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">→</span>
              <p className="text-sm text-gray-700">
                Focus on{' '}
                {systemComparisonData
                  .filter((s) => s.percentage < 40)
                  .map((s) => s.system)
                  .join(', ')}{' '}
                - these systems need more attention.
              </p>
            </div>
          )}

          {weeklyData.weeklyStats.bestSystem && (
            <div className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">★</span>
              <p className="text-sm text-gray-700">
                You're doing great with{' '}
                {DEFENSE_SYSTEMS[weeklyData.weeklyStats.bestSystem as DefenseSystem]?.displayName}! 
                Use the same approach for other systems.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}