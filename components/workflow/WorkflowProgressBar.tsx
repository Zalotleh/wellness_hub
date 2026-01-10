'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ShoppingCart, TrendingUp, Check, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: 'CREATE' | 'SHOP' | 'TRACK';
  label: string;
  description: string;
  icon: typeof ChefHat;
  actionUrl: string;
  actionLabel: string;
}

interface WorkflowState {
  currentStep: 'CREATE' | 'SHOP' | 'TRACK' | 'COMPLETE';
  nextAction: string;
  progress: number;
  lastRecipeCreated?: Date | string | null;
  lastPlanCreated?: Date | string | null;
  lastShoppingList?: Date | string | null;
  lastFoodLogged?: Date | string | null;
}

interface WorkflowProgressBarProps {
  className?: string;
  onStepClick?: (step: string) => void;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'CREATE',
    label: 'Create',
    description: 'Generate recipe or meal plan',
    icon: ChefHat,
    actionUrl: '/recipes/ai-generate',
    actionLabel: 'Generate Recipe',
  },
  {
    id: 'SHOP',
    label: 'Shop',
    description: 'Add ingredients to shopping list',
    icon: ShoppingCart,
    actionUrl: '/shopping-lists',
    actionLabel: 'View Shopping Lists',
  },
  {
    id: 'TRACK',
    label: 'Track',
    description: 'Log your meals and progress',
    icon: TrendingUp,
    actionUrl: '/progress',
    actionLabel: 'Log Food',
  },
];

export default function WorkflowProgressBar({ className = '', onStepClick }: WorkflowProgressBarProps) {
  const router = useRouter();
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflowState();
  }, []);

  const fetchWorkflowState = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/workflow-state');
      if (!response.ok) {
        throw new Error('Failed to fetch workflow state');
      }

      const data = await response.json();
      setWorkflowState(data.workflowState);
    } catch (err) {
      console.error('Error fetching workflow state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow state');
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    if (onStepClick) {
      onStepClick(step.id);
    } else {
      router.push(step.actionUrl);
    }
  };

  const getStepStatus = (stepId: string): 'completed' | 'current' | 'upcoming' => {
    if (!workflowState) return 'upcoming';

    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === workflowState.currentStep);

    if (workflowState.currentStep === 'COMPLETE') {
      return 'completed';
    }

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700', className)}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !workflowState) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700', className)}>
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-sm">{error || 'Failed to load workflow'}</p>
        </div>
      </div>
    );
  }

  const allStepsComplete = workflowState.currentStep === 'COMPLETE' || workflowState.progress === 100;

  return (
    <div className={cn('bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-green-200 dark:border-gray-600', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Health Journey</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {allStepsComplete 
              ? '🎉 Cycle complete! Start a new one to keep improving.'
              : 'Follow these steps to build healthy habits'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {workflowState.progress}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ width: `${workflowState.progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';
          const isUpcoming = status === 'upcoming';

          return (
            <div key={step.id} className="relative">
              {/* Connector line (desktop) */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 -ml-4">
                  <div 
                    className={cn(
                      'h-full transition-colors',
                      isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                  <ChevronRight 
                    className={cn(
                      'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5',
                      isCompleted ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'
                    )}
                  />
                </div>
              )}

              {/* Step Card */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={isUpcoming}
                className={cn(
                  'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                  isCurrent && 'border-green-500 bg-white dark:bg-gray-700 shadow-lg scale-105',
                  isCompleted && 'border-green-300 bg-green-50 dark:bg-green-900/20',
                  isUpcoming && 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                )}
              >
                {/* Icon and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isCurrent && 'bg-gradient-to-r from-green-500 to-blue-500',
                    isCompleted && 'bg-green-500',
                    isUpcoming && 'bg-gray-300 dark:bg-gray-600'
                  )}>
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={cn('w-6 h-6', (isCurrent || isCompleted) ? 'text-white' : 'text-gray-500')} />
                    )}
                  </div>
                  
                  {isCurrent && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                {/* Step Info */}
                <div>
                  <h4 className={cn(
                    'font-bold mb-1',
                    isCurrent && 'text-gray-900 dark:text-white',
                    isCompleted && 'text-green-700 dark:text-green-400',
                    isUpcoming && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {step.label}
                  </h4>
                  <p className={cn(
                    'text-sm',
                    isCurrent && 'text-gray-600 dark:text-gray-300',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    isUpcoming && 'text-gray-400 dark:text-gray-500'
                  )}>
                    {step.description}
                  </p>

                  {/* Action Button */}
                  {isCurrent && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        {step.actionLabel}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Completed
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* All Complete Message */}
      {allStepsComplete && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-900 dark:text-green-100">Great job!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've completed the full health journey cycle. Keep the momentum going!
              </p>
            </div>
            <button
              onClick={() => router.push('/recipes/ai-generate')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Start New Cycle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
