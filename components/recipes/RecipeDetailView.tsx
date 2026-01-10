'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Clock,
  Users,
  Printer,
  Share2,
  Plus,
  Minus,
  Check,
  ChefHat,
  Timer,
  Star,
  Heart,
  BookOpen,
  Camera,
  Shield,
  Zap,
  Activity,
  Target,
  Droplets,
  UtensilsCrossed,
} from 'lucide-react';
import { RecipeWithRelations, DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import ShareMenu from '@/components/sharing/ShareMenu';
// Using window alerts for notifications

interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
  optional?: boolean;
}

interface NutritionFact {
  label: string;
  value: string;
  unit: string;
  dailyValue?: number;
}

interface RecipeDetailViewProps {
  recipe: RecipeWithRelations;
  onFavorite?: (recipeId: string) => void;
  onRate?: (recipeId: string, rating: number) => void;
  className?: string;
}

// Utility function to parse and scale ingredients
function parseIngredients(ingredients: any[]): Ingredient[] {
  return ingredients.map(ing => {
    if (typeof ing === 'string') {
      return { name: ing, amount: '1', unit: 'serving' };
    }
    
    // Handle new format with separate quantity and unit
    let amount = ing.amount;
    let unit = ing.unit || '';
    
    // If quantity and unit are separate fields, combine them for display
    if (ing.quantity && !amount) {
      amount = ing.quantity;
    }
    
    return {
      name: ing.name || '',
      amount: amount || '1',
      unit: unit,
      notes: ing.notes || '',
      optional: ing.optional || false,
    };
  });
}

// Utility function to scale ingredient amounts
function scaleIngredientAmount(amount: string, scale: number): string {
  // Handle fractions and mixed numbers
  const fractionMatch = amount.match(/(\d+)?\s*(\d+)\/(\d+)/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || '0');
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    const decimal = whole + numerator / denominator;
    const scaled = decimal * scale;
    
    // Convert back to fraction if appropriate
    if (scaled < 1 && scaled > 0) {
      const simplified = simplifyFraction(Math.round(scaled * 16), 16);
      return `${simplified.numerator}/${simplified.denominator}`;
    }
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2).replace(/\.?0+$/, '');
  }
  
  // Handle decimal numbers
  const numberMatch = amount.match(/(\d+\.?\d*)/);
  if (numberMatch) {
    const number = parseFloat(numberMatch[1]);
    const scaled = number * scale;
    const restOfString = amount.replace(numberMatch[1], '');
    return (scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2).replace(/\.?0+$/, '')) + restOfString;
  }
  
  return amount;
}

