// app/(dashboard)/saved-plans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Bookmark, Plus, Filter, Search, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function SavedPlansPage() {
  const { data: session, status } = useSession();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchMealPlans();
    }
  }, [session]);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/meal-planner');
      
      if (!response.ok) {
        throw new Error('Failed to fetch meal plans');
      }

      const data = await response.json();
      console.log('📥 Fetched meal plans data:', data);
      
      // Handle different response structures
      let plans = [];
      if (Array.isArray(data)) {
        plans = data;
      } else if (data.data && Array.isArray(data.data)) {
        plans = data.data;
      } else if (data.mealPlans && Array.isArray(data.mealPlans)) {
        plans = data.mealPlans;
      } else {
        console.warn('Unexpected data structure:', data);
        plans = [];
      }
      
      setMealPlans(plans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      setError('Failed to load meal plans');
      setMealPlans([]); // Ensure it stays as an array even on error
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved plans...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your saved plans.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Saved Meal Plans</h1>
                <p className="text-gray-600">Your collection of favorite meal plans</p>
              </div>
            </div>
            <Link 
              href="/meal-planner"
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search saved plans..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Meal Plans Grid */}
        {error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-red-600 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Error Loading Plans</h2>
              <p className="text-gray-600">{error}</p>
            </div>
            <button 
              onClick={fetchMealPlans}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : !Array.isArray(mealPlans) ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-red-600 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Invalid Data Format</h2>
              <p className="text-gray-600">Expected array, got: {typeof mealPlans}</p>
            </div>
            <button 
              onClick={fetchMealPlans}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Saved Plans Yet</h2>
              <p className="text-gray-600 mb-8">
                Create your first meal plan and it will appear here for easy access.
              </p>
              <Link 
                href="/meal-planner"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Meal Plan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(mealPlans) && mealPlans.map((plan: any) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{plan.description}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{plan.defaultServings} servings</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    plan.visibility === 'PUBLIC' ? 'bg-green-100 text-green-800' :
                    plan.visibility === 'FRIENDS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.visibility}
                  </span>
                  
                  <Link 
                    href={`/meal-planner/${plan.id}`}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    View Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}