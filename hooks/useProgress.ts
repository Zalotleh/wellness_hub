import { useState, useEffect, useCallback } from 'react';
import { DefenseSystem } from '@/types';
import { DailyProgress } from '@/types';
import { format } from 'date-fns';

type Progress = {
  id: string;
  userId: string;
  date: Date;
  defenseSystem: DefenseSystem;
  foodsConsumed: string[];
  count: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface ProgressStats {
  dailyStats: Array<{
    date: string;
    systems: any;
    totalFoods: number;
    systemsCompleted: number;
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
  dateRange: {
    start: string;
    end: string;
  };
}

export function useProgress(date?: Date) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dateParam = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/progress?range=today&startDate=${dateParam}&endDate=${dateParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const { data } = await response.json();
      setProgress(data);

      // Calculate daily progress
      const daily = calculateDailyProgress(data);
      setDailyProgress(daily);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const logFood = async (
    defenseSystem: DefenseSystem,
    foods: string[],
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defenseSystem,
          foods,
          date: date || new Date(),
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log food');
      }

      const { data: newProgress } = await response.json();

      // Update progress in state
      setProgress((prev) => {
        const filtered = prev.filter(
          (p) => p.defenseSystem !== defenseSystem
        );
        return [...filtered, newProgress];
      });

      // Recalculate daily progress
      await fetchProgress();

      return newProgress;
    } catch (err) {
      throw err;
    }
  };

  const deleteProgress = async (id: string) => {
    try {
      const response = await fetch(`/api/progress?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete progress');
      }

      // Remove from state
      setProgress((prev) => prev.filter((p) => p.id !== id));
      await fetchProgress();
    } catch (err) {
      throw err;
    }
  };

  return {
    progress,
    dailyProgress,
    loading,
    error,
    logFood,
    deleteProgress,
    refetch: fetchProgress,
  };
}

// Hook for weekly/monthly statistics
export function useProgressStats(range: 'week' | 'month' = 'week') {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/progress/stats?range=${range}`);

      if (!response.ok) {
        throw new Error('Failed to fetch progress statistics');
      }

      const { data } = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Helper function to calculate daily progress
function calculateDailyProgress(progressEntries: Progress[]): DailyProgress {
  const systems: Record<DefenseSystem, {
    foods: string[];
    count: number;
    target: number;
    percentage: number;
  }> = {} as Record<DefenseSystem, any>;
  
  Object.values(DefenseSystem).forEach((system) => {
    const entry = progressEntries.find((p) => p.defenseSystem === system);
    systems[system] = {
      foods: (entry?.foodsConsumed as string[]) || [],
      count: entry?.count || 0,
      target: 5,
      percentage: ((entry?.count || 0) / 5) * 100,
    };
  });

  const totalCompletion =
    Object.values(systems).reduce(
      (sum: number, s: any) => sum + s.percentage,
      0
    ) / 5;

  return {
    date: new Date(),
    systems,
    totalCompletion: Math.round(totalCompletion),
  };
}