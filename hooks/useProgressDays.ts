import { useState, useEffect, useCallback } from 'react';

export function useProgressDays() {
  const [daysWithProgress, setDaysWithProgress] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressDays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const response = await fetch(
        `/api/progress?startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress days');
      }

      const { data } = await response.json();

      // Get unique dates with progress
      const uniqueDates = [...new Set(
        (data as Array<{ date: string | Date }>).map(entry => {
          const date = new Date(entry.date);
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        })
      )] as string[];

      setDaysWithProgress(uniqueDates.map(dateStr => new Date(dateStr)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgressDays();
  }, [fetchProgressDays]);

  return {
    daysWithProgress,
    loading,
    error,
    refetch: fetchProgressDays,
  };
}