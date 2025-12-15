'use client';

import { useState } from 'react';

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  daysWithProgress?: Date[];
}

export function Calendar({
  selected,
  onSelect,
  className = '',
  daysWithProgress = [],
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasProgress = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return daysWithProgress.some(d => isSameDay(d, date));
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return isSameDay(date, selected);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onSelect?.(date);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`
          w-10 h-10 flex items-center justify-center rounded-md text-sm font-normal transition-colors
          ${isSelected(day) ? 'bg-green-500 text-white hover:bg-green-600' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'}
          ${isToday(day) && !isSelected(day) ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : ''}
          ${hasProgress(day) ? 'font-semibold border-b-2 border-green-500 dark:border-green-400' : ''}
        `}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 ${className}`}>
      <div className="mb-4">
        {/* Header with month/year and navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          </button>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>
    </div>
  );
}