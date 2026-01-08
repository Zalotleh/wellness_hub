// app/(dashboard)/meal-planner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnhancedMealPlanner from '@/components/meal-planner/EnhancedMealPlanner';
import Footer from '@/components/layout/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Calendar, ChefHat, TrendingUp, Sparkles, Shield, Target, Activity } from 'lucide-react';

// Custom error boundary for meal planner
function MealPlannerErrorFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border dark:border-gray-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Meal Planner Temporarily Unavailable
        </h2>
        
        <p className="text-gray-600 dark:text-gray-200 mb-6">
          We're experiencing issues with the meal planner. Please try refreshing the page or check back in a few minutes.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
  const [initialParams, setInitialParams] = useState<any>(null);

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

      // Build initial params
      const params: any = {};
      if (targetSystems) {
        try {
          params.targetSystems = JSON.parse(targetSystems);
        } catch {
          params.targetSystems = targetSystems.split(',');
        }
      }
      if (dietaryRestrictions) {
        try {
          params.dietaryRestrictions = JSON.parse(dietaryRestrictions);
        } catch {
          params.dietaryRestrictions = dietaryRestrictions.split(',');
        }
      }
      if (duration) params.duration = parseInt(duration);

      setInitialParams(params);
    }
  }, [searchParams]);

  // Dynamic SEO setup for client component
  useEffect(() => {
    // Update document title
    document.title = 'AI Meal Planner | 5x5x5 Wellness Hub';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create personalized weekly meal plans using AI based on Dr. William Li\'s 5x5x5 system. Balance nutrition across five defense systems for optimal health.');
    }
    
    // Update meta keywords
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

  // Handle meal plan save
  const handlePlanSave = async (plan: any) => {
    success('Meal Plan Saved', 'Your meal plan has been saved successfully!');
    
    // If from recommendation, mark as completed
    if (fromRecommendation && recommendationId) {
      try {
        await fetch(`/api/recommendations/${recommendationId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: {
              mealPlanId: plan.id,
              completedAt: new Date().toISOString(),
            },
          }),
        });
      } catch (err) {
        console.error('Failed to track recommendation completion:', err);
      }
    }
    
    // Redirect to the individual meal plan page after creation
    if (plan?.id) {
      // Use replace to avoid flash of create page
      router.replace(`/meal-planner/${plan.id}`);
    }
  };

  // Handle meal plan share
  const handlePlanShare = (plan: any) => {
    success('Meal Plan Shared', 'Your meal plan has been shared successfully!');
  };

  // Handle errors
  const handleError = (error: Error, errorInfo: any) => {
    console.error('Meal Planner Error:', error, errorInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <header className="mb-8">
            {/* Recommendation Indicator */}
            {fromRecommendation && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Smart Recommendation
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This meal plan will help balance multiple defense systems
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                  AI Meal Planner
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Powered by the 5x5x5 Defense System
                </p>
              </div>
            </div>

            {/* Enhanced Info Banner */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-start space-x-4">
                <Sparkles className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold mb-3">Smart Meal Planning Made Simple</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <span className="font-bold text-lg bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">1</span>
                      <div>
                        <p className="font-semibold">Configure Preferences</p>
                        <p className="text-green-100">Set dietary needs and focus on specific defense systems</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-bold text-lg bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">2</span>
                      <div>
                        <p className="font-semibold">AI Generation</p>
                        <p className="text-green-100">Advanced AI creates balanced weekly meal plans</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-bold text-lg bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">3</span>
                      <div>
                        <p className="font-semibold">Customize & Share</p>
                        <p className="text-green-100">Edit meals, generate recipes, and share your plan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Meal Planner with Error Boundary */}
          <ErrorBoundary 
            fallback={<MealPlannerErrorFallback />}
            onError={handleError}
          >
            <EnhancedMealPlanner
              onPlanSave={handlePlanSave}
              onPlanShare={handlePlanShare}
              initialParams={initialParams}
              fromRecommendation={fromRecommendation}
              className="mb-8"
            />
          </ErrorBoundary>

          {/* Enhanced Features Grid */}
          <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Meal Planner Features</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Balanced Defense Systems</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Every meal plan ensures comprehensive coverage of all five defense systems: Angiogenesis, Regeneration, Microbiome, DNA Protection, and Immunity.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI-Powered Optimization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Advanced algorithms ensure diverse meals with optimal nutrient distribution, cooking methods, and ingredient variety throughout the week.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Fully Customizable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Personalize every aspect: edit meals, adjust portions, set dietary restrictions, generate shopping lists, and share with others.
              </p>
            </div>
          </section>

          {/* Enhanced Tips Section */}
          <section className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6" aria-labelledby="tips-heading">
            <h3 id="tips-heading" className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Pro Meal Planning Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span>
                    <strong>Sunday Prep:</strong> Batch prepare ingredients and proteins for the week ahead
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span>
                    <strong>Smart Shopping:</strong> Export your shopping list and organize by store layout
                  </span>
                </li>
              </ul>
              <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span>
                    <strong>Flexible Swapping:</strong> Feel free to move meals between days as needed
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span>
                    <strong>Leftover Strategy:</strong> Plan larger portions for strategic leftover meals
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}