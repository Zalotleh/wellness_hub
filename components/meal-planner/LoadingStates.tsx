'use client';

import React from 'react';
import { Loader2, Sparkles, ChefHat, Clock, Utensils } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  height?: string;
}

export function LoadingSkeleton({ className = '', rows = 3, height = 'h-4' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${height} ${
            i === rows - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

interface MealCardSkeletonProps {
  className?: string;
  showCompact?: boolean;
}

export function MealCardSkeleton({ className = '', showCompact = false }: MealCardSkeletonProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Meal icon skeleton */}
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          
          {!showCompact && (
            <>
              {/* Defense systems skeleton */}
              <div className="flex gap-2 mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ))}
              </div>
              
              {/* Metadata skeleton */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Actions skeleton */}
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}

interface DayViewSkeletonProps {
  className?: string;
}

export function DayViewSkeleton({ className = '' }: DayViewSkeletonProps) {
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Day header skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
      
      {/* Meal slots skeleton */}
      {mealSlots.map((slot) => (
        <div key={slot} className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
          </div>
          <MealCardSkeleton />
        </div>
      ))}
    </div>
  );
}

interface WeekViewSkeletonProps {
  className?: string;
}

export function WeekViewSkeleton({ className = '' }: WeekViewSkeletonProps) {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mealSlots = 4;
  
  return (
    <div className={`flex gap-4 min-w-max ${className}`}>
      {daysOfWeek.map((day) => (
        <div key={day} className="flex-1 min-w-80 space-y-4">
          {/* Day header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
          
          {/* Meal slots skeleton */}
          <div className="space-y-4">
            {Array.from({ length: mealSlots }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                </div>
                <MealCardSkeleton showCompact />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface GeneratingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  className?: string;
}

export function GeneratingOverlay({ 
  isVisible, 
  message = 'Generating your meal plan...', 
  progress,
  className = '' 
}: GeneratingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center border dark:border-gray-700 shadow-2xl">
        {/* Animated icon */}
        <div className="mb-6">
          <div className="relative">
            <ChefHat className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" />
            <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Creating Your Meal Plan
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        
        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Loading spinner */}
        <div className="flex items-center justify-center gap-3 text-green-600 dark:text-green-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Please wait...</span>
        </div>
        
        {/* Tips */}
        <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300">
            💡 Tip: This usually takes 30-60 seconds while our AI crafts personalized recipes for you.
          </p>
        </div>
      </div>
    </div>
  );
}

interface OptimisticUpdateProps {
  isVisible: boolean;
  action: string;
  className?: string;
}

export function OptimisticUpdate({ isVisible, action, className = '' }: OptimisticUpdateProps) {
  if (!isVisible) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-40 ${className}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-48">
        <Loader2 className="w-4 h-4 text-green-600 dark:text-green-400 animate-spin flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-200">{action}...</span>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-red-500 dark:text-red-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 dark:text-gray-500 mb-4">
        {icon || <Utensils className="w-16 h-16 mx-auto" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'gray';
  className?: string;
}

export function PulseLoader({ size = 'md', color = 'green', className = '' }: PulseLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    gray: 'text-gray-600 dark:text-gray-400',
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
    </div>
  );
}