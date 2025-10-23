'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Edit2, Save, X, Loader2, ChefHat, TrendingUp, Heart } from 'lucide-react';

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
    // Mock stats - in production, fetch from API
    setStats({
      recipesCreated: 12,
      recipesFavorited: 28,
      progressDays: 45,
      avgCompletion: 78,
    });
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
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Created a new recipe</p>
                <p className="text-sm text-gray-600">Mediterranean Salmon Bowl • 2 days ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Completed 5x5x5 daily goal</p>
                <p className="text-sm text-gray-600">All systems tracked • 3 days ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Favorited a recipe</p>
                <p className="text-sm text-gray-600">Green Tea Smoothie • 5 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}