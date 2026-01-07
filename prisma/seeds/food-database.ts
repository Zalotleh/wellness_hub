/**
 * Food Database Seed Data
 * 
 * This file contains the master food database with multi-system categorization.
 * Each food can support multiple defense systems with different strength levels.
 * 
 * Based on Dr. William Li's research on the 5 Defense Systems.
 */

import { DefenseSystem } from '@prisma/client';

export type FoodCategory = 
  | 'Fruits'
  | 'Vegetables'
  | 'Proteins'
  | 'Grains'
  | 'Dairy'
  | 'Nuts & Seeds'
  | 'Legumes'
  | 'Beverages'
  | 'Oils & Fats'
  | 'Herbs & Spices'
  | 'Fermented Foods'
  | 'Seafood'
  | 'Other';

export interface FoodDatabaseEntry {
  name: string;
  category: FoodCategory;
  defenseSystems: DefenseSystem[];
  systemBenefits: Partial<Record<DefenseSystem, 'LOW' | 'MEDIUM' | 'HIGH'>>;
  nutrients: string[];
  description?: string;
}

/**
 * Master food database with multi-system categorization
 * Foods are categorized based on their primary and secondary benefits
 */
export const FOOD_DATABASE: FoodDatabaseEntry[] = [
  // ==========================================
  // FRUITS & BERRIES
  // ==========================================
  
  // Multi-system superfoods
  {
    name: 'Blueberries',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Anthocyanins', 'Vitamin C', 'Polyphenols', 'Fiber'],
    description: 'Powerful antioxidant berry supporting multiple defense systems'
  },
  {
    name: 'Strawberries',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Vitamin C', 'Ellagic Acid', 'Anthocyanins'],
  },
  {
    name: 'Raspberries',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Ellagic Acid', 'Vitamin C', 'Fiber'],
  },
  {
    name: 'Blackberries',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Anthocyanins', 'Vitamin C', 'Fiber'],
  },
  {
    name: 'Cranberries',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Proanthocyanidins', 'Vitamin C'],
  },
  {
    name: 'Pomegranate',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Ellagic Acid', 'Punicalagin', 'Vitamin C'],
  },
  {
    name: 'Oranges',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Vitamin C', 'Hesperidin', 'Fiber'],
  },
  {
    name: 'Apples',
    category: 'Fruits',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Quercetin', 'Pectin', 'Vitamin C'],
  },
  {
    name: 'Tomatoes',
    category: 'Vegetables', // Technically a fruit, but commonly used as vegetable
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Lycopene', 'Vitamin C', 'Beta-Carotene'],
  },

  // ==========================================
  // LEAFY GREENS & VEGETABLES
  // ==========================================
  
  {
    name: 'Kale',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Sulforaphane', 'Vitamin K', 'Vitamin C', 'Beta-Carotene'],
  },
  {
    name: 'Spinach',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Lutein', 'Folate', 'Iron', 'Vitamin K'],
  },
  {
    name: 'Broccoli',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Sulforaphane', 'Vitamin C', 'Folate'],
  },
  {
    name: 'Brussels Sprouts',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Sulforaphane', 'Vitamin K', 'Vitamin C'],
  },
  {
    name: 'Cauliflower',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Sulforaphane', 'Vitamin C', 'Choline'],
  },
  {
    name: 'Garlic',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Allicin', 'Selenium', 'Vitamin C'],
  },
  {
    name: 'Onions',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Quercetin', 'Inulin', 'Vitamin C'],
  },

  // ==========================================
  // SEAFOOD & FISH
  // ==========================================
  
  {
    name: 'Wild Salmon',
    category: 'Seafood',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Omega-3 (EPA/DHA)', 'Vitamin D', 'Astaxanthin', 'Protein'],
  },
  {
    name: 'Sardines',
    category: 'Seafood',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Omega-3', 'Calcium', 'Vitamin D'],
  },
  {
    name: 'Mackerel',
    category: 'Seafood',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
    },
    nutrients: ['Omega-3', 'Vitamin D', 'Selenium'],
  },

  // ==========================================
  // NUTS & SEEDS
  // ==========================================
  
  {
    name: 'Walnuts',
    category: 'Nuts & Seeds',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.MICROBIOME],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
    },
    nutrients: ['Omega-3 (ALA)', 'Polyphenols', 'Fiber'],
  },
  {
    name: 'Almonds',
    category: 'Nuts & Seeds',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Vitamin E', 'Fiber', 'Magnesium'],
  },
  {
    name: 'Chia Seeds',
    category: 'Nuts & Seeds',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'HIGH',
    },
    nutrients: ['Omega-3 (ALA)', 'Fiber', 'Protein'],
  },
  {
    name: 'Flaxseeds',
    category: 'Nuts & Seeds',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'HIGH',
    },
    nutrients: ['Omega-3 (ALA)', 'Lignans', 'Fiber'],
  },

  // ==========================================
  // FERMENTED FOODS
  // ==========================================
  
  {
    name: 'Kimchi',
    category: 'Fermented Foods',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Probiotics', 'Vitamin K2', 'Fiber'],
  },
  {
    name: 'Sauerkraut',
    category: 'Fermented Foods',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Probiotics', 'Vitamin C', 'Fiber'],
  },
  {
    name: 'Yogurt',
    category: 'Dairy',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Probiotics', 'Calcium', 'Protein'],
  },
  {
    name: 'Kefir',
    category: 'Dairy',
    defenseSystems: [DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Probiotics', 'Calcium', 'Protein'],
  },

  // ==========================================
  // LEGUMES
  // ==========================================
  
  {
    name: 'Chickpeas',
    category: 'Legumes',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Fiber', 'Protein', 'Folate'],
  },
  {
    name: 'Lentils',
    category: 'Legumes',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Fiber', 'Protein', 'Folate', 'Iron'],
  },
  {
    name: 'Black Beans',
    category: 'Legumes',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.MICROBIOME, DefenseSystem.DNA_PROTECTION],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'HIGH',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
    },
    nutrients: ['Anthocyanins', 'Fiber', 'Protein'],
  },

  // ==========================================
  // BEVERAGES
  // ==========================================
  
  {
    name: 'Green Tea',
    category: 'Beverages',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['EGCG', 'Catechins', 'L-Theanine'],
  },
  {
    name: 'Black Tea',
    category: 'Beverages',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
    },
    nutrients: ['Theaflavins', 'Catechins', 'Polyphenols'],
  },
  {
    name: 'Coffee',
    category: 'Beverages',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
    },
    nutrients: ['Chlorogenic Acid', 'Cafestol', 'Polyphenols'],
  },

  // ==========================================
  // OILS & FATS
  // ==========================================
  
  {
    name: 'Extra Virgin Olive Oil',
    category: 'Oils & Fats',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Hydroxytyrosol', 'Oleic Acid', 'Polyphenols'],
  },

  // ==========================================
  // OTHER SUPERFOODS
  // ==========================================
  
  {
    name: 'Dark Chocolate',
    category: 'Other',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.REGENERATION, DefenseSystem.MICROBIOME, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'HIGH',
      [DefenseSystem.REGENERATION]: 'HIGH',
      [DefenseSystem.MICROBIOME]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Flavonoids', 'Epicatechin', 'Magnesium'],
    description: '>70% cacao content recommended',
  },
  {
    name: 'Mushrooms',
    category: 'Vegetables',
    defenseSystems: [DefenseSystem.ANGIOGENESIS, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.ANGIOGENESIS]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'MEDIUM',
      [DefenseSystem.IMMUNITY]: 'HIGH',
    },
    nutrients: ['Beta-Glucans', 'Ergothioneine', 'Vitamin D'],
  },
  {
    name: 'Turmeric',
    category: 'Herbs & Spices',
    defenseSystems: [DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION, DefenseSystem.IMMUNITY],
    systemBenefits: {
      [DefenseSystem.REGENERATION]: 'MEDIUM',
      [DefenseSystem.DNA_PROTECTION]: 'HIGH',
      [DefenseSystem.IMMUNITY]: 'MEDIUM',
    },
    nutrients: ['Curcumin', 'Turmerone'],
  },

  // Add more foods as needed...
  // This is a starter set of ~50 foods. You can expand to 300+ using the DEFENSE_SYSTEMS data
];

/**
 * Get all foods that support a specific defense system
 */
export function getFoodsBySystem(system: DefenseSystem): FoodDatabaseEntry[] {
  return FOOD_DATABASE.filter(food => food.defenseSystems.includes(system));
}

/**
 * Get foods that support multiple systems (multi-system superfoods)
 */
export function getMultiSystemFoods(minSystems: number = 3): FoodDatabaseEntry[] {
  return FOOD_DATABASE.filter(food => food.defenseSystems.length >= minSystems);
}

/**
 * Search foods by name (fuzzy matching)
 */
export function searchFoods(query: string): FoodDatabaseEntry[] {
  const lowerQuery = query.toLowerCase();
  return FOOD_DATABASE.filter(food => 
    food.name.toLowerCase().includes(lowerQuery) ||
    food.category.toLowerCase().includes(lowerQuery)
  );
}
