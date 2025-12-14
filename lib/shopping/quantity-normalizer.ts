// Utility for normalizing cooking measurements to retail/e-commerce quantities
import { MeasurementSystem, convertToPreferredSystem, getRetailPackages } from './measurement-system';

export interface NormalizedQuantity {
  originalQuantity: number;
  originalUnit: string;
  retailQuantity: number;
  retailUnit: string;
  retailDescription: string; // e.g., "1 gallon" or "2 lbs package"
  conversionNote?: string;
  measurementSystem: MeasurementSystem;
}

// Conversion maps for common ingredients - IMPERIAL
const LIQUID_TO_RETAIL_IMPERIAL: Record<string, { amount: number; unit: string }> = {
  'cup': { amount: 8, unit: 'fl oz' },
  'cups': { amount: 8, unit: 'fl oz' },
  'tablespoon': { amount: 0.5, unit: 'fl oz' },
  'tablespoons': { amount: 0.5, unit: 'fl oz' },
  'tbsp': { amount: 0.5, unit: 'fl oz' },
  'teaspoon': { amount: 0.17, unit: 'fl oz' },
  'teaspoons': { amount: 0.17, unit: 'fl oz' },
  'tsp': { amount: 0.17, unit: 'fl oz' },
  'ml': { amount: 0.034, unit: 'fl oz' },
  'liter': { amount: 33.8, unit: 'fl oz' },
  'liters': { amount: 33.8, unit: 'fl oz' },
  'l': { amount: 33.8, unit: 'fl oz' },
};

// Conversion maps for common ingredients - METRIC
const LIQUID_TO_RETAIL_METRIC: Record<string, { amount: number; unit: string }> = {
  'cup': { amount: 237, unit: 'ml' },
  'cups': { amount: 237, unit: 'ml' },
  'tablespoon': { amount: 15, unit: 'ml' },
  'tablespoons': { amount: 15, unit: 'ml' },
  'tbsp': { amount: 15, unit: 'ml' },
  'teaspoon': { amount: 5, unit: 'ml' },
  'teaspoons': { amount: 5, unit: 'ml' },
  'tsp': { amount: 5, unit: 'ml' },
  'ml': { amount: 1, unit: 'ml' },
  'liter': { amount: 1000, unit: 'ml' },
  'liters': { amount: 1000, unit: 'ml' },
  'l': { amount: 1000, unit: 'ml' },
  'fl oz': { amount: 29.5735, unit: 'ml' },
};

// Common retail package sizes - IMPERIAL
const RETAIL_PACKAGES_IMPERIAL: Record<string, { sizes: number[]; unit: string }> = {
  'milk': { sizes: [8, 16, 32, 64, 128], unit: 'fl oz' }, // Half pint to gallon
  'cream': { sizes: [8, 16, 32], unit: 'fl oz' },
  'juice': { sizes: [12, 32, 64], unit: 'fl oz' },
  'oil': { sizes: [8, 16, 24, 32], unit: 'fl oz' },
  'soy sauce': { sizes: [5, 10, 15], unit: 'fl oz' },
  'tamari': { sizes: [5, 10, 15], unit: 'fl oz' },
  'butter': { sizes: [8, 16], unit: 'oz' }, // Sticks/pounds
  'flour': { sizes: [32, 80], unit: 'oz' }, // 2lb, 5lb bags
  'sugar': { sizes: [32, 64, 80], unit: 'oz' },
  'rice': { sizes: [32, 64, 80, 160], unit: 'oz' },
  'pasta': { sizes: [16, 32], unit: 'oz' },
  'cheese': { sizes: [8, 16, 32], unit: 'oz' },
  'yogurt': { sizes: [5.3, 32], unit: 'oz' }, // Individual cups or tubs
};

