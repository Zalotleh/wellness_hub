/**
 * Food Matcher Utility
 * 
 * Matches recipe ingredients to the food database
 * and extracts defense system benefits
 */

import { DefenseSystem, BenefitStrength, PrismaClient } from '@prisma/client';
import type { RecipeWithRelations } from '@/types';

const prisma = new PrismaClient();

export interface FoodSystemBenefit {
  system: DefenseSystem;
  strength: BenefitStrength;
}

export interface FoodWithSystems {
  name: string;
  systems: FoodSystemBenefit[];
}

export interface IngredientMatch {
  ingredientName: string;
  matchedFood: string | null;
  defenseSystems: FoodSystemBenefit[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

/**
 * Extract defense system benefits from recipe ingredients
 */
export async function extractRecipeSystemBenefits(
  recipe: RecipeWithRelations | { ingredients: any[]; defenseSystems: DefenseSystem[] }
): Promise<FoodWithSystems[]> {
  const ingredients = recipe.ingredients as Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;

  // Load food database
  const foodDatabase = await prisma.foodDatabase.findMany();

  const foodsWithSystems: FoodWithSystems[] = [];

  for (const ingredient of ingredients) {
    const match = await matchIngredientToFood(ingredient.name, foodDatabase);

    if (match.matchedFood && match.defenseSystems.length > 0) {
      foodsWithSystems.push({
        name: ingredient.name,
        systems: match.defenseSystems,
      });
    } else {
      // If not in database, use recipe's defenseSystems as fallback
      // Distribute equally across recipe's tagged systems
      const systems = recipe.defenseSystems.map(system => ({
        system,
        strength: BenefitStrength.MEDIUM,
      }));

      if (systems.length > 0) {
        foodsWithSystems.push({
          name: ingredient.name,
          systems,
        });
      }
    }
  }

  return foodsWithSystems;
}

/**
 * Match an ingredient name to the food database
 */
export async function matchIngredientToFood(
  ingredientName: string,
  foodDatabase?: Array<{
    id: string;
    name: string;
    category: string;
    defenseSystems: DefenseSystem[];
    systemBenefits: any;
    nutrients: string[];
  }>
): Promise<IngredientMatch> {
  // Load database if not provided
  if (!foodDatabase) {
    foodDatabase = await prisma.foodDatabase.findMany();
  }

  const normalizedIngredient = ingredientName.toLowerCase().trim();

  // Try exact match first
  let matchedFood = foodDatabase.find(
    food => food.name.toLowerCase() === normalizedIngredient
  );

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = matchedFood ? 'HIGH' : 'NONE';

  // Try partial match (ingredient contains food name or vice versa)
  if (!matchedFood) {
    matchedFood = foodDatabase.find(
      food =>
        normalizedIngredient.includes(food.name.toLowerCase()) ||
        food.name.toLowerCase().includes(normalizedIngredient)
    );

    if (matchedFood) {
      confidence = 'MEDIUM';
    }
  }

  // Try fuzzy match for common variations
  if (!matchedFood) {
    const fuzzyResult = findFuzzyMatch(normalizedIngredient, foodDatabase);
    if (fuzzyResult) {
      // Convert fuzzy match result to full food object structure
      matchedFood = {
        id: '',
        name: fuzzyResult.name,
        category: fuzzyResult.category,
        defenseSystems: [],
        systemBenefits: {},
        nutrients: [],
      };
      confidence = 'LOW';
    }
  }

  // Extract defense systems from matched food
  const defenseSystems: FoodSystemBenefit[] = matchedFood
    ? extractDefenseSystemsFromFood(matchedFood)
    : [];

  return {
    ingredientName,
    matchedFood: matchedFood?.name || null,
    defenseSystems,
    confidence,
  };
}

/**
 * Find fuzzy match for ingredient
 */
function findFuzzyMatch(
  ingredient: string,
  foodDatabase: Array<{
    name: string;
    category: string;
  }>
): typeof foodDatabase[0] | undefined {
  // Common variations and plurals
  const variations = [
    ingredient.replace(/s$/, ''), // Remove plural 's'
    ingredient.replace(/ies$/, 'y'), // berries -> berry
    ingredient.replace(/es$/, ''), // tomatoes -> tomato
    ingredient + 's', // Add plural
  ];

  for (const variation of variations) {
    const match = foodDatabase.find(
      food =>
        food.name.toLowerCase() === variation ||
        variation.includes(food.name.toLowerCase())
    );
    if (match) return match;
  }

  return undefined;
}

/**
 * Extract defense systems from food database entry
 */
function extractDefenseSystemsFromFood(food: {
  systemBenefits: any;
  defenseSystems: DefenseSystem[];
}): FoodSystemBenefit[] {
  const systemBenefits = food.systemBenefits as Record<string, string>;

  return Object.entries(systemBenefits).map(([system, strength]) => ({
    system: system as DefenseSystem,
    strength: strength as BenefitStrength,
  }));
}

/**
 * Batch match multiple ingredients
 */
export async function batchMatchIngredients(
  ingredients: string[]
): Promise<IngredientMatch[]> {
  const foodDatabase = await prisma.foodDatabase.findMany();

  return Promise.all(
    ingredients.map(ingredient =>
      matchIngredientToFood(ingredient, foodDatabase)
    )
  );
}

/**
 * Get multi-system foods from a list of foods
 */
export async function getMultiSystemFoods(
  foodNames: string[],
  minSystems: number = 3
): Promise<
  Array<{
    name: string;
    systems: DefenseSystem[];
    systemCount: number;
  }>
> {
  const foodDatabase = await prisma.foodDatabase.findMany({
    where: {
      name: {
        in: foodNames,
      },
    },
  });

  return foodDatabase
    .filter(food => food.defenseSystems.length >= minSystems)
    .map(food => ({
      name: food.name,
      systems: food.defenseSystems,
      systemCount: food.defenseSystems.length,
    }))
    .sort((a, b) => b.systemCount - a.systemCount);
}

/**
 * Find foods that benefit multiple target systems
 */
export async function findMultiSystemFoods(
  primarySystem: DefenseSystem,
  otherSystems: DefenseSystem[]
): Promise<Array<{ name: string; systems: DefenseSystem[] }>> {
  const foodDatabase = await prisma.foodDatabase.findMany({
    where: {
      defenseSystems: {
        has: primarySystem,
      },
    },
  });

  return foodDatabase
    .map(food => ({
      name: food.name,
      systems: food.defenseSystems,
    }))
    .sort((a, b) => {
      // Sort by how many target systems each food supports
      const aScore = a.systems.filter(s => otherSystems.includes(s)).length;
      const bScore = b.systems.filter(s => otherSystems.includes(s)).length;
      return bScore - aScore;
    });
}

/**
 * Get food recommendations based on missing systems
 */
export async function recommendFoods(
  missingSystems: DefenseSystem[],
  excludeFoods: string[] = [],
  limit: number = 10
): Promise<
  Array<{
    name: string;
    category: string;
    systems: DefenseSystem[];
    systemCount: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>
> {
  if (missingSystems.length === 0) return [];

  const foods = await prisma.foodDatabase.findMany({
    where: {
      AND: [
        {
          defenseSystems: {
            hasSome: missingSystems,
          },
        },
        {
          name: {
            notIn: excludeFoods,
          },
        },
      ],
    },
  });

  return foods
    .map(food => {
      const matchingSystemsCount = food.defenseSystems.filter(s =>
        missingSystems.includes(s)
      ).length;

      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (matchingSystemsCount >= 3) priority = 'HIGH';
      else if (matchingSystemsCount >= 2) priority = 'MEDIUM';

      return {
        name: food.name,
        category: food.category,
        systems: food.defenseSystems,
        systemCount: matchingSystemsCount,
        priority,
      };
    })
    .sort((a, b) => {
      // Sort by priority and system count
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.systemCount - a.systemCount;
    })
    .slice(0, limit);
}
