// app/(dashboard)/meal-planner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnhancedMealPlanner from '@/components/meal-planner/EnhancedMealPlanner';
import Footer from '@/components/layout/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Calendar, ChefHat, Sparkles, Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface MealPlannerParams {
  targetSystems?: string[];
  dietaryRestrictions?: string[];
  duration?: number;
}

interface SavedPlan {
  id?: string;
  [key: string]: unknown;
}

// Custom error boundary for meal planner
function MealPlannerErrorFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center border dark:border-gray-700">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <ChefHat className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
          Meal Planner Temporarily Unavailable
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-7">
          We&apos;re experiencing issues with the meal planner. Please try refreshing the page or check back in a few minutes.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default function MealPlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, removeToast, success, error } = useToast();
  const [fromRecommendation, setFromRecommendation] = useState(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [initialParams, setInitialParams] = useState<MealPlannerParams | null>(null);

  // Parse URL params from recommendation
  useEffect(() => {
    const from = searchParams.get('from');
    const recId = searchParams.get('recId');
    const targetSystems = searchParams.get('targetSystems');
    const dietaryRestrictions = searchParams.get('dietaryRestrictions');
    const duration = searchParams.get('duration');

    if (from === 'recommendation' && recId) {
      setFromRecommendation(true);
      setRecommendationId(recId);

      const params: MealPlannerParams = {};
      if (targetSystems) {
        try { params.targetSystems = JSON.parse(targetSystems); }
        catch { params.targetSystems = targetSystems.split(','); }
      }
      if (dietaryRestrictions) {
        try { params.dietaryRestrictions = JSON.parse(dietaryRestrictions); }
        catch { params.dietaryRestrictions = dietaryRestrictions.split(','); }
      }
      if (duration) params.duration = parseInt(duration);

      setInitialParams(params);
    }
  }, [searchParams]);

  // Dynamic SEO setup
  useEffect(() => {
    document.title = 'AI Meal Planner | 5x5x5 Wellness Hub';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create personalized weekly meal plans using AI based on Dr. William Li\'s 5x5x5 system. Balance nutrition across five defense systems for optimal health.');
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'meal planner, AI nutrition, 5x5x5 system, defense systems, healthy eating');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'meal planner, AI nutrition, 5x5x5 system, defense systems, healthy eating';
      document.head.appendChild(meta);
    }
  }, []);

  const handlePlanSave = async (plan: SavedPlan) => {
    success('Meal Plan Saved', 'Your meal plan has been saved successfully!');

    if (fromRecommendation && recommendationId) {
      try {
        await fetch(`/api/recommendations/${recommendationId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: { mealPlanId: plan.id, completedAt: new Date().toISOString() },
          }),
        });
      } catch (err) {
        console.error('Failed to track recommendation completion:', err);
      }
    }

    if (plan?.id) {
      router.replace(`/meal-planner/${plan.id}`);
    }
  };

  const handlePlanShare = (_plan: SavedPlan) => {
    success('Meal Plan Shared', 'Your meal plan has been shared successfully!');
  };

  const handleError = (err: Error, errorInfo: unknown) => {
    console.error('Meal Planner Error:', err, errorInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Sticky page header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Meal Planner</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md flex items-center justify-center shadow">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
              AI Meal Planner
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero header */}
        <div className="mb-8 text-center">
          {fromRecommendation ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 mb-4">
              <Target className="w-4 h-4" />
              Smart Recommendation — this plan targets your wellness goals
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-4">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Plan Your Week
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
            Choose your defense systems and dietary needs, then let AI craft a balanced
            weekly meal plan tailored to your health goals.
          </p>
        </div>

        {/* Main Meal Planner with Error Boundary */}
        <ErrorBoundary
          fallback={<MealPlannerErrorFallback />}
          onError={handleError}
        >
          <EnhancedMealPlanner
            onPlanSave={handlePlanSave}
            onPlanShare={handlePlanShare}
            initialParams={initialParams ?? undefined}
            fromRecommendation={fromRecommendation}
            className="mb-8"
          />
        </ErrorBoundary>
      </main>

      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
