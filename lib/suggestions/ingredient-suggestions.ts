import { DefenseSystem } from '@/types';

/**
 * Ingredient suggestions organized by defense system
 * Based on Dr. William Li's research on health-promoting foods
 */
export const INGREDIENT_SUGGESTIONS: Record<DefenseSystem, string[]> = {
  [DefenseSystem.ANGIOGENESIS]: [
    'tomatoes',
    'blueberries',
    'strawberries',
    'raspberries',
    'blackberries',
    'olive oil',
    'dark chocolate',
    'red wine',
    'soy',
    'turmeric',
    'green tea',
    'pumpkin',
    'bok choy',
    'kale',
  ],
  [DefenseSystem.REGENERATION]: [
    'bone broth',
    'eggs',
    'mushrooms',
    'shellfish',
    'dark chocolate',
    'cheese',
    'squid',
    'black beans',
    'walnuts',
    'coffee',
    'beer',
    'licorice',
    'sourdough bread',
    'mangosteen',
  ],
  [DefenseSystem.MICROBIOME]: [
    'yogurt',
    'kimchi',
    'sauerkraut',
    'kefir',
    'kombucha',
    'miso',
    'tempeh',
    'pickles',
    'sourdough bread',
    'aged cheese',
    'apple cider vinegar',
    'dark chocolate',
    'green tea',
    'whole grains',
  ],
  [DefenseSystem.DNA_PROTECTION]: [
    'walnuts',
    'green tea',
    'broccoli',
    'cauliflower',
    'Brussels sprouts',
    'kale',
    'cabbage',
    'coffee',
    'tomatoes',
    'carrots',
    'apples',
    'grapes',
    'pomegranate',
    'blueberries',
  ],
  [DefenseSystem.IMMUNITY]: [
    'garlic',
    'ginger',
    'citrus fruits',
    'oranges',
    'lemons',
    'limes',
    'mushrooms',
    'yogurt',
    'kefir',
    'green tea',
    'turmeric',
    'almonds',
    'spinach',
    'red bell peppers',
  ],
};

/**
 * Meal type specific ingredient suggestions
 */
export const MEAL_TYPE_SUGGESTIONS: Record<string, string[]> = {
  breakfast: [
    'eggs',
    'oatmeal',
    'yogurt',
    'berries',
    'whole grain bread',
    'avocado',
    'spinach',
    'mushrooms',
    'tomatoes',
    'smoked salmon',
    'Greek yogurt',
    'chia seeds',
    'bananas',
    'almonds',
  ],
  lunch: [
    'chicken breast',
    'salmon',
    'quinoa',
    'mixed greens',
    'avocado',
    'chickpeas',
    'sweet potato',
    'broccoli',
    'tomatoes',
    'olive oil',
    'lemon',
    'feta cheese',
    'brown rice',
    'bell peppers',
  ],
  dinner: [
    'salmon',
    'chicken thighs',
    'beef',
    'pork tenderloin',
    'shrimp',
    'asparagus',
    'Brussels sprouts',
    'cauliflower',
    'garlic',
    'onions',
    'herbs',
    'olive oil',
    'mushrooms',
    'zucchini',
  ],
  snack: [
    'almonds',
    'walnuts',
    'apple',
    'carrots',
    'hummus',
    'Greek yogurt',
    'berries',
    'dark chocolate',
    'cheese',
    'edamame',
    'celery',
    'peanut butter',
    'trail mix',
    'protein bar',
  ],
  dessert: [
    'dark chocolate',
    'berries',
    'Greek yogurt',
    'honey',
    'vanilla',
    'cinnamon',
    'nuts',
    'coconut',
    'dates',
    'cacao',
    'avocado',
    'banana',
    'chia seeds',
    'maple syrup',
  ],
};

/**
 * Get ingredient suggestions for a specific defense system
 */
export function getSuggestionsForSystem(system: DefenseSystem): string[] {
  return INGREDIENT_SUGGESTIONS[system] || [];
}

/**
 * Get ingredient suggestions for a specific meal type
 */
export function getSuggestionsForMealType(mealType: string): string[] {
  return MEAL_TYPE_SUGGESTIONS[mealType.toLowerCase()] || [];
}

/**
 * Get combined suggestions based on defense system and meal type
 */
export function getCombinedSuggestions(
  defenseSystem: DefenseSystem,
  mealType?: string
): string[] {
  const systemSuggestions = getSuggestionsForSystem(defenseSystem);
  const mealSuggestions = mealType ? getSuggestionsForMealType(mealType) : [];

  // Combine and remove duplicates
  const combined = [...systemSuggestions, ...mealSuggestions];
  return Array.from(new Set(combined));
}

/**
 * Filter suggestions based on dietary restrictions
 */
export function filterByRestrictions(
  suggestions: string[],
  restrictions: string[]
): string[] {
  if (restrictions.length === 0) return suggestions;

  const restrictionMap: Record<string, string[]> = {
    vegetarian: ['chicken', 'beef', 'pork', 'salmon', 'shrimp', 'shellfish', 'fish'],
    vegan: [
      'chicken',
      'beef',
      'pork',
      'salmon',
      'shrimp',
      'shellfish',
      'fish',
      'eggs',
      'yogurt',
      'cheese',
      'Greek yogurt',
      'kefir',
      'bone broth',
      'honey',
    ],
    'gluten-free': [
      'whole grain bread',
      'sourdough bread',
      'oatmeal',
      'beer',
      'whole grains',
    ],
    'dairy-free': [
      'yogurt',
      'cheese',
      'Greek yogurt',
      'kefir',
      'aged cheese',
      'feta cheese',
    ],
    'nut-free': ['almonds', 'walnuts', 'nuts', 'peanut butter', 'trail mix'],
  };

  let filtered = [...suggestions];

  restrictions.forEach((restriction) => {
    const toRemove = restrictionMap[restriction.toLowerCase()] || [];
    filtered = filtered.filter(
      (item) =>
        !toRemove.some((remove) => item.toLowerCase().includes(remove.toLowerCase()))
    );
  });

  return filtered;
}

/**
 * Get smart suggestions based on current input context
 */
export function getSmartSuggestions(
  defenseSystem: DefenseSystem,
  mealType: string,
  dietaryRestrictions: string[],
  currentIngredients: string[]
): string[] {
  // Get combined suggestions
  let suggestions = getCombinedSuggestions(defenseSystem, mealType);

  // Filter by restrictions
  suggestions = filterByRestrictions(suggestions, dietaryRestrictions);

  // Remove already added ingredients
  suggestions = suggestions.filter(
    (suggestion) =>
      !currentIngredients.some(
        (ingredient) => ingredient.toLowerCase() === suggestion.toLowerCase()
      )
  );

  // Sort by relevance (system suggestions first, then meal type)
  const systemSuggestions = getSuggestionsForSystem(defenseSystem);
  suggestions.sort((a, b) => {
    const aIsSystem = systemSuggestions.includes(a);
    const bIsSystem = systemSuggestions.includes(b);
    if (aIsSystem && !bIsSystem) return -1;
    if (!aIsSystem && bIsSystem) return 1;
    return 0;
  });

  return suggestions;
}
