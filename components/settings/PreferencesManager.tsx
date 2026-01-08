'use client';

import { useState, useEffect } from 'react';
import { DefenseSystem } from '@/types';
import DietaryRestrictionsSelector from './DietaryRestrictionsSelector';
import DefenseSystemSelector from './DefenseSystemSelector';
import ServingsSelector from './ServingsSelector';
import { Save, Check, AlertCircle } from 'lucide-react';

interface PreferencesManagerProps {
  onSave?: (preferences: UserPreferencesData) => Promise<void>;
  showSaveButton?: boolean;
  className?: string;
}

export interface UserPreferencesData {
  defaultDietaryRestrictions: string[];
  defaultFocusSystems: DefenseSystem[];
  defaultServings: number;
}

export default function PreferencesManager({
  onSave,
  showSaveButton = true,
  className = '',
}: PreferencesManagerProps) {
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    defaultDietaryRestrictions: [],
    defaultFocusSystems: [],
    defaultServings: 2,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            defaultDietaryRestrictions: data.preferences.defaultDietaryRestrictions || [],
            defaultFocusSystems: data.preferences.defaultFocusSystems || [],
            defaultServings: data.preferences.defaultServings || 2,
          });
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (onSave) {
        await onSave(preferences);
      } else {
        // Default save to API
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save preferences');
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Dietary Restrictions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <DietaryRestrictionsSelector
            value={preferences.defaultDietaryRestrictions}
            onChange={(restrictions) =>
              setPreferences({ ...preferences, defaultDietaryRestrictions: restrictions })
            }
          />
        </div>

        {/* Defense Systems */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <DefenseSystemSelector
            value={preferences.defaultFocusSystems}
            onChange={(systems) =>
              setPreferences({ ...preferences, defaultFocusSystems: systems })
            }
          />
        </div>

        {/* Default Servings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <ServingsSelector
            value={preferences.defaultServings}
            onChange={(servings) =>
              setPreferences({ ...preferences, defaultServings: servings })
            }
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {showSaveButton && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                saveSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>

            {saveSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Your preferences have been saved successfully!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
