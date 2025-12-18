import { DefenseSystem } from '@/types';

export interface IngredientSuggestion {
  name: string;
  category: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'fat' | 'herb' | 'spice';
  systems: DefenseSystem[];
  benefits: string[];
}

export const INGREDIENT_SUGGESTIONS: IngredientSuggestion[] = [
  // Immunity System
  {
    name: 'Ginger',
    category: 'spice',
    systems: [DefenseSystem.IMMUNITY],
    benefits: ['Anti-inflammatory', 'Supports immune function', 'Aids digestion'],
  },
  {
    name: 'Turmeric',
    category: 'spice',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.DNA_PROTECTION],
    benefits: ['Powerful anti-inflammatory', 'Antioxidant properties', 'Supports liver health'],
  },
  {
    name: 'Garlic',
    category: 'vegetable',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.ANGIOGENESIS],
    benefits: ['Natural antibiotic', 'Boosts immune system', 'Supports heart health'],
  },
  {
    name: 'Citrus fruits',
    category: 'fruit',
    systems: [DefenseSystem.IMMUNITY],
    benefits: ['High in vitamin C', 'Antioxidants', 'Supports immune function'],
  },
  {
    name: 'Spinach',
    category: 'vegetable',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.MICROBIOME],
    benefits: ['Rich in vitamins', 'Contains iron', 'Supports overall health'],
  },

  // Angiogenesis System (Cardiovascular)
  {
    name: 'Salmon',
    category: 'protein',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION],
    benefits: ['Omega-3 fatty acids', 'Supports heart health', 'Brain function'],
  },
  {
    name: 'Oats',
    category: 'grain',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME],
    benefits: ['Lowers cholesterol', 'High in fiber', 'Heart-healthy'],
  },
  {
    name: 'Walnuts',
    category: 'fat',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION],
    benefits: ['Omega-3s', 'Reduces inflammation', 'Brain health'],
  },
  {
    name: 'Avocado',
    category: 'fat',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION],
    benefits: ['Healthy fats', 'Potassium', 'Supports heart health'],
  },
  {
    name: 'Berries',
    category: 'fruit',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION],
    benefits: ['Antioxidants', 'Anti-inflammatory', 'Heart protective'],
  },

  // DNA Protection System (Neurological)
  {
    name: 'Dark chocolate',
    category: 'fat',
    systems: [DefenseSystem.DNA_PROTECTION],
    benefits: ['Flavonoids', 'Improves cognitive function', 'Mood booster'],
  },
  {
    name: 'Blueberries',
    category: 'fruit',
    systems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    benefits: ['Brain health', 'Memory support', 'Antioxidants'],
  },
  {
    name: 'Green tea',
    category: 'herb',
    systems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    benefits: ['L-theanine', 'Cognitive function', 'Antioxidants'],
  },
  {
    name: 'Eggs',
    category: 'protein',
    systems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.REGENERATION],
    benefits: ['Choline', 'Brain development', 'Cognitive health'],
  },

  // Microbiome System (Digestive)
  {
    name: 'Yogurt',
    category: 'dairy',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    benefits: ['Probiotics', 'Gut health', 'Immune support'],
  },
  {
    name: 'Kefir',
    category: 'dairy',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    benefits: ['High in probiotics', 'Digestive health', 'Nutrient-rich'],
  },
  {
    name: 'Sweet potato',
    category: 'vegetable',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    benefits: ['Fiber', 'Vitamins', 'Gut-friendly'],
  },
  {
    name: 'Banana',
    category: 'fruit',
    systems: [DefenseSystem.MICROBIOME],
    benefits: ['Prebiotic fiber', 'Easy to digest', 'Potassium'],
  },
  {
    name: 'Sauerkraut',
    category: 'vegetable',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    benefits: ['Fermented', 'Probiotics', 'Gut health'],
  },

  // Regeneration System
  {
    name: 'Cruciferous vegetables',
    category: 'vegetable',
    systems: [DefenseSystem.REGENERATION, DefenseSystem.IMMUNITY],
    benefits: ['Stem cell support', 'Tissue regeneration', 'Cancer-fighting'],
  },
  {
    name: 'Beets',
    category: 'vegetable',
    systems: [DefenseSystem.REGENERATION, DefenseSystem.ANGIOGENESIS],
    benefits: ['Nitric oxide production', 'Blood pressure support', 'Nutrient-rich'],
  },
  {
    name: 'Lemon',
    category: 'fruit',
    systems: [DefenseSystem.REGENERATION, DefenseSystem.IMMUNITY],
    benefits: ['Cellular health', 'Alkalizing', 'Vitamin C'],
  },
  {
    name: 'Dandelion greens',
    category: 'vegetable',
    systems: [DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME],
    benefits: ['Cellular regeneration', 'Diuretic', 'Digestive aid'],
  },

  // Common herbs and spices
  {
    name: 'Oregano',
    category: 'herb',
    systems: [DefenseSystem.IMMUNITY],
    benefits: ['Antimicrobial', 'Antioxidants', 'Immune support'],
  },
  {
    name: 'Basil',
    category: 'herb',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.MICROBIOME],
    benefits: ['Anti-inflammatory', 'Digestive aid', 'Nutrient-rich'],
  },
  {
    name: 'Cinnamon',
    category: 'spice',
    systems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME],
    benefits: ['Blood sugar regulation', 'Anti-inflammatory', 'Heart health'],
  },
  {
    name: 'Rosemary',
    category: 'herb',
    systems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    benefits: ['Memory support', 'Antioxidants', 'Cognitive function'],
  },

  // Additional proteins
  {
    name: 'Chicken breast',
    category: 'protein',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.REGENERATION],
    benefits: ['Lean protein', 'B vitamins', 'Muscle health'],
  },
  {
    name: 'Lentils',
    category: 'protein',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.ANGIOGENESIS],
    benefits: ['Plant protein', 'Fiber', 'Iron'],
  },
  {
    name: 'Quinoa',
    category: 'grain',
    systems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    benefits: ['Complete protein', 'Fiber', 'Nutrient-dense'],
  },

  // Additional vegetables
  {
    name: 'Kale',
    category: 'vegetable',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.REGENERATION, DefenseSystem.ANGIOGENESIS],
    benefits: ['Vitamins A, C, K', 'Antioxidants', 'Heart health'],
  },
  {
    name: 'Broccoli',
    category: 'vegetable',
    systems: [DefenseSystem.REGENERATION, DefenseSystem.IMMUNITY],
    benefits: ['Sulforaphane', 'Stem cell support', 'Cancer prevention'],
  },
  {
    name: 'Carrots',
    category: 'vegetable',
    systems: [DefenseSystem.IMMUNITY, DefenseSystem.DNA_PROTECTION],
    benefits: ['Beta-carotene', 'Eye health', 'Immune support'],
  },
];

/**
 * Get ingredient suggestions based on selected defense systems
 */
export function getIngredientSuggestions(
  systems: DefenseSystem[],
  limit: number = 10
): IngredientSuggestion[] {
  if (systems.length === 0) {
    return INGREDIENT_SUGGESTIONS.slice(0, limit);
  }

  // Score each ingredient based on how many selected systems it supports
  const scored = INGREDIENT_SUGGESTIONS.map((ingredient) => {
    const matchCount = ingredient.systems.filter((s) => systems.includes(s)).length;
    return { ingredient, score: matchCount };
  });

  // Sort by score (descending) and return top results
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.ingredient);
}

/**
 * Search ingredients by name
 */
export function searchIngredients(query: string, limit: number = 10): IngredientSuggestion[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  return INGREDIENT_SUGGESTIONS.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm)
  ).slice(0, limit);
}

/**
 * Get category-specific suggestions
 */
export function getIngredientsByCategory(
  category: IngredientSuggestion['category'],
  limit: number = 10
): IngredientSuggestion[] {
  return INGREDIENT_SUGGESTIONS.filter((ingredient) => ingredient.category === category).slice(
    0,
    limit
  );
}
