'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RecipeGenerationErrorProps {
  error: {
    type: 'API_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN';
    message: string;
    retryAfter?: number; // seconds for rate limit
  };
  onRetry: () => void;
  onClose: () => void;
  className?: string;
}

export default function RecipeGenerationError({
  error,
  onRetry,
  onClose,
  className,
}: RecipeGenerationErrorProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'RATE_LIMIT':
        return (
          <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'TIMEOUT':
        return (
          <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'NETWORK':
        return (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'API_KEY':
        return 'Configuration Error';
      case 'RATE_LIMIT':
        return 'Rate Limit Reached';
      case 'TIMEOUT':
        return 'Generation Timed Out';
      case 'PARSE_ERROR':
        return 'Processing Error';
      case 'NETWORK':
        return 'Connection Error';
      default:
        return 'Generation Failed';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'API_KEY':
        return 'There\'s an issue with the AI service configuration. Please contact support.';
      case 'RATE_LIMIT':
        return error.retryAfter 
          ? `You've reached the recipe generation limit. Please try again in ${Math.ceil(error.retryAfter / 60)} minutes.`
          : 'You\'ve reached the recipe generation limit. Please try again later.';
      case 'TIMEOUT':
        return 'Recipe generation took longer than expected. This sometimes happens with complex requests.';
      case 'PARSE_ERROR':
        return 'The AI generated a recipe, but we had trouble processing it. Please try again.';
      case 'NETWORK':
        return 'Unable to connect to the recipe generation service. Please check your internet connection.';
      default:
        return 'An unexpected error occurred while generating your recipe.';
    }
  };

  const canRetry = error.type !== 'API_KEY';

  const formatRetryTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4',
      className
    )}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {getErrorIcon()}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getErrorTitle()}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {getErrorDescription()}
          </p>

          {/* Rate limit specific info */}
          {error.type === 'RATE_LIMIT' && error.retryAfter && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-800">
                  Try again in {formatRetryTime(error.retryAfter)}
                </span>
              </div>
            </div>
          )}

          {/* Detailed error message */}
          {error.message && (
            <details className="text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                Technical details
              </summary>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 break-words">
                {error.message}
              </div>
            </details>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          {canRetry && (
            <button
              onClick={onRetry}
              disabled={error.type === 'RATE_LIMIT' && Boolean(error.retryAfter && error.retryAfter > 60)}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                error.type === 'RATE_LIMIT' && error.retryAfter && error.retryAfter > 60
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              {error.type === 'RATE_LIMIT' && error.retryAfter && error.retryAfter > 60
                ? `Retry in ${formatRetryTime(error.retryAfter)}`
                : 'Try Again'
              }
            </button>
          )}
          
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          {error.type === 'RATE_LIMIT' ? (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Tip:</span> Upgrade to Premium for higher limits and batch generation
            </p>
          ) : error.type === 'TIMEOUT' ? (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Tip:</span> Try being more specific with fewer requirements for faster generation
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Still having issues? <a href="/support" className="text-blue-600 hover:underline">Contact support</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}