'use client';

import { useRouter } from 'next/navigation';
import { X, PenLine, Sparkles } from 'lucide-react';

interface AddMealChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  day: string;
  slot: string;
  week: number;
  weekStart?: string | Date;
}

const DAY_OFFSET: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

const SLOT_LABEL: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
  'morning-snack': 'Morning Snack', 'afternoon-snack': 'Afternoon Snack', 'evening-snack': 'Evening Snack',
};

function computeDate(weekStart: string | Date, week: number, day: string): string {
  const base = new Date(weekStart);
  const offset = (week - 1) * 7 + (DAY_OFFSET[day.toLowerCase()] ?? 0);
  base.setDate(base.getDate() + offset);
  return base.toISOString().split('T')[0];
}

export default function AddMealChoiceDialog({
  isOpen,
  onClose,
  planId,
  day,
  slot,
  week,
  weekStart,
}: AddMealChoiceDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const date = weekStart ? computeDate(weekStart, week, day) : '';
  const slotLabel = SLOT_LABEL[slot] || slot;

  const baseParams = new URLSearchParams({
    from: 'meal-planner',
    planId,
    day,
    slot,
    week: String(week),
    ...(date ? { date } : {}),
  }).toString();

  const handleManual = () => {
    onClose();
    router.push(`/recipes/create?${baseParams}`);
  };

  const handleAI = () => {
    onClose();
    router.push(`/recipes/ai-generate?${baseParams}&preferredMealTime=${slot}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Add a Meal
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How would you like to add a meal for{' '}
            <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{day}</span>
            &apos;s{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{slotLabel}</span>?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Manual creation */}
          <button
            onClick={handleManual}
            className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <PenLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                Create Recipe Manually
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Write your own recipe with ingredients, instructions, and nutrition info
              </div>
            </div>
          </button>

          {/* AI generator */}
          <button
            onClick={handleAI}
            className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                Generate with AI ✨
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Let AI craft a personalized, science-backed recipe targeting your wellness goals
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
