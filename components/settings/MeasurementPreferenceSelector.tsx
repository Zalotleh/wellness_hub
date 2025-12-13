'use client';

import React from 'react';
import { 
  getMeasurementPreference, 
  setMeasurementPreference,
  MeasurementPreference 
} from '@/lib/shopping/measurement-system';

interface MeasurementPreferenceSelectorProps {
  onChange?: (system: MeasurementPreference['system']) => void;
  showLabel?: boolean;
  className?: string;
}

export default function MeasurementPreferenceSelector({ 
  onChange,
  showLabel = true,
  className = ''
}: MeasurementPreferenceSelectorProps) {
  const [preference, setPreference] = React.useState<MeasurementPreference>(() => 
    getMeasurementPreference()
  );

  const handleChange = (system: 'imperial' | 'metric') => {
    const newPref: MeasurementPreference = { 
      system,
      temperature: system === 'imperial' ? 'fahrenheit' : 'celsius'
    };
    setMeasurementPreference(newPref);
    setPreference(newPref);
    onChange?.(system);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Measurement System:
        </label>
      )}
      
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => handleChange('imperial')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${preference.system === 'imperial'
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
        >
          <span className="mr-2">🇺🇸</span>
          Imperial
        </button>
        
        <button
          onClick={() => handleChange('metric')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${preference.system === 'metric'
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
        >
          <span className="mr-2">🌍</span>
          Metric
        </button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {preference.system === 'imperial' ? (
          <span>cups, oz, lbs, °F</span>
        ) : (
          <span>ml, g, kg, °C</span>
        )}
      </div>
    </div>
  );
}

// Compact version for headers/toolbars
export function MeasurementToggle({ onChange }: Pick<MeasurementPreferenceSelectorProps, 'onChange'>) {
  const [preference, setPreference] = React.useState<MeasurementPreference>(() => 
    getMeasurementPreference()
  );

  const handleToggle = () => {
    const newSystem = preference.system === 'imperial' ? 'metric' : 'imperial';
    const newPref: MeasurementPreference = { 
      system: newSystem,
      temperature: newSystem === 'imperial' ? 'fahrenheit' : 'celsius'
    };
    setMeasurementPreference(newPref);
    setPreference(newPref);
    onChange?.(newSystem);
  };

  return (
    <button
      onClick={handleToggle}
      className="
        flex items-center gap-2 px-3 py-1.5 
        bg-gray-100 dark:bg-gray-800 
        hover:bg-gray-200 dark:hover:bg-gray-700
        rounded-lg transition-colors
        text-sm font-medium
      "
      title={`Switch to ${preference.system === 'imperial' ? 'Metric' : 'Imperial'}`}
    >
      <span>{preference.system === 'imperial' ? '🇺🇸' : '🌍'}</span>
      <span className="text-gray-700 dark:text-gray-300">
        {preference.system === 'imperial' ? 'Imperial' : 'Metric'}
      </span>
    </button>
  );
}
