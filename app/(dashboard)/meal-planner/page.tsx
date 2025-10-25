// app/(dashboard)/meal-planner/page.tsx
'use client';

import MealPlanner from '@/components/meal-planner/MealPlanner';
import { Calendar, ChefHat, TrendingUp, Sparkles } from 'lucide-react';

export default function MealPlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Weekly Meal Planner
              </h1>
              <p className="text-gray-600">
                AI-powered meal planning for the 5x5x5 system
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
            <div className="flex items-start space-x-4">
              <Sparkles className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-lg">1</span>
                    <div>
                      <p className="font-semibold">Customize</p>
                      <p className="text-green-100">Set dietary preferences and focus systems</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-lg">2</span>
                    <div>
                      <p className="font-semibold">Generate</p>
                      <p className="text-green-100">AI creates a balanced weekly plan</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-lg">3</span>
                    <div>
                      <p className="font-semibold">Customize</p>
                      <p className="text-green-100">Edit meals or generate a new plan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <MealPlanner />

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Balanced Nutrition</h3>
            <p className="text-sm text-gray-600">
              Every meal plan ensures coverage of all five defense systems throughout the week
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Variety</h3>
            <p className="text-sm text-gray-600">
              AI ensures diverse meals with different ingredients and cooking methods
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Fully Customizable</h3>
            <p className="text-sm text-gray-600">
              Edit any meal, adjust portions, or regenerate the entire plan anytime
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Meal Planning Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Meal prep on Sundays:</strong> Prepare ingredients for the week ahead
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Shop smart:</strong> Download your plan and use it as a shopping list
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Batch cooking:</strong> Make larger portions for leftovers
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                <strong>Stay flexible:</strong> Feel free to swap meals between days
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}