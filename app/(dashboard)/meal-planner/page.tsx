// app/(dashboard)/meal-planner/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedMealPlanner from '@/components/meal-planner/EnhancedMealPlanner';
import Footer from '@/components/layout/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Calendar, ChefHat, TrendingUp, Sparkles, Shield, Target, Activity } from 'lucide-react';

// Custom error boundary for meal planner
function MealPlannerErrorFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Meal Planner Temporarily Unavailable
        </h2>
        
        <p className="text-gray-600 mb-6">
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
  const { toasts, removeToast, success, error } = useToast();

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
  const handlePlanSave = (plan: any) => {
    success('Meal Plan Saved', 'Your meal plan has been saved successfully!');
    
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                  AI Meal Planner
                </h1>
                <p className="text-gray-600 text-lg">
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
              className="mb-8"
            />
          </ErrorBoundary>

          {/* Enhanced Features Grid */}
          <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Meal Planner Features</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Balanced Defense Systems</h3>
              <p className="text-sm text-gray-600">
                Every meal plan ensures comprehensive coverage of all five defense systems: Angiogenesis, Regeneration, Microbiome, DNA Protection, and Immunity.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI-Powered Optimization</h3>
              <p className="text-sm text-gray-600">
                Advanced algorithms ensure diverse meals with optimal nutrient distribution, cooking methods, and ingredient variety throughout the week.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fully Customizable</h3>
              <p className="text-sm text-gray-600">
                Personalize every aspect: edit meals, adjust portions, set dietary restrictions, generate shopping lists, and share with others.
              </p>
            </div>
          </section>

          {/* Enhanced Tips Section */}
          <section className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6" aria-labelledby="tips-heading">
            <h3 id="tips-heading" className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Pro Meal Planning Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Sunday Prep:</strong> Batch prepare ingredients and proteins for the week ahead
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Smart Shopping:</strong> Export your shopping list and organize by store layout
                  </span>
                </li>
              </ul>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Flexible Swapping:</strong> Feel free to move meals between days as needed
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
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