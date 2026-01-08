/**
 * Notification Settings Component
 * 
 * User interface for managing all notification preferences:
 * - Master toggle
 * - Workflow reminders
 * - Progress updates
 * - Meal reminders with learned times
 * - Do Not Disturb mode
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  NotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES,
  MealTime,
  DayOfWeek 
} from '@/lib/notifications/types';
import { notificationService } from '@/lib/notifications/notification-service';

interface TimeOption {
  label: string;
  value: string;
}

// Time options for selectors
const TIME_OPTIONS: TimeOption[] = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  value: `${i.toString().padStart(2, '0')}:00`,
}));

const DAY_OPTIONS: { label: string; value: DayOfWeek }[] = [
  { label: 'Sunday', value: 'SUNDAY' },
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [learnedTimes, setLearnedTimes] = useState<{ breakfast?: string; lunch?: string; dinner?: string }>({});
  const [learningTimes, setLearningTimes] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notification-preferences');
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences || DEFAULT_NOTIFICATION_PREFERENCES);
      setLearnedTimes(data.learnedTimes || {});
    } catch (error) {
      console.error('Error loading preferences:', error);
      showMessage('error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updated: NotificationPreferences) => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updated }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setPreferences(updated);
      showMessage('success', 'Notification settings saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const learnOptimalTimes = async () => {
    try {
      setLearningTimes(true);
      const response = await fetch('/api/user/notification-preferences/learn-times', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to learn optimal times');
      }

      const data = await response.json();
      setLearnedTimes(data.learnedTimes || {});
      showMessage('success', 'Learned optimal meal times from your habits!');
    } catch (error) {
      console.error('Error learning times:', error);
      showMessage('error', 'Failed to learn meal times');
    } finally {
      setLearningTimes(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updatePreference = (path: string[], value: any) => {
    const updated = { ...preferences };
    let current: any = updated;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    savePreferences(updated);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Control how and when you receive notifications. All notifications are optional.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Master Toggle */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enable Notifications</h3>
            <p className="text-sm text-gray-600">Master toggle for all notifications</p>
          </div>
          <button
            onClick={() => updatePreference(['enabled'], !preferences.enabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              preferences.enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
            disabled={saving}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings (disabled if master toggle is off) */}
      <div className={preferences.enabled ? '' : 'opacity-50 pointer-events-none'}>
        {/* Workflow Reminders */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Workflow Reminders</h3>
            <p className="text-sm text-gray-600">Get notified about key actions</p>
          </div>

          <div className="space-y-3">
            <ToggleOption
              label="Recipe to Shopping List"
              description="Prompt to add ingredients when you save a recipe"
              checked={preferences.workflow.recipeToShoppingList}
              onChange={(value) => updatePreference(['workflow', 'recipeToShoppingList'], value)}
              disabled={saving}
            />

            <ToggleOption
              label="Shopping List Reminders"
              description="Remind you to go shopping"
              checked={preferences.workflow.shoppingListReminder}
              onChange={(value) => updatePreference(['workflow', 'shoppingListReminder'], value)}
              disabled={saving}
            />

            <ToggleOption
              label="Meal Logging Reminders"
              description="Gentle reminders to log your meals"
              checked={preferences.workflow.mealLoggingReminder}
              onChange={(value) => updatePreference(['workflow', 'mealLoggingReminder'], value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* Progress Updates */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progress Updates</h3>
            <p className="text-sm text-gray-600">Stay informed about your wellness journey</p>
          </div>

          <div className="space-y-4">
            <div>
              <ToggleOption
                label="Daily Summary"
                description="Your daily wellness score and insights"
                checked={preferences.progress.dailySummary}
                onChange={(value) => updatePreference(['progress', 'dailySummary'], value)}
                disabled={saving}
              />

              {preferences.progress.dailySummary && (
                <div className="ml-6 mt-2">
                  <label className="block text-sm font-medium text-gray-700">Send at</label>
                  <select
                    value={preferences.progress.dailySummaryTime || '20:00'}
                    onChange={(e) => updatePreference(['progress', 'dailySummaryTime'], e.target.value)}
                    className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    disabled={saving}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <ToggleOption
              label="Streak Reminders"
              description="Don't break your logging streak!"
              checked={preferences.progress.streakReminders}
              onChange={(value) => updatePreference(['progress', 'streakReminders'], value)}
              disabled={saving}
            />

            <div>
              <ToggleOption
                label="Weekly Planning"
                description="Time to plan your week"
                checked={preferences.progress.weeklyPlanning}
                onChange={(value) => updatePreference(['progress', 'weeklyPlanning'], value)}
                disabled={saving}
              />

              {preferences.progress.weeklyPlanning && (
                <div className="ml-6 mt-2 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Day</label>
                    <select
                      value={preferences.progress.weeklyPlanningDay || 'SUNDAY'}
                      onChange={(e) => updatePreference(['progress', 'weeklyPlanningDay'], e.target.value)}
                      className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      disabled={saving}
                    >
                      {DAY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <select
                      value={preferences.progress.weeklyPlanningTime || '09:00'}
                      onChange={(e) => updatePreference(['progress', 'weeklyPlanningTime'], e.target.value)}
                      className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      disabled={saving}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meal Reminders */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Meal Reminders</h3>
              <p className="text-sm text-gray-600">Smart reminders based on your habits</p>
            </div>
            <button
              onClick={learnOptimalTimes}
              disabled={learningTimes || saving}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
            >
              {learningTimes ? 'Learning...' : 'Learn Times'}
            </button>
          </div>

          <ToggleOption
            label="Enable Meal Reminders"
            description="Get reminded before your usual meal times"
            checked={preferences.mealReminders.enabled}
            onChange={(value) => updatePreference(['mealReminders', 'enabled'], value)}
            disabled={saving}
          />

          {preferences.mealReminders.enabled && (
            <div className="ml-6 space-y-3 pt-2">
              <MealReminderOption
                label="Breakfast"
                checked={preferences.mealReminders.breakfast}
                learnedTime={learnedTimes.breakfast}
                onChange={(value) => updatePreference(['mealReminders', 'breakfast'], value)}
                disabled={saving}
              />

              <MealReminderOption
                label="Lunch"
                checked={preferences.mealReminders.lunch}
                learnedTime={learnedTimes.lunch}
                onChange={(value) => updatePreference(['mealReminders', 'lunch'], value)}
                disabled={saving}
              />

              <MealReminderOption
                label="Dinner"
                checked={preferences.mealReminders.dinner}
                learnedTime={learnedTimes.dinner}
                onChange={(value) => updatePreference(['mealReminders', 'dinner'], value)}
                disabled={saving}
              />
            </div>
          )}
        </div>

        {/* Do Not Disturb */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Do Not Disturb</h3>
            <p className="text-sm text-gray-600">Set quiet hours</p>
          </div>

          <ToggleOption
            label="Enable Do Not Disturb"
            description="No notifications during specified hours"
            checked={preferences.doNotDisturb.enabled}
            onChange={(value) => updatePreference(['doNotDisturb', 'enabled'], value)}
            disabled={saving}
          />

          {preferences.doNotDisturb.enabled && (
            <div className="ml-6 space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <select
                    value={preferences.doNotDisturb.startTime || '22:00'}
                    onChange={(e) => updatePreference(['doNotDisturb', 'startTime'], e.target.value)}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    disabled={saving}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <select
                    value={preferences.doNotDisturb.endTime || '07:00'}
                    onChange={(e) => updatePreference(['doNotDisturb', 'endTime'], e.target.value)}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    disabled={saving}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rate Limits Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-blue-900">Notification Limits</h4>
              <div className="mt-1 text-sm text-blue-800 space-y-1">
                <p>• Maximum of 3 notifications per day</p>
                <p>• Minimum 2-hour gap between notifications</p>
                <p>• No notifications during Do Not Disturb hours</p>
                <p>• All notifications are optional and can be disabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Option Component
interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleOption({ label, description, checked, onChange, disabled }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-gray-300'
        }`}
        disabled={disabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Meal Reminder Option Component
interface MealReminderOptionProps {
  label: string;
  checked: boolean;
  learnedTime?: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function MealReminderOption({ label, checked, learnedTime, onChange, disabled }: MealReminderOptionProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {learnedTime ? (
          <p className="text-xs text-green-600">Optimal time: {learnedTime} (from your habits)</p>
        ) : (
          <p className="text-xs text-gray-500">No pattern detected yet</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-gray-300'
        }`}
        disabled={disabled || !learnedTime}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
