// Standard measurement units for recipe ingredients

export const VOLUME_UNITS = [
  // Imperial
  { value: 'tsp', label: 'teaspoon (tsp)', system: 'imperial' },
  { value: 'tbsp', label: 'tablespoon (tbsp)', system: 'imperial' },
  { value: 'fl oz', label: 'fluid ounce (fl oz)', system: 'imperial' },
  { value: 'cup', label: 'cup', system: 'imperial' },
  { value: 'pint', label: 'pint', system: 'imperial' },
  { value: 'quart', label: 'quart', system: 'imperial' },
  { value: 'gallon', label: 'gallon', system: 'imperial' },
  
  // Metric
  { value: 'ml', label: 'milliliter (ml)', system: 'metric' },
  { value: 'liter', label: 'liter (L)', system: 'metric' },
] as const;

export const WEIGHT_UNITS = [
  // Imperial
  { value: 'oz', label: 'ounce (oz)', system: 'imperial' },
  { value: 'lb', label: 'pound (lb)', system: 'imperial' },
  
  // Metric
  { value: 'g', label: 'gram (g)', system: 'metric' },
  { value: 'kg', label: 'kilogram (kg)', system: 'metric' },
] as const;

export const COUNT_UNITS = [
  { value: 'piece', label: 'piece' },
  { value: 'whole', label: 'whole' },
  { value: 'clove', label: 'clove' },
  { value: 'slice', label: 'slice' },
  { value: 'can', label: 'can' },
  { value: 'package', label: 'package' },
  { value: 'bunch', label: 'bunch' },
] as const;

export const SPECIAL_UNITS = [
  { value: 'pinch', label: 'pinch' },
  { value: 'dash', label: 'dash' },
  { value: 'to taste', label: 'to taste' },
  { value: 'as needed', label: 'as needed' },
] as const;

export const ALL_UNITS = [
  ...VOLUME_UNITS,
  ...WEIGHT_UNITS,
  ...COUNT_UNITS,
  ...SPECIAL_UNITS,
] as const;

export type MeasurementUnit = typeof ALL_UNITS[number]['value'];

// Helper function to get unit display name
export function getUnitLabel(unit: string): string {
  const found = ALL_UNITS.find(u => u.value === unit);
  return found ? found.label : unit;
}

// Helper function to validate if a unit is valid
export function isValidUnit(unit: string): boolean {
  return ALL_UNITS.some(u => u.value === unit);
}

// Get units by system preference
export function getUnitsBySystem(system: 'imperial' | 'metric' | 'all' = 'all') {
  if (system === 'all') {
    return ALL_UNITS;
  }
  
  return [
    ...ALL_UNITS.filter(u => 'system' in u && u.system === system),
    ...COUNT_UNITS,
    ...SPECIAL_UNITS,
  ];
}

// Common ingredient categories and their typical units
export const INGREDIENT_UNIT_SUGGESTIONS: Record<string, string[]> = {
  liquids: ['cup', 'ml', 'liter', 'fl oz', 'tbsp', 'tsp'],
  flour: ['cup', 'g', 'kg', 'oz', 'lb'],
  sugar: ['cup', 'g', 'kg', 'oz', 'lb', 'tbsp', 'tsp'],
  butter: ['tbsp', 'cup', 'g', 'oz', 'lb'],
  oil: ['tbsp', 'cup', 'ml', 'fl oz'],
  vegetables: ['piece', 'whole', 'cup', 'g', 'oz', 'bunch'],
  meat: ['lb', 'kg', 'g', 'oz', 'piece'],
  cheese: ['cup', 'g', 'oz', 'lb', 'slice'],
  spices: ['tsp', 'tbsp', 'pinch', 'dash', 'to taste'],
};

// Get suggested units based on ingredient name
export function getSuggestedUnits(ingredientName: string): string[] {
  const name = ingredientName.toLowerCase();
  
  // Check for ingredient categories
  if (name.includes('milk') || name.includes('water') || name.includes('juice') || 
      name.includes('broth') || name.includes('stock') || name.includes('cream')) {
    return INGREDIENT_UNIT_SUGGESTIONS.liquids;
  }
  
  if (name.includes('flour')) {
    return INGREDIENT_UNIT_SUGGESTIONS.flour;
  }
  
  if (name.includes('sugar')) {
    return INGREDIENT_UNIT_SUGGESTIONS.sugar;
  }
  
  if (name.includes('butter')) {
    return INGREDIENT_UNIT_SUGGESTIONS.butter;
  }
  
  if (name.includes('oil')) {
    return INGREDIENT_UNIT_SUGGESTIONS.oil;
  }
  
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') || 
      name.includes('herb') || name.includes('cinnamon') || name.includes('paprika')) {
    return INGREDIENT_UNIT_SUGGESTIONS.spices;
  }
  
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('meat')) {
    return INGREDIENT_UNIT_SUGGESTIONS.meat;
  }
  
  if (name.includes('cheese')) {
    return INGREDIENT_UNIT_SUGGESTIONS.cheese;
  }
  
  // Default for vegetables and other items
  return INGREDIENT_UNIT_SUGGESTIONS.vegetables;
}

/**
 * Get suggested units filtered by measurement system and ingredient
 * @param ingredientName - Name of the ingredient
 * @param system - 'imperial' or 'metric'
 * @returns Array of suggested unit values for the system
 */
export function getSuggestedUnitsBySystem(ingredientName: string, system: 'imperial' | 'metric'): string[] {
  const allSuggested = getSuggestedUnits(ingredientName);
  const systemUnits = getUnitsBySystem(system);
  
  // Filter suggestions to only include units available in the current system
  return allSuggested.filter(unitValue => 
    systemUnits.some(u => u.value === unitValue)
  );
}
