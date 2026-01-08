'use client';

import { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { format } from 'date-fns';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';
import type { Score5x5x5 } from '@/lib/tracking/types';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface DefenseSystemsRadarProps {
  date: Date;
  onClick?: (system: DefenseSystem) => void;
}

export default function DefenseSystemsRadar({ date, onClick }: DefenseSystemsRadarProps) {
  const [score, setScore] = useState<Score5x5x5 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !score) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Defense System Coverage
        </h3>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: score.defenseSystems.map((s) =>
      DEFENSE_SYSTEMS[s.system].displayName
    ),
    datasets: [
      {
        label: 'Your Coverage',
        data: score.defenseSystems.map((s) => s.score),
        backgroundColor: 'rgba(147, 51, 234, 0.2)', // purple-600 with opacity
        borderColor: 'rgba(147, 51, 234, 1)', // purple-600
        borderWidth: 2,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(147, 51, 234, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Target (100%)',
        data: [100, 100, 100, 100, 100],
        backgroundColor: 'rgba(156, 163, 175, 0.05)', // gray-400 with low opacity
        borderColor: 'rgba(156, 163, 175, 0.3)', // gray-400
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          callback: function(value) {
            return value + '%';
          },
          color: 'rgb(107, 114, 128)', // gray-500
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)', // gray-400 with opacity
        },
        pointLabels: {
          color: 'rgb(31, 41, 55)', // gray-800
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(75, 85, 99)', // gray-600
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)', // gray-800
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const systemIndex = context.dataIndex;
            const systemData = score.defenseSystems[systemIndex];
            
            if (context.datasetIndex === 0) {
              return [
                `Score: ${context.parsed.r}%`,
                `Foods: ${systemData.foodsConsumed}/5`,
                `Coverage: ${systemData.coveragePercent.toFixed(0)}%`,
              ];
            }
            return `Target: ${context.parsed.r}%`;
          },
          afterLabel: function(context) {
            if (context.datasetIndex === 0) {
              const systemIndex = context.dataIndex;
              const systemData = score.defenseSystems[systemIndex];
              if (systemData.uniqueFoods.length > 0) {
                return '\nFoods: ' + systemData.uniqueFoods.slice(0, 3).join(', ') + 
                  (systemData.uniqueFoods.length > 3 ? '...' : '');
              }
            }
            return '';
          },
        },
      },
    },
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const system = score.defenseSystems[index].system;
        setSelectedSystem(system);
        onClick?.(system);
      }
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Defense System Coverage
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click on a point to see details
        </p>
      </div>

      {/* Radar Chart */}
      <div className="mb-6" style={{ maxHeight: '400px' }}>
        <Radar data={chartData} options={chartOptions} />
      </div>

      {/* System Details Panel */}
      {selectedSystem && (
        <div className="mt-6 p-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{DEFENSE_SYSTEMS[selectedSystem].icon}</span>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {DEFENSE_SYSTEMS[selectedSystem].displayName}
                </h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {DEFENSE_SYSTEMS[selectedSystem].description}
              </p>
            </div>
            <button
              onClick={() => setSelectedSystem(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close details"
            >
              ✕
            </button>
          </div>

          {/* Current Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress Today
              </span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {score.defenseSystems.find(s => s.system === selectedSystem)?.foodsConsumed || 0}/5 foods
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${score.defenseSystems.find(s => s.system === selectedSystem)?.coveragePercent || 0}%`
                }}
              />
            </div>
          </div>

          {/* Foods Consumed Today */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foods Today:
            </p>
            <div className="flex flex-wrap gap-2">
              {score.defenseSystems
                .find((s) => s.system === selectedSystem)
                ?.uniqueFoods.map((food) => (
                  <span
                    key={food}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium"
                  >
                    {food}
                  </span>
                ))}
              {score.defenseSystems.find(s => s.system === selectedSystem)?.uniqueFoods.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No foods logged yet for this system
                </span>
              )}
            </div>
          </div>

          {/* Suggested Foods */}
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggested Foods:
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFENSE_SYSTEMS[selectedSystem].keyFoods.slice(0, 8).map((food) => (
                <span
                  key={food}
                  className="px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-purple-200 dark:border-purple-700 rounded text-xs"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {!selectedSystem && (
        <div className="grid grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {score.defenseSystems.map((system) => (
            <button
              key={system.system}
              onClick={() => {
                setSelectedSystem(system.system);
                onClick?.(system.system);
              }}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-2xl mb-1">{DEFENSE_SYSTEMS[system.system].icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center mb-1">
                {DEFENSE_SYSTEMS[system.system].displayName}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {system.foodsConsumed}/5
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
