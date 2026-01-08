'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function ScoreCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RadarChartSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-56 w-56 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MealTrackerSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SmartActionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendationsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Smart Actions */}
      <SmartActionsSkeleton />

      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreCardSkeleton />
        <RadarChartSkeleton />
      </div>

      {/* Meal Tracker */}
      <MealTrackerSkeleton />

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <RecommendationsSkeleton />
      </div>
    </div>
  );
}

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-12" />
          ))}
        </div>
      ))}
    </div>
  );
}
