'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Edit2, Save, X, Loader2, ChefHat, TrendingUp, Heart } from 'lucide-react';

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [stats, setStats] = useState({
    recipesCreated: 0,
    recipesFavorited: 0,
    progressDays: 0,
    avgCompletion: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'recipe_created' | 'progress_logged' | 'recipe_favorited';
    title: string;
    recipeId?: string;
    timestamp: Date;
  }>>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        bio: '', // Would come from user profile in DB
      });
      fetchUserStats();
    }
  }, [session]);

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await update(); // Refresh session
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || '',
      bio: '',
    });
    setIsEditing(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-green-500 to-blue-500"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="flex items-end space-x-4">
                {/* Avatar */}
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-28 h-28 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="pb-2">
                  {!isEditing ? (
                    <>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {session.user.name}
                      </h1>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{session.user.email}</span>
                      </p>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-3xl font-bold text-gray-900 border-2 border-gray-300 rounded-lg px-3 py-1 focus:border-green-500 focus:outline-none"
                      placeholder="Your name"
                    />
                  )}
                </div>
              </div>

              {/* Edit Button */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio
              </label>
              {!isEditing ? (
                <p className="text-gray-700">
                  {formData.bio || 'No bio yet. Click Edit Profile to add one!'}
                </p>
              ) : (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Tell us about your health journey..."
                />
              )}
            </div>

            {/* Member Since */}
            <div className="mt-4 flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <ChefHat className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Recipes</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.recipesCreated}</p>
            <p className="text-xs text-gray-500">Created</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">Favorites</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.recipesFavorited}</p>
            <p className="text-xs text-gray-500">Saved recipes</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Progress</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.progressDays}</p>
            <p className="text-xs text-gray-500">Days tracked</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">🎯</span>
              <span className="text-sm text-gray-600">Completion</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.avgCompletion}%</p>
            <p className="text-xs text-gray-500">Average</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          {isLoadingStats ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity yet.</p>
              <p className="text-sm mt-2">Start creating recipes and tracking your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const getActivityIcon = () => {
                  switch (activity.type) {
                    case 'recipe_created':
                      return { icon: ChefHat, bg: 'bg-green-100', color: 'text-green-600', label: 'Created a new recipe' };
                    case 'progress_logged':
                      return { icon: TrendingUp, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Logged progress' };
                    case 'recipe_favorited':
                      return { icon: Heart, bg: 'bg-red-100', color: 'text-red-600', label: 'Favorited a recipe' };
                  }
                };

                const activityInfo = getActivityIcon();
                const Icon = activityInfo.icon;
                const timeAgo = getTimeAgo(activity.timestamp);

                return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-12 h-12 ${activityInfo.bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${activityInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activityInfo.label}</p>
                      <p className="text-sm text-gray-600">
                        {activity.title} • {timeAgo}
                      </p>
                    </div>
                    {activity.recipeId && (
                      <a
                        href={`/recipes/${activity.recipeId}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}