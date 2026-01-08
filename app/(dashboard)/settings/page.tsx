// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { 
  User, Bell, Lock, CreditCard, Globe, Moon, Sun, 
  Mail, Save, Check, AlertCircle, Shield, Trash2 
} from 'lucide-react';
import CountrySelector from '@/components/settings/CountrySelector';
import TimezoneSelector from '@/components/settings/TimezoneSelector';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
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
      // Fetch complete profile from API (includes bio and theme)
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const [profileResponse, measurementResponse, themeResponse, preferencesResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/measurement-preference'),
        fetch('/api/user/theme'),
        fetch('/api/user/preferences'),
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

      if (themeResponse.ok) {
        const data = await themeResponse.json();
        const savedTheme = data.theme || 'system';
        setTheme(savedTheme);
      }

      if (preferencesResponse.ok) {
        const data = await preferencesResponse.json();
        if (data.preferences) {
          setPreferences(prev => ({
            ...prev,
            country: data.preferences.country,
            timezone: data.preferences.timezone || prev.timezone,
          }));
        }
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
    language: 'en',
    measurementSystem: 'imperial',
    timezone: 'America/New_York',
    country: null as string | null,
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

      // Save country and timezone preferences
      const preferencesResponse = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: preferences.country,
          timezone: preferences.timezone,
        }),
      });

      if (!preferencesResponse.ok) {
        throw new Error('Failed to save user preferences');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-200">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal_information' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personal Information</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">
                      Update your personal information and how others see you
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-200 mb-6">
                      Choose how you want to be notified about updates and activity
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Recipe Updates</p>
                        <p className="text-sm text-gray-600 dark:text-gray-200">Get notified about new recipes matching your preferences</p>
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

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Progress Reminders</p>
                        <p className="text-sm text-gray-600 dark:text-gray-200">Daily reminders to log your food progress</p>
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

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Meal Plan Notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-200">Updates about your meal plans and shopping lists</p>
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

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Weekly Digest</p>
                        <p className="text-sm text-gray-600 dark:text-gray-200">Weekly summary of your health journey</p>
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">App Preferences</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-200 mb-6">
                      Customize your app experience
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Measurement System
                      </label>
                      <select
                        value={preferences.measurementSystem}
                        onChange={(e) => setPreferences({ ...preferences, measurementSystem: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="imperial">Imperial (cups, oz, lb)</option>
                        <option value="metric">Metric (ml, g, kg)</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        Used for recipes, shopping lists, and meal plans
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <CountrySelector
                        value={preferences.country}
                        onChange={(country) => setPreferences({ ...preferences, country })}
                        label="Country/Region"
                        placeholder="Select your country"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        Used to personalize recipes and recommendations
                      </p>
                    </div>

                    <div>
                      <TimezoneSelector
                        value={preferences.timezone}
                        onChange={(timezone) => setPreferences({ ...preferences, timezone })}
                        countryCode={preferences.country}
                        label="Timezone"
                        showDetect={true}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        Used for meal reminders and scheduling
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={async () => {
                            setTheme('light');
                            try {
                              await fetch('/api/user/theme', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ theme: 'light' }),
                              });
                            } catch (error) {
                              console.error('Error saving theme:', error);
                            }
                          }}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            theme === 'light'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Sun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'}`} />
                          <span className={`text-sm font-medium ${theme === 'light' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}`}>Light</span>
                        </button>
                        <button
                          onClick={async () => {
                            setTheme('dark');
                            try {
                              await fetch('/api/user/theme', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ theme: 'dark' }),
                              });
                            } catch (error) {
                              console.error('Error saving theme:', error);
                            }
                          }}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            theme === 'dark'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Moon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'}`} />
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}`}>Dark</span>
                        </button>
                        <button
                          onClick={async () => {
                            setTheme('system');
                            try {
                              await fetch('/api/user/theme', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ theme: 'system' }),
                              });
                            } catch (error) {
                              console.error('Error saving theme:', error);
                            }
                          }}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            theme === 'system'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Globe className={`w-6 h-6 mb-2 ${theme === 'system' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'}`} />
                          <span className={`text-sm font-medium ${theme === 'system' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}`}>Auto</span>
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Security Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-200 mb-6">
                      Manage your account security
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-300">Account Security</p>
                          <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                            Your account is secured with {session?.user?.email ? 'email authentication' : 'social login'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                          <p className="text-sm text-gray-600 dark:text-gray-200">Update your account password</p>
                        </div>
                      </div>
                      <span className="text-purple-600 dark:text-purple-300 font-medium">Update</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Email Verification</p>
                          <p className="text-sm text-gray-600 dark:text-gray-200">Verify your email address</p>
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-300 font-medium">Verified</span>
                    </button>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button className="flex items-center space-x-2 text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-400 font-medium">
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Account</span>
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-200 mt-2">
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Subscription & Billing</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-200 mb-6">
                      Manage your subscription plan and billing information
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-2 border-purple-200 dark:border-purple-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          FREE Plan
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-200">Active since December 2025</p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-200">Meal Plans per Month</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-200">Recipe Generations</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-200">AI Questions</span>
                        <span className="font-medium">Unlimited</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all dark:from-purple-700 dark:to-blue-700">
                      Upgrade to Premium
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-600 dark:text-gray-200">
                    <p>Need help with billing? <a href="#" className="text-purple-600 hover:text-purple-700 underline">Contact Support</a></p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
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
