'use client';

import React, { useState } from 'react';
import { format, addDays, isFuture, isPast } from 'date-fns';
import { X, Calendar, ChefHat, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface WeeklyMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date;
  weekEnd: Date;
  onPlanCreated: () => void;
}

type PlanOption = 'full-week' | 'remaining-days' | 'custom';

export default function WeeklyMealPlannerModal({
  isOpen,
  onClose,
  weekStart,
  weekEnd,
  onPlanCreated,
}: WeeklyMealPlannerModalProps) {
  const [planOption, setPlanOption] = useState<PlanOption>('remaining-days');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'select' | 'configure' | 'generating' | 'success'>('select');
  
  // Dietary preferences
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [focusSystems, setFocusSystems] = useState<string[]>([]);
  const [servings, setServings] = useState(2);

  const today = new Date();
  const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const remainingDays = allDays.filter(day => !isPast(day) || format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
  
  const handlePlanOptionChange = (option: PlanOption) => {
    setPlanOption(option);
    
    if (option === 'full-week') {
      setSelectedDays(new Set(allDays.map(d => format(d, 'yyyy-MM-dd'))));
    } else if (option === 'remaining-days') {
      setSelectedDays(new Set(remainingDays.map(d => format(d, 'yyyy-MM-dd'))));
    } else {
      setSelectedDays(new Set());
    }
  };

  const toggleDay = (dayString: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayString)) {
      newSelected.delete(dayString);
    } else {
      newSelected.add(dayString);
    }
    setSelectedDays(newSelected);
  };

  const handleContinue = () => {
    if (selectedDays.size === 0) {
      alert('Please select at least one day');
      return;
    }
    setStep('configure');
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setStep('generating');

    try {
      const response = await fetch('/api/meal-planner/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          selectedDays: Array.from(selectedDays),
          dietaryRestrictions,
          focusSystems,
          servings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const result = await response.json();
      console.log('Meal plan created:', result);
      
      setStep('success');
      
      // Notify parent
      onPlanCreated();
      
      // Redirect to meal planner to generate recipes
      setTimeout(() => {
        window.location.href = `/meal-planner/${result.mealPlan.id}`;
      }, 1500);

    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
      setStep('configure');
    } finally {
      setGenerating(false);
    }
  };

  const resetModal = () => {
    setStep('select');
    setPlanOption('remaining-days');
    setSelectedDays(new Set());
    setDietaryRestrictions([]);
    setFocusSystems([]);
    setServings(2);
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      resetModal();
    }
  };

  if (!isOpen) return null;

  const systemOptions = [
    { value: 'ANGIOGENESIS', label: 'Angiogenesis' },
    { value: 'REGENERATION', label: 'Regeneration' },
    { value: 'MICROBIOME', label: 'Microbiome' },
    { value: 'DNA_PROTECTION', label: 'DNA Protection' },
    { value: 'IMMUNITY', label: 'Immunity' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Plan Your Week</h2>
              <p className="text-purple-100 text-sm">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={generating}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Select Days */}
          {step === 'select' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Which days would you like to plan?
                </h3>
                
                {/* Quick Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => handlePlanOptionChange('full-week')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      planOption === 'full-week'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">Full Week</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">All 7 days</div>
                  </button>

                  <button
                    onClick={() => handlePlanOptionChange('remaining-days')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      planOption === 'remaining-days'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">Remaining Days</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {remainingDays.length} days left
                    </div>
                  </button>

                  <button
                    onClick={() => handlePlanOptionChange('custom')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      planOption === 'custom'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">Custom</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pick specific days</div>
                  </button>
                </div>

                {/* Day Selection Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {allDays.map((day) => {
                    const dayString = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDays.has(dayString);
                    const isPastDay = isPast(day) && format(day, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');

                    return (
                      <button
                        key={dayString}
                        onClick={() => toggleDay(dayString)}
                        disabled={isPastDay}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isPastDay
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {format(day, 'd')}
                        </div>
                        {isSelected && !isPastDay && (
                          <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDays.size} day{selectedDays.size !== 1 ? 's' : ''} selected
                </div>
                <button
                  onClick={handleContinue}
                  disabled={selectedDays.size === 0}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Preferences */}
          {step === 'configure' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Customize Your Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Planning meals for {selectedDays.size} day{selectedDays.size !== 1 ? 's' : ''}
                </p>

                {/* Servings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servings per meal
                  </label>
                  <select
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
                </div>

                {/* Focus Systems */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Focus on specific defense systems (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {systemOptions.map(system => (
                      <label key={system.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={focusSystems.includes(system.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFocusSystems([...focusSystems, system.value]);
                            } else {
                              setFocusSystems(focusSystems.filter(s => s !== system.value));
                            }
                          }}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{system.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleGeneratePlan}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Plan
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Creating Your Meal Plan...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generating personalized meals for {selectedDays.size} days
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Meal Plan Created!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to meal planner to generate recipes...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