// Common retail package sizes - METRIC
const RETAIL_PACKAGES_METRIC: Record<string, { sizes: number[]; unit: string }> = {
  'milk': { sizes: [250, 500, 1000, 2000], unit: 'ml' }, // Quarter liter to 2 liters
  'cream': { sizes: [200, 250, 500], unit: 'ml' },
  'juice': { sizes: [330, 500, 1000, 2000], unit: 'ml' },
  'oil': { sizes: [250, 500, 750, 1000], unit: 'ml' },
  'soy sauce': { sizes: [150, 250, 500], unit: 'ml' },
  'tamari': { sizes: [150, 250, 500], unit: 'ml' },
  'butter': { sizes: [250, 500], unit: 'g' },
  'flour': { sizes: [500, 1000, 2000], unit: 'g' }, // 500g, 1kg, 2kg
  'sugar': { sizes: [500, 1000, 2000], unit: 'g' },
  'rice': { sizes: [500, 1000, 2000, 5000], unit: 'g' },
  'pasta': { sizes: [500, 1000], unit: 'g' },
  'cheese': { sizes: [200, 500, 1000], unit: 'g' },
  'yogurt': { sizes: [150, 500], unit: 'g' }, // Individual cups or tubs
};

/**
 * Normalize cooking quantities to retail/e-commerce friendly quantities
 */
export function normalizeQuantity(
  ingredient: string,
  quantity: number,
  unit: string,
  measurementSystem: MeasurementSystem = 'imperial'
): NormalizedQuantity {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Convert to preferred system first
  const converted = convertToPreferredSystem(quantity, unit, measurementSystem);
  const lowerUnit = converted.unit.toLowerCase().trim();

  // Handle liquids (milk, cream, juice, etc.)
  if (isLiquidIngredient(lowerIngredient)) {
    return normalizeLiquid(lowerIngredient, converted.amount, lowerUnit, measurementSystem);
  }

  // Handle dry goods by weight
  if (isDryGoods(lowerIngredient)) {
    return normalizeDryGoods(lowerIngredient, converted.amount, lowerUnit, measurementSystem);
  }

  // Handle produce (count-based items)
  if (isCountBasedItem(lowerIngredient)) {
    return normalizeCountBased(lowerIngredient, converted.amount, lowerUnit, measurementSystem);
  }

  // Default: return as-is with suggestion
  return {
    originalQuantity: quantity,
    originalUnit: unit,
    retailQuantity: converted.amount,
    retailUnit: converted.unit,
    retailDescription: `${converted.amount} ${converted.unit}`,
    conversionNote: 'Purchase as needed',
    measurementSystem
  };
}

function normalizeLiquid(
  ingredient: string,
  quantity: number,
  unit: string,
  measurementSystem: MeasurementSystem
): NormalizedQuantity {
  const LIQUID_TO_RETAIL = measurementSystem === 'metric' ? LIQUID_TO_RETAIL_METRIC : LIQUID_TO_RETAIL_IMPERIAL;
  
  // Convert to base unit (ml for metric, fl oz for imperial)
  let baseAmount = quantity;
  const baseUnit = measurementSystem === 'metric' ? 'ml' : 'fl oz';
  
  if (LIQUID_TO_RETAIL[unit]) {
    baseAmount = quantity * LIQUID_TO_RETAIL[unit].amount;
  }

  // Find best retail package size
  const retailInfo = findBestRetailPackage(ingredient, baseAmount, baseUnit, measurementSystem);
  
  return {
    originalQuantity: quantity,
    originalUnit: unit,
    retailQuantity: retailInfo.quantity,
    retailUnit: retailInfo.unit,
    retailDescription: retailInfo.description,
    conversionNote: retailInfo.note,
    measurementSystem
  };
}

