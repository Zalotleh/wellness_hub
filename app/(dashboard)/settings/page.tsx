// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, Bell, Lock, CreditCard, Globe, Moon, Sun, 
  Mail, Save, Check, AlertCircle, Shield, Trash2 
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState('personal_information');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Personal Information settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
  });

  // Update profile data when session loads
  useEffect(() => {
    if (session?.user) {
      // Fetch complete profile from API (includes bio)
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const [profileResponse, measurementResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/measurement-preference'),
      ]);

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
        });
      }

      if (measurementResponse.ok) {
        const data = await measurementResponse.json();
        setPreferences(prev => ({
          ...prev,
          measurementSystem: data.system || 'imperial',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailRecipes: true,
    emailProgress: true,
    emailMealPlans: false,
    pushNotifications: false,
    weeklyDigest: true,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    measurementSystem: 'imperial',
    timezone: 'America/New_York',
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save profile data (name and bio)
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          bio: profileData.bio,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to save profile');
      }

      // Save measurement system preference
      const measurementResponse = await fetch('/api/user/measurement-preference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: preferences.measurementSystem,
        }),
      });

      if (!measurementResponse.ok) {
        throw new Error('Failed to save measurement preference');
      }

      // Update session with new name
      await update();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal_information', label: 'Personal Information', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-purple-50 text-purple-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal_information' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Update your personal information and how others see you
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell us about yourself and your health goals..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Choose how you want to be notified about updates and activity
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Recipe Updates</p>
                        <p className="text-sm text-gray-600">Get notified about new recipes matching your preferences</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailRecipes}
                          onChange={(e) => setNotifications({ ...notifications, emailRecipes: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Progress Reminders</p>
                        <p className="text-sm text-gray-600">Daily reminders to log your food progress</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailProgress}
                          onChange={(e) => setNotifications({ ...notifications, emailProgress: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Meal Plan Notifications</p>
                        <p className="text-sm text-gray-600">Updates about your meal plans and shopping lists</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailMealPlans}
                          onChange={(e) => setNotifications({ ...notifications, emailMealPlans: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Weekly Digest</p>
                        <p className="text-sm text-gray-600">Weekly summary of your health journey</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.weeklyDigest}
                          onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">App Preferences</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Customize your app experience
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Measurement System
                      </label>
                      <select
                        value={preferences.measurementSystem}
                        onChange={(e) => setPreferences({ ...preferences, measurementSystem: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="imperial">Imperial (cups, oz, lb)</option>
                        <option value="metric">Metric (ml, g, kg)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Used for recipes, shopping lists, and meal plans
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            preferences.theme === 'light'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Sun className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">Light</span>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            preferences.theme === 'dark'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Moon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">Dark</span>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'auto' })}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            preferences.theme === 'auto'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Globe className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">Auto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage your account security
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Account Security</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Your account is secured with {session?.user?.email ? 'email authentication' : 'social login'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-gray-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-600">Update your account password</p>
                        </div>
                      </div>
                      <span className="text-purple-600 font-medium">Update</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Email Verification</p>
                          <p className="text-sm text-gray-600">Verify your email address</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-medium">Verified</span>
                    </button>

                    <div className="pt-6 border-t border-gray-200">
                      <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium">
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Account</span>
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription & Billing</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage your subscription plan and billing information
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          FREE Plan
                        </h3>
                        <p className="text-sm text-gray-600">Active since December 2025</p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Meal Plans per Month</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Recipe Generations</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">AI Questions</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
                      Upgrade to Premium
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    <p>Need help with billing? <a href="#" className="text-purple-600 hover:text-purple-700 underline">Contact Support</a></p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                {saveSuccess && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Changes saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
