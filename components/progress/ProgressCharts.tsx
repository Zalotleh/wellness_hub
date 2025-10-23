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
} from 'recharts';
import { DefenseSystem } from '@prisma/client';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

interface ProgressChartsProps {
  weeklyData: {
    dailyStats: Array<{
      date: string;
      systems: any;
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
  const weeklyTrendData = weeklyData.dailyStats.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', {
      weekday: 'short',
    }),
    completion: day.totalCompletion,
    foods: day.totalFoods,
  }));

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
      data[systemInfo.displayName] = sysData.count;
    });

    return data;
  });

  const systemColors = {
    Angiogenesis: '#ef4444',
    Regeneration: '#22c55e',
    Microbiome: '#a855f7',
    'DNA Protection': '#3b82f6',
    Immunity: '#eab308',
  };

  return (
    <div className="space-y-6">
      {/* Weekly Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">
            Overall Completion
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {weeklyData.weeklyStats.overallCompletion}%
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">
            Total Foods Logged
          </div>
          <div className="text-3xl font-bold text-green-900">
            {weeklyData.weeklyStats.totalFoodsLogged}
          </div>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">
            Active Days
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {weeklyData.weeklyStats.daysActive}/7
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium mb-1">
            Best System
          </div>
          <div className="text-lg font-bold text-yellow-900">
            {DEFENSE_SYSTEMS[weeklyData.weeklyStats.bestSystem as DefenseSystem]
              ?.icon || ''}{' '}
            {
              DEFENSE_SYSTEMS[weeklyData.weeklyStats.bestSystem as DefenseSystem]
                ?.displayName
            }
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Weekly Progress Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completion"
              stroke="#22c55e"
              strokeWidth={3}
              name="Completion %"
              dot={{ fill: '#22c55e', r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="foods"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Foods"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* System Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            System Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="system"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '12px' }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" name="Completion %" radius={[8, 8, 0, 0]}>
                {systemComparisonData.map((entry, index) => (
                  <rect
                    key={`cell-${index}`}
                    fill={Object.values(systemColors)[index]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            5x5x5 Balance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="system"
                style={{ fontSize: '12px' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Completion %"
                dataKey="value"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Daily System Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dailyBreakdownData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
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
      </div>

      {/* System Averages Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Weekly System Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Defense System</th>
                <th className="text-center py-3 px-4">Avg Foods/Day</th>
                <th className="text-center py-3 px-4">Completion</th>
                <th className="text-center py-3 px-4">Days Logged</th>
                <th className="text-center py-3 px-4">Status</th>
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
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{system.icon}</span>
                          <span className="font-medium">{system.system}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {system.average.toFixed(1)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${system.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {system.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {avgData.daysLogged}/7
                      </td>
                      <td className="text-center py-3 px-4">
                        {system.percentage >= 80 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Excellent
                          </span>
                        ) : system.percentage >= 60 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Good
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
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