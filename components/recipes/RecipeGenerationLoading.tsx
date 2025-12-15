'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RecipeGenerationLoadingProps {
  isGenerating: boolean;
  progress?: {
    current: number;
    total: number;
    currentMeal?: string;
  };
  isBatch?: boolean;
  onCancel?: () => void;
  className?: string;
}

export default function RecipeGenerationLoading({
  isGenerating,
  progress,
  isBatch = false,
  onCancel,
  className,
}: RecipeGenerationLoadingProps) {
  if (!isGenerating) return null;

  const progressPercentage = progress 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4',
      className
    )}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            {/* Animated cooking icon */}
            <div className="absolute inset-0 animate-spin">
              <svg
                className="w-16 h-16 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2M7 6h10l1 10H6L7 6zM10 12h4"
                />
              </svg>
            </div>
            {/* Chef hat accent */}
            <div className="absolute top-0 right-0 w-6 h-6">
              <svg
                className="w-6 h-6 text-orange-500 animate-bounce"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.5 2C13.88 2 15 3.12 15 4.5C15 5.88 13.88 7 12.5 7C11.12 7 10 5.88 10 4.5C10 3.12 11.12 2 12.5 2M8.5 7C9.88 7 11 8.12 11 9.5C11 10.88 9.88 12 8.5 12C7.12 12 6 10.88 6 9.5C6 8.12 7.12 7 8.5 7M8.5 2C9.88 2 11 3.12 11 4.5C11 5.88 9.88 7 8.5 7C7.12 7 6 5.88 6 4.5C6 3.12 7.12 2 8.5 2M12.5 7C13.88 7 15 8.12 15 9.5C15 10.88 13.88 12 12.5 12C11.12 12 10 10.88 10 9.5C10 8.12 11.12 7 12.5 7Z" />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isBatch ? 'Generating Recipes' : 'Crafting Your Recipe'}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-200">
            {isBatch 
              ? 'Our AI chef is creating personalized recipes for your meal plan...'
              : 'Creating a delicious recipe tailored to your preferences...'
            }
          </p>
        </div>

        {/* Progress Bar (for batch operations) */}
        {isBatch && progress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Recipe {progress.current} of {progress.total}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-300">
                {progressPercentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {progress.currentMeal && (
              <p className="text-xs text-gray-500 dark:text-gray-300 text-center">
                Currently generating: <span className="font-medium">{progress.currentMeal}</span>
              </p>
            )}
          </div>
        )}

        {/* Single recipe loading animation */}
        {!isBatch && (
          <div className="mb-6">
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading steps */}
        <div className="space-y-2 mb-6">
          <LoadingStep 
            text="Analyzing meal requirements" 
            isActive={!progress || progress.current >= 1}
            isComplete={Boolean(progress && progress.current > 1)}
          />
          <LoadingStep 
            text="Selecting defense system foods" 
            isActive={Boolean(progress && progress.current >= 1)}
            isComplete={Boolean(progress && progress.current > 1)}
          />
          <LoadingStep 
            text="Creating detailed instructions" 
            isActive={Boolean(progress && progress.current >= 1)}
            isComplete={false}
          />
          <LoadingStep 
            text="Calculating nutrition information" 
            isActive={Boolean(progress && progress.current >= 1)}
            isComplete={false}
          />
        </div>

        {/* Cancel button */}
        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 transition-colors"
            >
              Cancel Generation
            </button>
          </div>
        )}

        {/* Time estimate */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            {isBatch 
              ? `Estimated time: ${Math.ceil((progress?.total || 1) * 0.5)} minutes`
              : 'This usually takes 20-30 seconds'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

interface LoadingStepProps {
  text: string;
  isActive: boolean;
  isComplete: boolean;
}

function LoadingStep({ text, isActive, isComplete }: LoadingStepProps) {
  return (
    <div className={cn(
      'flex items-center space-x-3 text-sm transition-all duration-300',
      isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-300',
      isComplete && 'text-green-600'
    )}>
      <div className={cn(
        'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300',
        isComplete 
          ? 'bg-green-500 border-green-500' 
          : isActive 
            ? 'border-blue-500' 
            : 'border-gray-300'
      )}>
        {isComplete ? (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : isActive ? (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        ) : null}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  );
}