function normalizeDryGoods(
  ingredient: string,
  quantity: number,
  unit: string,
  measurementSystem: MeasurementSystem
): NormalizedQuantity {
  let baseAmount = quantity;
  let baseUnit: string;
  
  if (measurementSystem === 'metric') {
    // Convert to grams for metric
    baseUnit = 'g';
    
    if (unit === 'cup' || unit === 'cups') {
      // Approximate conversions (varies by ingredient)
      if (ingredient.includes('flour')) {
        baseAmount = quantity * 125; // 1 cup flour ≈ 125g
      } else if (ingredient.includes('sugar')) {
        baseAmount = quantity * 200; // 1 cup sugar ≈ 200g
      } else if (ingredient.includes('rice')) {
        baseAmount = quantity * 185; // 1 cup rice ≈ 185g
      } else {
        baseAmount = quantity * 140; // Generic approximation
      }
    } else if (unit === 'oz' || unit === 'ounces') {
      baseAmount = quantity * 28.35;
    } else if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') {
      baseAmount = quantity * 453.592;
    } else if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
      baseAmount = quantity * 1000;
    } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
      baseAmount = quantity;
    }
  } else {
    // Convert to ounces for imperial
    baseUnit = 'oz';
    
    if (unit === 'cup' || unit === 'cups') {
      // Approximate conversions (varies by ingredient)
      if (ingredient.includes('flour')) {
        baseAmount = quantity * 4.5; // 1 cup flour ≈ 4.5 oz
      } else if (ingredient.includes('sugar')) {
        baseAmount = quantity * 7; // 1 cup sugar ≈ 7 oz
      } else if (ingredient.includes('rice')) {
        baseAmount = quantity * 6.5; // 1 cup rice ≈ 6.5 oz
      } else {
        baseAmount = quantity * 5; // Generic approximation
      }
    } else if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') {
      baseAmount = quantity * 16;
    } else if (unit === 'oz' || unit === 'ounces') {
      baseAmount = quantity;
    } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
      baseAmount = quantity * 0.035274;
    }
  }

  const retailInfo = findBestRetailPackage(ingredient, baseAmount, baseUnit, measurementSystem);
  
  return {
    originalQuantity: quantity,
    originalUnit: unit,
    retailQuantity: retailInfo.quantity,
    retailUnit: retailInfo.unit,
    retailDescription: retailInfo.description,
    conversionNote: retailInfo.note,
    measurementSystem
  };
}

function normalizeCountBased(
  ingredient: string,
  quantity: number,
  unit: string,
  measurementSystem: MeasurementSystem
): NormalizedQuantity {
  // For produce and count-based items
  const roundedQty = Math.ceil(quantity);
  
  let description = `${roundedQty} ${ingredient}`;
  let note = undefined;
  
  // Handle fractional items
  if (quantity < 1 && quantity > 0) {
    description = `1 ${ingredient}`;
    note = `(need only ${quantity} ${unit})`;
  }
  
  return {
    originalQuantity: quantity,
    originalUnit: unit,
    retailQuantity: roundedQty,
    retailUnit: 'count',
    retailDescription: description,
    conversionNote: note,
    measurementSystem
  };
}

