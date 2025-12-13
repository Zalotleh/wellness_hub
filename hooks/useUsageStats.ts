// hooks/useUsageStats.ts
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UsageStats {
  mealPlansThisMonth: number;
  aiQuestionsThisMonth: number;
  recipeGenerationsThisMonth: number;
  pdfExportsThisMonth: number;
  imageGenerationsThisMonth: number;
  lastResetDate: string;
  isLoading: boolean;
  error: string | null;
}

export function useUsageStats() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UsageStats>({
    mealPlansThisMonth: 0,
    aiQuestionsThisMonth: 0,
    recipeGenerationsThisMonth: 0,
    pdfExportsThisMonth: 0,
    imageGenerationsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUsageStats();
    } else if (status === 'unauthenticated') {
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [status, session?.user?.id]);

  const fetchUsageStats = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/user/usage-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      
      const data = await response.json();
      
      setStats({
        mealPlansThisMonth: data.mealPlansThisMonth || 0,
        aiQuestionsThisMonth: data.aiQuestionsThisMonth || 0,
        recipeGenerationsThisMonth: data.recipeGenerationsThisMonth || 0,
        pdfExportsThisMonth: data.pdfExportsThisMonth || 0,
        imageGenerationsThisMonth: data.imageGenerationsThisMonth || 0,
        lastResetDate: data.lastResetDate || new Date().toISOString(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      }));
    }
  };

  const refresh = () => {
    if (status === 'authenticated') {
      fetchUsageStats();
    }
  };

  return {
    ...stats,
    refresh,
  };
}
