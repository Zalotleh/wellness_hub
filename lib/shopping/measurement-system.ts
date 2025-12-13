// Measurement system utilities for imperial and metric conversions

export type MeasurementSystem = 'imperial' | 'metric';

export interface MeasurementPreference {
  system: MeasurementSystem;
  temperature: 'fahrenheit' | 'celsius';
}

// Default preferences
export const DEFAULT_PREFERENCES: MeasurementPreference = {
  system: 'imperial',
  temperature: 'fahrenheit',
};

// Storage key for user preferences
const STORAGE_KEY = 'wellness_hub_measurement_preference';

/**
 * Get user's measurement preference from localStorage
 */
export function getMeasurementPreference(): MeasurementPreference {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading measurement preference:', error);
  }
  
  return DEFAULT_PREFERENCES;
}

/**
 * Save user's measurement preference to localStorage
 */
export function setMeasurementPreference(preference: MeasurementPreference): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error('Error saving measurement preference:', error);
  }
}

// ==================== VOLUME CONVERSIONS ====================

const VOLUME_CONVERSIONS: Record<string, number> = {
  // Imperial to ml
  'teaspoon': 4.92892,
  'tsp': 4.92892,
  'tablespoon': 14.7868,
  'tbsp': 14.7868,
  'fluid ounce': 29.5735,
  'fl oz': 29.5735,
  'cup': 236.588,
  'pint': 473.176,
  'quart': 946.353,
  'gallon': 3785.41,
  
  // Metric
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'liter': 1000,
  'liters': 1000,
  'l': 1000,
};

// ==================== WEIGHT CONVERSIONS ====================

const WEIGHT_CONVERSIONS: Record<string, number> = {
  // Imperial to grams
  'ounce': 28.3495,
  'oz': 28.3495,
  'pound': 453.592,
  'lb': 453.592,
  'lbs': 453.592,
  
  // Metric
  'gram': 1,
  'grams': 1,
  'g': 1,
  'kilogram': 1000,
  'kilograms': 1000,
  'kg': 1000,
};

/**
 * Convert volume to target system
 */
export function convertVolume(
  amount: number,
  fromUnit: string,
  toSystem: MeasurementSystem
): { amount: number; unit: string } {
  const from = fromUnit.toLowerCase().trim();
  
  // Convert to ml first
  const ml = amount * (VOLUME_CONVERSIONS[from] || 1);
  
  if (toSystem === 'metric') {
    // Return in metric
    if (ml >= 1000) {
      return { amount: Number((ml / 1000).toFixed(2)), unit: 'liters' };
    }
    return { amount: Math.round(ml), unit: 'ml' };
  } else {
    // Return in imperial
    if (ml >= 3785) {
      return { amount: Number((ml / 3785.41).toFixed(2)), unit: 'gallons' };
    }
    if (ml >= 946) {
      return { amount: Number((ml / 946.353).toFixed(2)), unit: 'quarts' };
    }
    if (ml >= 473) {
      return { amount: Number((ml / 473.176).toFixed(2)), unit: 'pints' };
    }
    if (ml >= 236) {
      return { amount: Number((ml / 236.588).toFixed(2)), unit: 'cups' };
    }
    if (ml >= 29.5) {
      return { amount: Number((ml / 29.5735).toFixed(2)), unit: 'fl oz' };
    }
    if (ml >= 14.7) {
      return { amount: Number((ml / 14.7868).toFixed(2)), unit: 'tbsp' };
    }
    return { amount: Number((ml / 4.92892).toFixed(2)), unit: 'tsp' };
  }
}

/**
 * Convert weight to target system
 */
export function convertWeight(
  amount: number,
  fromUnit: string,
  toSystem: MeasurementSystem
): { amount: number; unit: string } {
  const from = fromUnit.toLowerCase().trim();
  
  // Convert to grams first
  const grams = amount * (WEIGHT_CONVERSIONS[from] || 1);
  
  if (toSystem === 'metric') {
    // Return in metric
    if (grams >= 1000) {
      return { amount: Number((grams / 1000).toFixed(2)), unit: 'kg' };
    }
    return { amount: Math.round(grams), unit: 'g' };
  } else {
    // Return in imperial
    if (grams >= 453) {
      return { amount: Number((grams / 453.592).toFixed(2)), unit: 'lbs' };
    }
    return { amount: Number((grams / 28.3495).toFixed(2)), unit: 'oz' };
  }
}

