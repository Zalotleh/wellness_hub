'use client';

import { useState } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

export type ViewType = 'daily' | 'weekly' | 'monthly';

interface TimeFilterProps {
  view: ViewType;
  date: Date;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
}

export default function TimeFilter({
  view,
  date,
  onViewChange,
  onDateChange,
}: TimeFilterProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Navigation handlers
  const handlePrevious = () => {
    if (view === 'daily') {
      onDateChange(subDays(date, 1));
    } else if (view === 'weekly') {
      onDateChange(subWeeks(date, 1));
    } else if (view === 'monthly') {
      onDateChange(subMonths(date, 1));
    }
  };

  const handleNext = () => {
    if (view === 'daily') {
      onDateChange(addDays(date, 1));
    } else if (view === 'weekly') {
      onDateChange(addWeeks(date, 1));
    } else if (view === 'monthly') {
      onDateChange(addMonths(date, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Quick presets
  const handleYesterday = () => {
    onDateChange(subDays(new Date(), 1));
  };

  const handleThisWeek = () => {
    onViewChange('weekly');
    onDateChange(new Date());
  };

  const handleLastWeek = () => {
    onViewChange('weekly');
    onDateChange(subWeeks(new Date(), 1));
  };

  const handleThisMonth = () => {
    onViewChange('monthly');
    onDateChange(new Date());
  };

  const handleLastMonth = () => {
    onViewChange('monthly');
    onDateChange(subMonths(new Date(), 1));
  };

  // Format display text based on view
  const getDateRangeText = () => {
    if (view === 'daily') {
      const today = format(new Date(), 'yyyy-MM-dd');
      const selected = format(date, 'yyyy-MM-dd');
      
      if (today === selected) {
        return 'Today';
      } else if (format(subDays(new Date(), 1), 'yyyy-MM-dd') === selected) {
        return 'Yesterday';
      }
      return format(date, 'EEEE, MMMM d, yyyy');
    } else if (view === 'weekly') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else if (view === 'monthly') {
      return format(date, 'MMMM yyyy');
    }
    return '';
  };

  // Check if next button should be disabled (can't go beyond today)
  const isNextDisabled = () => {
    const today = new Date();
    if (view === 'daily') {
      return format(date, 'yyyy-MM-dd') >= format(today, 'yyyy-MM-dd');
    } else if (view === 'weekly') {
      return startOfWeek(date, { weekStartsOn: 1 }) >= startOfWeek(today, { weekStartsOn: 1 });
    } else if (view === 'monthly') {
      return startOfMonth(date) >= startOfMonth(today);
    }
    return false;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      {/* View Selector Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewChange('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'daily'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onViewChange('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onViewChange('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            📅 Quick Select
          </button>
          
          {/* Dropdown Menu */}
          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleToday();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    handleYesterday();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Yesterday
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    handleThisWeek();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    handleLastWeek();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Last Week
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    handleThisMonth();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  This Month
                </button>
                <button
                  onClick={() => {
                    handleLastMonth();
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Last Month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Previous"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {getDateRangeText()}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={isNextDisabled()}
          className={`p-2 rounded-lg transition-colors ${
            isNextDisabled()
              ? 'opacity-40 cursor-not-allowed text-gray-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          aria-label="Next"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
