'use client';

import { useMemo } from 'react';
import { getTimezonesForCountry, detectUserTimezone } from '@/lib/constants/countries';

interface TimezoneSelectorProps {
  value: string | null;
  onChange: (timezone: string) => void;
  countryCode: string | null;
  label?: string;
  className?: string;
  showDetect?: boolean;
}

export default function TimezoneSelector({
  value,
  onChange,
  countryCode,
  label = 'Timezone',
  className = '',
  showDetect = true,
}: TimezoneSelectorProps) {
  // Get available timezones based on selected country
  const availableTimezones = useMemo(() => {
    if (countryCode) {
      return getTimezonesForCountry(countryCode);
    }
    // If no country selected, return common timezones
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
    ];
  }, [countryCode]);

  // Format timezone for display
  const formatTimezone = (tz: string): string => {
    const parts = tz.split('/');
    if (parts.length === 1) return tz; // UTC
    
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    const region = parts[0];
    
    // Get UTC offset
    try {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      });
      const formatted = formatter.format(date);
      const offset = formatted.split(' ').pop() || '';
      
      return `${city} (${region}) ${offset}`;
    } catch (error) {
      return `${city} (${region})`;
    }
  };

  const handleDetect = () => {
    const detected = detectUserTimezone();
    onChange(detected);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        {showDetect && (
          <button
            type="button"
            onClick={handleDetect}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
          >
            Auto-detect
          </button>
        )}
      </div>

      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
      >
        {!value && (
          <option value="" disabled>
            Select timezone
          </option>
        )}
        {availableTimezones.map((tz) => (
          <option key={tz} value={tz}>
            {formatTimezone(tz)}
          </option>
        ))}
      </select>

      {!countryCode && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          💡 Select a country above to see country-specific timezones
        </p>
      )}
    </div>
  );
}