// Helper function to simplify fractions
function simplifyFraction(numerator: number, denominator: number) {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

// Defense system icons mapping
const defenseSystemIcons = {
  [DefenseSystem.ANGIOGENESIS]: Droplets,
  [DefenseSystem.REGENERATION]: Zap,
  [DefenseSystem.MICROBIOME]: Activity,
  [DefenseSystem.DNA_PROTECTION]: Shield,
  [DefenseSystem.IMMUNITY]: Target,
};

export default function RecipeDetailView({
  recipe,
  onFavorite,
  onRate,
  className = '',
}: RecipeDetailViewProps) {
  const [servings, setServings] = useState(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [activeInstruction, setActiveInstruction] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [loggingMeal, setLoggingMeal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const originalServings = recipe.servings || 4;
  const servingScale = servings / originalServings;
  const ingredients = parseIngredients(recipe.ingredients as any[]);
  const instructions = typeof recipe.instructions === 'string' 
    ? (recipe.instructions as string).split('\n').filter(Boolean)
    : recipe.instructions as string[];

  // Handle servings adjustment
  const adjustServings = (delta: number) => {
    setServings(Math.max(1, servings + delta));
  };

  // Handle ingredient checkbox toggle
  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  // Handle rating
  const handleRate = (rating: number) => {
    setUserRating(rating);
    onRate?.(recipe.id, rating);
  };

  // Handle Log This Meal
  const handleLogMeal = async () => {
    setLoggingMeal(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/log-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealTime: 'LUNCH', // Default to lunch
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to log meal');

      const result = await response.json();
      
      alert(`✅ Meal logged! Tracked ${result.systemsTracked.length} defense systems`);
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Failed to log meal');
    } finally {
      setLoggingMeal(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            } catch (e) {
              return '';
            }
          })
          .join('\n');

        printWindow.document.write(`
          <html>
            <head>
              <title>${recipe.title} - Recipe</title>
              <style>
                ${styles}
                @media print {
                  .no-print { display: none !important; }
                  .print-break { page-break-before: always; }
                  body { font-size: 12pt; line-height: 1.4; }
                  h1 { font-size: 18pt; }
                  h2 { font-size: 16pt; }
                  h3 { font-size: 14pt; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Parse nutrition data
  const nutritionFacts: NutritionFact[] = React.useMemo(() => {
    if (!recipe.nutrients || typeof recipe.nutrients !== 'object') return [];
    
    const defaultNutrition: NutritionFact[] = [
      { label: 'Calories', value: '0', unit: 'kcal' },
      { label: 'Protein', value: '0', unit: 'g', dailyValue: 20 },
      { label: 'Carbohydrates', value: '0', unit: 'g', dailyValue: 45 },
      { label: 'Fat', value: '0', unit: 'g', dailyValue: 25 },
      { label: 'Fiber', value: '0', unit: 'g', dailyValue: 12 },
      { label: 'Sugar', value: '0', unit: 'g' },
      { label: 'Sodium', value: '0', unit: 'mg', dailyValue: 10 },
    ];

    return defaultNutrition.map(item => ({
      ...item,
      value: recipe.nutrients[item.label.toLowerCase()] || item.value,
    }));
  }, [recipe.nutrients]);

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div ref={printRef}>
        {/* Hero Section */}
        <div className="relative h-64 sm:h-80 bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ChefHat className="w-24 h-24 text-white opacity-50" />
            </div>
          )}
          
          {/* Overlay with title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white w-full">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg opacity-90 max-w-2xl">{recipe.description}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 no-print">
            <button
              onClick={handleLogMeal}
              disabled={loggingMeal}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Log this meal to progress"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-medium">
                {loggingMeal ? 'Logging...' : 'Log This Meal'}
              </span>
            </button>
            
            <button
              onClick={() => onFavorite?.(recipe.id)}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              aria-label="Add to favorites"
            >
              <Heart
                className={`w-5 h-5 ${
                  recipe.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-200'
                }`}
              />
            </button>
            
            <button
              onClick={handlePrint}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              aria-label="Print recipe"
            >
              <Printer className="w-5 h-5 text-gray-600 dark:text-gray-200" />
            </button>
            
            <ShareMenu
              title={recipe.title}
              description={recipe.description || undefined}
              url={`${window.location.origin}/recipes/${recipe.id}`}
              variant="icon"
              className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white"
            />
          </div>
        </div>

        {/* Recipe Meta Information */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Time badges */}
            {recipe.prepTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Prep: {recipe.prepTime}</span>
              </div>
            )}
            
            {recipe.cookTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
                <Timer className="w-4 h-4" />
                <span className="font-medium">Cook: {recipe.cookTime}</span>
              </div>
            )}
            
            {recipe.prepTime && recipe.cookTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">
                  Total: {parseInt(recipe.prepTime) + parseInt(recipe.cookTime)} min
                </span>
              </div>
            )}
          </div>

          {/* Servings selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900">Servings:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustServings(-1)}
                  disabled={servings <= 1}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease servings"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg min-w-20 justify-center">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-200" />
                  <span className="text-lg font-semibold">{servings}</span>
                </div>
                
                <button
                  onClick={() => adjustServings(1)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"
                  aria-label="Increase servings"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 no-print">
              <span className="text-sm text-gray-600 dark:text-gray-200">Rate:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`Rate ${rating} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        rating <= (userRating || recipe.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {recipe.averageRating && (
                <span className="text-sm text-gray-600 dark:text-gray-200 ml-2">
                  ({recipe.averageRating.toFixed(1)})
                </span>
              )}
            </div>
          </div>

          {/* Defense Systems */}
          {recipe.defenseSystems && recipe.defenseSystems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Defense Systems</h3>
              <div className="flex flex-wrap gap-3">
                {recipe.defenseSystems.map(system => {
                  const systemInfo = DEFENSE_SYSTEMS[system];
                  const IconComponent = defenseSystemIcons[system];
                  
                  return (
                    <div
                      key={system}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${systemInfo.bgColor} ${systemInfo.borderColor} ${systemInfo.textColor}`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span className="font-medium">{systemInfo.displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 p-6">
          {/* Ingredients Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Ingredients
            </h2>
            
            {servingScale !== 1 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Adjusted for {servings} servings</strong>
                  {originalServings !== servings && (
                    <span className="block text-xs">
                      (Original recipe serves {originalServings})
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 dark:bg-gray-700 ${
                    checkedIngredients.has(index)
                      ? 'bg-green-50 border-green-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={checkedIngredients.has(index)}
                      onChange={() => toggleIngredient(index)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        checkedIngredients.has(index)
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {checkedIngredients.has(index) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className={`${checkedIngredients.has(index) ? 'line-through text-gray-500 dark:text-gray-300' : 'text-gray-900'}`}>
                      <span className="font-medium">
                        {scaleIngredientAmount(ingredient.amount, servingScale)}
                        {ingredient.unit && ` ${ingredient.unit}`}
                      </span>
                      <span className="ml-2">{ingredient.name}</span>
                      {ingredient.optional && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-300 italic">(optional)</span>
                      )}
                    </div>
                    {ingredient.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-200 mt-1">{ingredient.notes}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setCheckedIngredients(new Set(ingredients.map((_, i) => i)))}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Check All
              </button>
              <button
                onClick={() => setCheckedIngredients(new Set())}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Uncheck All
              </button>
            </div>
          </div>

          {/* Instructions and Nutrition */}
          <div className="lg:col-span-2 space-y-8">
            {/* Instructions Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ChefHat className="w-6 h-6" />
                Instructions
              </h2>
              
              <div className="space-y-6">
                {instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-6 transition-all ${
                      activeInstruction === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Step number */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          activeInstruction === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        {/* Instruction text */}
                        <p className="text-gray-900 leading-relaxed mb-4">{instruction}</p>
                        
                        {/* Image placeholder */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-32 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-500 dark:text-gray-300">
                            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Step {index + 1} Image</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Step toggle button */}
                    <button
                      onClick={() => setActiveInstruction(activeInstruction === index ? null : index)}
                      className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        activeInstruction === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {activeInstruction === index ? 'Cooking this step...' : 'Start this step'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Facts Card */}
            <div className="bg-white border-2 border-gray-900 rounded-lg">
              <div className="bg-gray-900 text-white p-4">
                <h3 className="text-xl font-bold">Nutrition Facts</h3>
                <p className="text-sm opacity-75">Per serving ({servings} total servings)</p>
              </div>
              
              <div className="p-4">
                {nutritionFacts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className={`flex justify-between items-center py-2 ${
                      index === 0 ? 'border-b-4 border-gray-900' : 'border-b border-gray-300'
                    } ${index === 0 ? 'text-2xl font-bold' : 'text-sm'}`}
                  >
                    <span className={index === 0 ? 'text-gray-900' : 'text-gray-700'}>
                      {fact.label}
                    </span>
                    <div className="text-right">
                      <span className={`font-semibold ${index === 0 ? 'text-gray-900' : 'text-gray-900'}`}>
                        {fact.value}{fact.unit}
                      </span>
                      {fact.dailyValue && (
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {fact.dailyValue}% DV
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-gray-500 dark:text-gray-300 mt-4 pt-2 border-t border-gray-300">
                  * Percent Daily Values are based on a 2,000 calorie diet.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}