function findBestRetailPackage(
  ingredient: string,
  amount: number,
  unit: string,
  measurementSystem: MeasurementSystem = 'imperial'
): { quantity: number; unit: string; description: string; note?: string } {
  const RETAIL_PACKAGES = measurementSystem === 'metric' ? RETAIL_PACKAGES_METRIC : RETAIL_PACKAGES_IMPERIAL;
  
  // Look for matching retail package
  for (const [key, packageInfo] of Object.entries(RETAIL_PACKAGES)) {
    if (ingredient.includes(key)) {
      const bestSize = findClosestPackageSize(amount, packageInfo.sizes);
      const packageCount = Math.ceil(amount / bestSize);
      
      let description: string;
      
      if (measurementSystem === 'metric') {
        // Metric descriptions
        if (unit === 'ml') {
          if (bestSize >= 1000) {
            const liters = bestSize / 1000;
            description = `${packageCount} × ${liters}L container${packageCount > 1 ? 's' : ''}`;
          } else {
            description = `${packageCount} × ${bestSize}ml container${packageCount > 1 ? 's' : ''}`;
          }
        } else if (unit === 'g') {
          if (bestSize >= 1000) {
            const kg = bestSize / 1000;
            description = `${packageCount} × ${kg}kg package${packageCount > 1 ? 's' : ''}`;
          } else {
            description = `${packageCount} × ${bestSize}g package${packageCount > 1 ? 's' : ''}`;
          }
        } else {
          description = `${packageCount} × ${bestSize} ${unit}`;
        }
      } else {
        // Imperial descriptions
        if (unit === 'fl oz') {
          // Convert to common liquid measurements
          if (bestSize === 128) {
            description = `${packageCount} gallon${packageCount > 1 ? 's' : ''}`;
          } else if (bestSize === 64) {
            description = `${packageCount} half gallon${packageCount > 1 ? 's' : ''}`;
          } else if (bestSize === 32) {
            description = `${packageCount} quart${packageCount > 1 ? 's' : ''}`;
          } else {
            description = `${packageCount} × ${bestSize} fl oz container${packageCount > 1 ? 's' : ''}`;
          }
        } else {
          // Weight-based
          const lbs = bestSize / 16;
          if (lbs >= 1 && lbs % 1 === 0) {
            description = `${packageCount} × ${lbs} lb package${packageCount > 1 ? 's' : ''}`;
          } else {
            description = `${packageCount} × ${bestSize} oz package${packageCount > 1 ? 's' : ''}`;
          }
        }
      }
      
      return {
        quantity: packageCount,
        unit: 'package',
        description,
        note: packageCount > 1 ? `Total: ${(packageCount * bestSize).toFixed(1)} ${unit}` : undefined
      };
    }
  }
  
  // Default: round up to nearest logical amount
  const roundedAmount = Math.ceil(amount);
  return {
    quantity: 1,
    unit: unit,
    description: `${roundedAmount} ${unit}`,
  };
}

function findClosestPackageSize(needed: number, sizes: number[]): number {
  // Find the smallest package that meets or exceeds the need
  for (const size of sizes.sort((a, b) => a - b)) {
    if (size >= needed) return size;
  }
  // If need exceeds largest package, return largest
  return sizes[sizes.length - 1];
}

function isLiquidIngredient(ingredient: string): boolean {
  const liquidKeywords = [
    'milk', 'cream', 'juice', 'water', 'broth', 'stock', 
    'oil', 'vinegar', 'sauce', 'wine', 'beer', 'soda',
    'coffee', 'tea', 'syrup', 'honey', 'soy sauce', 'tamari',
    'sesame oil', 'olive oil', 'lemon juice', 'lime juice', 'orange juice'
  ];
  return liquidKeywords.some(keyword => ingredient.includes(keyword));
}

function isDryGoods(ingredient: string): boolean {
  const dryKeywords = [
    'flour', 'sugar', 'rice', 'pasta', 'oats', 'cereal',
    'beans', 'lentils', 'quinoa', 'salt', 'spice'
  ];
  return dryKeywords.some(keyword => ingredient.includes(keyword));
}

function isCountBasedItem(ingredient: string): boolean {
  const countKeywords = [
    'apple', 'orange', 'banana', 'lemon', 'lime', 'tomato',
    'potato', 'onion', 'garlic', 'egg', 'avocado', 'pepper',
    'carrot', 'cucumber', 'zucchini'
  ];
  return countKeywords.some(keyword => ingredient.includes(keyword));
}

/**
 * Format retail description for display
 */
export function formatRetailQuantity(normalized: NormalizedQuantity): string {
  if (normalized.conversionNote) {
    return `${normalized.retailDescription} ${normalized.conversionNote}`;
  }
  return normalized.retailDescription;
}

/**
 * Get shopping API compatible format (for Amazon Fresh, Instacart, etc.)
 */
export function getAPICompatibleFormat(normalized: NormalizedQuantity, ingredient: string) {
  return {
    productName: ingredient,
    quantity: normalized.retailQuantity,
    unit: normalized.retailUnit,
    searchQuery: `${ingredient} ${normalized.retailDescription}`,
    originalMeasurement: `${normalized.originalQuantity} ${normalized.originalUnit}`
  };
}
