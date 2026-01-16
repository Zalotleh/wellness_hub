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
  loggedDates?: Set<string>;
}

type PlanOption = 'full-week' | 'remaining-days' | 'custom';

export default function WeeklyMealPlannerModal({
  isOpen,
  onClose,
  weekStart,
  weekEnd,
  onPlanCreated,
  loggedDates,
}: WeeklyMealPlannerModalProps) {
  const [planOption, setPlanOption] = useState<PlanOption>('remaining-days');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'select' | 'configure' | 'generating' | 'success'>('select');
  const [existingPlanWarning, setExistingPlanWarning] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Dietary preferences
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [focusSystems, setFocusSystems] = useState<string[]>([]);
  const [servings, setServings] = useState(2);

  const today = new Date();
  const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Helper to check if a day is already logged
  const isDayLogged = (dayString: string): boolean => {
    return loggedDates ? loggedDates.has(dayString) : false;
  };
  
  const remainingDays = allDays.filter(day => {
    const dayString = format(day, 'yyyy-MM-dd');
    const isNotPast = !isPast(day) || dayString === format(today, 'yyyy-MM-dd');
    const notLogged = !isDayLogged(dayString);
    return isNotPast && notLogged;
  });
  const hasPassedDays = remainingDays.length < 7;
  
  const handlePlanOptionChange = (option: PlanOption) => {
    console.log('🔍 [WeeklyMealPlannerModal] handlePlanOptionChange called with:', option);
    console.log('🔍 [WeeklyMealPlannerModal] allDays:', allDays.map(d => format(d, 'yyyy-MM-dd')));
    console.log('🔍 [WeeklyMealPlannerModal] remainingDays:', remainingDays.map(d => format(d, 'yyyy-MM-dd')));
    
    setPlanOption(option);
    
    if (option === 'full-week') {
      // Only select days that are not logged
      const availableDays = allDays.filter(d => !isDayLogged(format(d, 'yyyy-MM-dd')));
      const selected = new Set(availableDays.map(d => format(d, 'yyyy-MM-dd')));
      console.log('🔍 [WeeklyMealPlannerModal] Setting selectedDays to full week:', Array.from(selected));
      setSelectedDays(selected);
    } else if (option === 'remaining-days') {
      const selected = new Set(remainingDays.map(d => format(d, 'yyyy-MM-dd')));
      console.log('🔍 [WeeklyMealPlannerModal] Setting selectedDays to remaining days:', Array.from(selected));
      setSelectedDays(selected);
    } else {
      console.log('🔍 [WeeklyMealPlannerModal] Clearing selectedDays for custom selection');
      setSelectedDays(new Set());
    }
  };

  const toggleDay = (dayString: string) => {
    console.log('🔍 [WeeklyMealPlannerModal] toggleDay called with:', dayString);
    console.log('🔍 [WeeklyMealPlannerModal] Current selectedDays before toggle:', Array.from(selectedDays));
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayString)) {
      newSelected.delete(dayString);
    } else {
      newSelected.add(dayString);
    }
    console.log('🔍 [WeeklyMealPlannerModal] New selectedDays after toggle:', Array.from(newSelected));
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
    console.log('🔍 [WeeklyMealPlannerModal] handleGeneratePlan called');
    console.log('🔍 [WeeklyMealPlannerModal] selectedDays size:', selectedDays.size);
    console.log('🔍 [WeeklyMealPlannerModal] selectedDays array:', Array.from(selectedDays));
    console.log('🔍 [WeeklyMealPlannerModal] weekStart:', format(weekStart, 'yyyy-MM-dd'));
    console.log('🔍 [WeeklyMealPlannerModal] weekEnd:', format(weekEnd, 'yyyy-MM-dd'));
    
    setGenerating(true);
    setGenerationError(null);
    setGenerationMessage('Checking for existing meal plans...');
    setStep('generating');

    try {
      const requestBody = {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        selectedDays: Array.from(selectedDays),
        dietaryRestrictions,
        focusSystems,
        servings,
      };
      
      console.log('🔍 [WeeklyMealPlannerModal] Request body:', requestBody);
      
      setGenerationMessage('Generating your personalized meal plan with AI...');
      
      const response = await fetch('/api/meal-planner/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate meal plan');
      }

      const result = await response.json();
      
      // Show replacement message if an existing plan was replaced
      if (result.replacedExisting && result.replacedPlan) {
        setGenerationMessage(`✅ Meal plan created! (Replaced existing plan: ${result.replacedPlan.title} with ${result.replacedPlan.totalMeals} meals)`);
      } else {
        setGenerationMessage('✅ Meal plan created successfully! Redirecting...');
      }
      
      console.log('Meal plan created:', result);
      
      setStep('success');
      
      // Don't call onPlanCreated yet - wait until after redirect
      // Don't set generating to false - keep modal in loading state
      
      // Redirect to meal planner to generate recipes
      setTimeout(() => {
        // Call onPlanCreated right before redirect to close modal
        onPlanCreated();
        window.location.href = `/meal-planner/${result.mealPlan.id}`;
      }, 1500);

    } catch (error) {
      console.error('Error generating meal plan:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate meal plan. Please try again.');
      setGenerationMessage('');
      setStep('configure');
      setGenerating(false); // Only set to false on error
    }
    // Remove finally block - don't set generating to false on success
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
                    onClick={() => !hasPassedDays && handlePlanOptionChange('full-week')}
                    disabled={hasPassedDays}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      hasPassedDays
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                        : planOption === 'full-week'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      Full Week
                      {hasPassedDays && <span className="text-xs text-gray-500 font-normal">(Not available)</span>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {hasPassedDays ? 'Week already started' : 'All 7 days'}
                    </div>
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
                    const isLogged = isDayLogged(dayString);
                    const isDisabled = isPastDay || isLogged;

                    return (
                      <button
                        key={dayString}
                        onClick={() => !isDisabled && toggleDay(dayString)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border-2 transition-all relative ${
                          isDisabled
                            ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${
                          isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {format(day, 'EEE')}
                        </div>
                        <div className={`text-lg font-bold ${
                          isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {format(day, 'd')}
                        </div>
                        {isSelected && !isDisabled && (
                          <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                        )}
                        {isLogged && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
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
                {generationMessage || `Creating Your Meal Plan...`}
              </h3>
              {generationError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ {generationError}
                  </p>
                  <button
                    onClick={() => setStep('configure')}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Go Back
                  </button>
                </div>
              )}
              {!generationError && (
                <p className="text-gray-600 dark:text-gray-400">
                  Generating personalized meals for {selectedDays.size} days
                </p>
              )}
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {generationMessage || 'Meal Plan Created!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to meal planner...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
