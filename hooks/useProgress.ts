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

      let targetDate = date || new Date();
      // Normalize to local date at noon
      targetDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        12
      );
      console.log('Fetching progress for date:', targetDate);
      const dateParam = format(targetDate, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/progress?startDate=${dateParam}&endDate=${dateParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const { data } = await response.json();
      setProgress(data);

      // Calculate daily progress
      const daily = calculateDailyProgress(data, date || new Date());
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
      const targetDate = date || new Date();
      // Ensure we're using the date in local timezone
      const localDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        12 // Set to noon to avoid any timezone issues
      );
      console.log('Logging food for date:', localDate);
      
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defenseSystem,
          foods,
          date: localDate.toISOString(),
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
function calculateDailyProgress(progressEntries: Progress[], selectedDate: Date = new Date()): DailyProgress {
  // Normalize the selected date to noon in local time
  const normalizedSelectedDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    12
  );
  
  console.log('Calculating progress for date:', normalizedSelectedDate);
  console.log('Available entries:', progressEntries.map(entry => ({
    date: entry.date,
    formattedDate: format(new Date(entry.date), 'yyyy-MM-dd'),
    system: entry.defenseSystem,
    foods: entry.foodsConsumed
  })));

  // Filter entries for the selected date
  const dayEntries = progressEntries.filter((entry) => {
    // Normalize the entry date to local time
    const entryDate = new Date(entry.date);
    const normalizedEntryDate = format(new Date(
      entryDate.getFullYear(),
      entryDate.getMonth(),
      entryDate.getDate(),
      12
    ), 'yyyy-MM-dd');
    
    const targetDate = format(normalizedSelectedDate, 'yyyy-MM-dd');
    console.log('Comparing dates:', { normalizedEntryDate, targetDate });
    return normalizedEntryDate === targetDate;
  });

  const systems: Record<DefenseSystem, {
    foods: string[];
    count: number;
    target: number;
    percentage: number;
  }> = {} as Record<DefenseSystem, any>;
  
  Object.values(DefenseSystem).forEach((system) => {
    const entry = dayEntries.find((p) => p.defenseSystem === system);
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
    date: selectedDate,
    systems,
    totalCompletion: Math.round(totalCompletion),
  };
}