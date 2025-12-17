'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FileText, 
  Calendar, 
  ShoppingCart, 
  TrendingUp, 
  Activity,
  BarChart3,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  period: number;
  users: {
    total: number;
    active: number;
    new: number;
    byTier: Record<string, number>;
  };
  content: {
    recipes: number;
    mealPlans: number;
    shoppingLists: number;
  };
  apiUsage: {
    aiQuestions: number;
    recipeGenerations: number;
  };
  subscriptions: Record<string, number>;
  recentActivity: {
    recipes: Array<{
      id: string;
      title: string;
      createdAt: string;
      user: { name: string; email: string };
    }>;
    mealPlans: Array<{
      id: string;
      createdAt: string;
      user: { name: string; email: string };
    }>;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    // Check if user is admin
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        router.push('/');
        return;
      }

      fetchAnalytics();
    }
  }, [status, session, router, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      
      // If unauthorized or forbidden, redirect
      if (err.message.includes('Unauthorized') || err.message.includes('Forbidden')) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Platform analytics and monitoring
              </p>
            </div>
            
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* Warning Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ℹ️ <strong>Admin Access:</strong> You can view platform analytics but cannot access individual user profiles or modify user data.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={analytics.users.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={Activity}
            label="Active Users"
            value={analytics.users.active}
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            label="New Users"
            value={analytics.users.new}
            color="bg-purple-500"
          />
          <StatCard
            icon={FileText}
            label="Total Recipes"
            value={analytics.content.recipes}
            color="bg-orange-500"
          />
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Meal Plans"
            value={analytics.content.mealPlans}
            color="bg-pink-500"
          />
          <StatCard
            icon={ShoppingCart}
            label="Shopping Lists"
            value={analytics.content.shoppingLists}
            color="bg-indigo-500"
          />
          <StatCard
            icon={BarChart3}
            label="AI Questions"
            value={analytics.apiUsage.aiQuestions}
            color="bg-cyan-500"
          />
        </div>

        {/* Subscription Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Users by Subscription Tier
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.users.byTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{tier}</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              API Usage
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">AI Questions</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.apiUsage.aiQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Recipe Generations</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.apiUsage.recipeGenerations}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Recipes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Latest Recipes
              </h4>
              <div className="space-y-2">
                {analytics.recentActivity.recipes.map((recipe) => (
                  <div key={recipe.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {recipe.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      by {recipe.user.name || recipe.user.email} • {new Date(recipe.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Meal Plans */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Latest Meal Plans
              </h4>
              <div className="space-y-2">
                {analytics.recentActivity.mealPlans.map((plan) => (
                  <div key={plan.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      Meal Plan #{plan.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      by {plan.user.name || plan.user.email} • {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