/**
 * Check if unit is a volume measurement
 */
export function isVolumeUnit(unit: string): boolean {
  const u = unit.toLowerCase().trim();
  return u in VOLUME_CONVERSIONS;
}

/**
 * Check if unit is a weight measurement
 */
export function isWeightUnit(unit: string): boolean {
  const u = unit.toLowerCase().trim();
  return u in WEIGHT_CONVERSIONS;
}

/**
 * Convert measurement to user's preferred system
 */
export function convertToPreferredSystem(
  amount: number,
  unit: string,
  targetSystem?: MeasurementSystem
): { amount: number; unit: string } {
  const system = targetSystem || getMeasurementPreference().system;
  
  if (isVolumeUnit(unit)) {
    return convertVolume(amount, unit, system);
  }
  
  if (isWeightUnit(unit)) {
    return convertWeight(amount, unit, system);
  }
  
  // Not a convertible unit, return as-is
  return { amount, unit };
}

/**
 * Format measurement for display
 */
export function formatMeasurement(
  amount: number,
  unit: string,
  targetSystem?: MeasurementSystem
): string {
  const converted = convertToPreferredSystem(amount, unit, targetSystem);
  
  // Format amount nicely
  let formattedAmount: string;
  if (converted.amount % 1 === 0) {
    formattedAmount = converted.amount.toString();
  } else if (converted.amount < 10) {
    formattedAmount = converted.amount.toFixed(2);
  } else {
    formattedAmount = converted.amount.toFixed(1);
  }
  
  return `${formattedAmount} ${converted.unit}`;
}

/**
 * Get system-specific retail packages
 */
export function getRetailPackages(system: MeasurementSystem) {
  if (system === 'metric') {
    return {
      'milk': { sizes: [250, 500, 1000, 2000], unit: 'ml' },
      'cream': { sizes: [250, 500], unit: 'ml' },
      'juice': { sizes: [330, 1000, 2000], unit: 'ml' },
      'oil': { sizes: [250, 500, 750, 1000], unit: 'ml' },
      'butter': { sizes: [250, 500], unit: 'g' },
      'flour': { sizes: [1000, 2000], unit: 'g' },
      'sugar': { sizes: [1000, 2000], unit: 'g' },
      'rice': { sizes: [1000, 2000, 5000], unit: 'g' },
      'pasta': { sizes: [500, 1000], unit: 'g' },
      'cheese': { sizes: [200, 500], unit: 'g' },
      'yogurt': { sizes: [150, 500], unit: 'g' },
    };
  } else {
    return {
      'milk': { sizes: [8, 16, 32, 64, 128], unit: 'fl oz' },
      'cream': { sizes: [8, 16, 32], unit: 'fl oz' },
      'juice': { sizes: [12, 32, 64], unit: 'fl oz' },
      'oil': { sizes: [8, 16, 24, 32], unit: 'fl oz' },
      'butter': { sizes: [8, 16], unit: 'oz' },
      'flour': { sizes: [32, 80], unit: 'oz' },
      'sugar': { sizes: [32, 64, 80], unit: 'oz' },
      'rice': { sizes: [32, 64, 80, 160], unit: 'oz' },
      'pasta': { sizes: [16, 32], unit: 'oz' },
      'cheese': { sizes: [8, 16, 32], unit: 'oz' },
      'yogurt': { sizes: [5.3, 32], unit: 'oz' },
    };
  }
}

/**
 * Get measurement system display name
 */
export function getSystemDisplayName(system: MeasurementSystem): string {
  return system === 'metric' ? 'Metric (g, ml, kg, L)' : 'Imperial (oz, cups, lbs, gallons)';
}

/**
 * Get common units for system
 */
export function getCommonUnits(system: MeasurementSystem) {
  if (system === 'metric') {
    return {
      volume: ['ml', 'liters'],
      weight: ['g', 'kg'],
      temperature: 'celsius',
    };
  } else {
    return {
      volume: ['tsp', 'tbsp', 'cups', 'fl oz', 'pints', 'quarts', 'gallons'],
      weight: ['oz', 'lbs'],
      temperature: 'fahrenheit',
    };
  }
}
