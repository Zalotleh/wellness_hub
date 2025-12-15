// components/meal-planner/MealPlanner.tsx
'use client';

import React, { useState } from 'react';
import { Calendar, Clock, ChefHat, Loader2, Download, RefreshCw, Edit2, Trash2, Check, X } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

interface MealPlanData {
  [day: string]: {
    breakfast?: { name: string; systems: DefenseSystem[]; prepTime: string };
    lunch?: { name: string; systems: DefenseSystem[]; prepTime: string };
    dinner?: { name: string; systems: DefenseSystem[]; prepTime: string };
  };
}

export default function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [focusSystems, setFocusSystems] = useState<DefenseSystem[]>([]);
  const [hoveredSystem, setHoveredSystem] = useState<DefenseSystem | null>(null);
  const [editingMeal, setEditingMeal] = useState<{
    day: string;
    mealType: string;
  } | null>(null);
  const [editedMealName, setEditedMealName] = useState('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  
  const restrictions = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'low-carb',
  ];

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/meal-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietaryRestrictions,
          focusSystems: focusSystems.length > 0 ? focusSystems : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const { data } = await response.json();
      setMealPlan(data);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const toggleSystem = (system: DefenseSystem) => {
    if (focusSystems.includes(system)) {
      setFocusSystems(focusSystems.filter((s) => s !== system));
    } else {
      setFocusSystems([...focusSystems, system]);
    }
  };

  const selectAllSystems = () => {
    setFocusSystems(Object.values(DefenseSystem));
  };

  const clearAllSystems = () => {
    setFocusSystems([]);
  };

  const handleEditMeal = (day: string, mealType: string, currentName: string) => {
    setEditingMeal({ day, mealType });
    setEditedMealName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingMeal && mealPlan) {
      const updatedPlan = { ...mealPlan };
      const meal = updatedPlan[editingMeal.day][editingMeal.mealType as keyof typeof updatedPlan[typeof editingMeal.day]];
      if (meal) {
        meal.name = editedMealName;
      }
      setMealPlan(updatedPlan);
      setEditingMeal(null);
    }
  };

  const handleDeleteMeal = (day: string, mealType: string) => {
    if (mealPlan) {
      const updatedPlan = { ...mealPlan };
      delete updatedPlan[day][mealType as keyof typeof updatedPlan[typeof day]];
      setMealPlan(updatedPlan);
    }
  };

  const handleDownloadPlan = () => {
    if (!mealPlan) return;

    let text = '🍽️ MY 5x5x5 WEEKLY MEAL PLAN\n\n';
    days.forEach((day) => {
      text += `${day.toUpperCase()}\n`;
      text += '─'.repeat(50) + '\n';
      
      mealTypes.forEach((mealType) => {
        const meal = mealPlan[day]?.[mealType as keyof typeof mealPlan[typeof day]];
        if (meal) {
          text += `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}\n`;
          text += `  ⏱️ Prep time: ${meal.prepTime}\n`;
          text += `  🛡️ Systems: ${meal.systems.map(s => DEFENSE_SYSTEMS[s].displayName).join(', ')}\n`;
        }
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-meal-plan.txt';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      {!mealPlan && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customize Your Meal Plan
          </h2>

          {/* Dietary Restrictions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Dietary Restrictions (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {restrictions.map((restriction) => (
                <button
                  key={restriction}
                  onClick={() => toggleRestriction(restriction)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    dietaryRestrictions.includes(restriction)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Systems */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Focus on Specific Systems (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {focusSystems.length} of {Object.values(DefenseSystem).length} systems selected
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllSystems}
                  className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSystems}
                  className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(DefenseSystem).map((system) => {
                const info = DEFENSE_SYSTEMS[system];
                const isSelected = focusSystems.includes(system);
                const isHovered = hoveredSystem === system;
                return (
                  <div key={system} className="relative">
                    <button
                      onClick={() => toggleSystem(system)}
                      onMouseEnter={() => setHoveredSystem(system)}
                      onMouseLeave={() => setHoveredSystem(null)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? `${info.borderColor} ${info.bgColor} shadow-[0_0_20px_rgba(0,0,0,0.1)] ring-2 ${info.borderColor.replace('border-', 'ring-')} animate-pulse-once`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-700 hover:shadow-md'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-xl transition-transform duration-200 ${isSelected ? 'scale-125' : isHovered ? 'scale-110' : ''}`}>
                          {info.icon}
                        </span>
                        <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
                          {info.displayName}
                        </span>
                      </div>
                    </button>
                    
                    {/* Tooltip with key foods */}
                    {isHovered && !isSelected && (
                      <div className="absolute z-10 left-0 right-0 top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl animate-fade-in">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Key Foods:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-200">{info.keyFoods.slice(0, 3).join(', ')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Your Plan...</span>
              </>
            ) : (
              <>
                <Calendar className="w-6 h-6" />
                <span>Generate My Meal Plan</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Meal Plan Display */}
      {mealPlan && (
        <>
          {/* Header Actions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Weekly Meal Plan</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPlan}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    setMealPlan(null);
                    setFocusSystems([]);
                    setDietaryRestrictions([]);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>New Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 gap-6">
            {days.map((day) => (
              <div key={day} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
                  <h3 className="text-xl font-bold capitalize">{day}</h3>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {mealTypes.map((mealType) => {
                      const meal = mealPlan[day]?.[mealType as keyof typeof mealPlan[typeof day]];
                      if (!meal) return null;

                      const isEditing = editingMeal?.day === day && editingMeal?.mealType === mealType;

                      return (
                        <div
                          key={mealType}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <ChefHat className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-200 capitalize">
                                  {mealType}
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editedMealName}
                                    onChange={(e) => setEditedMealName(e.target.value)}
                                    className="flex-1 px-3 py-2 border-2 border-green-500 rounded-lg focus:outline-none"
                                  />
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMeal(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <h4 className="font-bold text-gray-900 text-lg">{meal.name}</h4>
                              )}

                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-200">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{meal.prepTime}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-3">
                                {meal.systems.map((system) => {
                                  const info = DEFENSE_SYSTEMS[system];
                                  return (
                                    <span
                                      key={system}
                                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${info.bgColor} ${info.textColor}`}
                                    >
                                      <span>{info.icon}</span>
                                      <span>{info.displayName}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => handleEditMeal(day, mealType, meal.name)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit meal"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(day, mealType)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove meal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-4">📊 Weekly Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.values(DefenseSystem).map((system) => {
                const info = DEFENSE_SYSTEMS[system];
                let count = 0;
                days.forEach((day) => {
                  mealTypes.forEach((mealType) => {
                    const meal = mealPlan[day]?.[mealType as keyof typeof mealPlan[typeof day]];
                    if (meal?.systems.includes(system)) {
                      count++;
                    }
                  });
                });

                return (
                  <div key={system} className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">
                      {info.displayName}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">meals</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}