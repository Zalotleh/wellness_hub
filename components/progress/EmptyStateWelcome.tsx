'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  ChefHat, 
  Target, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function EmptyStateWelcome() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Welcome Card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden mb-8">
        <div className="p-8 md:p-12 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Welcome to Your Wellness Journey!
            </h2>
          </div>
          <p className="text-lg md:text-xl text-white/90 mb-6">
            You're about to start tracking your health with the revolutionary 5x5x5 system. 
            Let's get you started in just a few simple steps!
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold">5</div>
              <div className="text-sm text-white/80">Defense Systems</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5</div>
              <div className="text-sm text-white/80">Meal Times</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5</div>
              <div className="text-sm text-white/80">Foods Each</div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-500" />
          Get Started in 3 Easy Steps
        </h3>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4 items-start group hover:bg-purple-50 dark:hover:bg-purple-900/20 p-4 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
              1
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate Your First Recipe
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Let our AI create a personalized recipe tailored to your nutritional needs and health goals. 
                Choose your preferred defense system and dietary preferences to get started!
              </p>
              <Link
                href="/recipes/ai-generate"
                className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <ChefHat className="w-4 h-4" />
                Start Cooking
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start group hover:bg-green-50 dark:hover:bg-green-900/20 p-4 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-lg">
              2
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                See Your 5x5x5 Score
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Watch your daily score appear as you log meals. Track progress across 5 defense systems 
                and see which areas need attention.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start group hover:bg-blue-50 dark:hover:bg-blue-900/20 p-4 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
              3
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Get Personalized Recommendations
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Our AI will suggest recipes and meal plans tailored to fill your nutritional gaps 
                and strengthen weak defense systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Generate Recipe */}
        <Link 
          href="/recipes/ai-generate"
          className="group bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl shadow-lg p-6 text-white transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3 mb-3">
            <ChefHat className="w-8 h-8" />
            <h4 className="text-xl font-bold">Generate a Recipe</h4>
          </div>
          <p className="text-white/90 mb-4">
            Let AI create a personalized recipe based on your nutritional needs and preferences.
          </p>
          <div className="flex items-center gap-2 font-medium group-hover:gap-3 transition-all">
            Start Cooking <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Browse Recipes */}
        <Link 
          href="/recipes"
          className="group bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl shadow-lg p-6 text-white transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8" />
            <h4 className="text-xl font-bold">Explore Recipes</h4>
          </div>
          <p className="text-white/90 mb-4">
            Browse our collection of health-focused recipes designed around the 5x5x5 system.
          </p>
          <div className="flex items-center gap-2 font-medium group-hover:gap-3 transition-all">
            View Recipes <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex gap-3">
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What is the 5x5x5 System?
            </h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
              The 5x5x5 system is based on Dr. William Li's research on eating to beat disease. 
              Track <strong>5 defense systems</strong> (Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity), 
              across <strong>5 meal times</strong> (Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner), 
              aiming for <strong>5 foods</strong> per system daily for optimal health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
