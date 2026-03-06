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
 * Build a per-ingredient defense-system map from the food database.
 *
 * This is stored as `Recipe.ingredientSystemMap` at save time so that
 * tracking can resolve multi-system benefits even when an ingredient is
 * not matched on the fly.
 *
 * Shape: { "blueberries": { "ANGIOGENESIS": "HIGH", "DNA_PROTECTION": "HIGH" }, ... }
 * Ingredients with no database match are omitted from the map (they will fall
 * back to recipe-level systems with LOW strength at tracking time).
 */
export async function buildIngredientSystemMap(
  ingredients: Array<{ name: string }>,
  foodDatabase?: Array<{
    id: string;
    name: string;
    category: string;
    defenseSystems: DefenseSystem[];
    systemBenefits: any;
    nutrients: string[];
  }>
): Promise<Record<string, Record<string, string>>> {
  if (!foodDatabase) {
    foodDatabase = await prisma.foodDatabase.findMany();
  }

  const map: Record<string, Record<string, string>> = {};

  for (const ingredient of ingredients) {
    const match = await matchIngredientToFood(ingredient.name, foodDatabase);

    if (match.matchedFood && match.defenseSystems.length > 0) {
      map[ingredient.name] = Object.fromEntries(
        match.defenseSystems.map((ds) => [ds.system, ds.strength])
      );
    }
    // No entry for unmatched ingredients – they fall back to recipe-level systems
    // at tracking time (with LOW strength to avoid over-crediting).
  }

  return map;
}

/**
 * Find an ingredient entry in the map using case-insensitive / partial matching.
 */
function findIngredientInMap(
  ingredientName: string,
  map: Record<string, Record<string, string>>
): Record<string, string> | undefined {
  const normalized = ingredientName.toLowerCase().trim();

  // 1. Case-insensitive exact match
  for (const key of Object.keys(map)) {
    if (key.toLowerCase() === normalized) return map[key];
  }

  // 2. Ingredient name contains map key or vice-versa (e.g. "fresh blueberries" → "blueberries")
  for (const key of Object.keys(map)) {
    const k = key.toLowerCase();
    if (normalized.includes(k) || k.includes(normalized)) return map[key];
  }

  return undefined;
}

/**
 * Extract defense system benefits from recipe ingredients.
 *
 * Resolution priority (per ingredient):
 *   1. Food database match  → full multi-system benefits from `systemBenefits`
 *   2. `ingredientSystemMap` → pre-computed per-ingredient map (stored on recipe)
 *   3. Recipe-level fallback → recipe's `defenseSystems[]` with LOW strength
 *
 * Using LOW strength for the fallback prevents neutral ingredients (salt,
 * water, cooking oil, spices) from artificially boosting defence-system
 * counts the way the old MEDIUM blanket assignment did.
 */
export async function extractRecipeSystemBenefits(
  recipe: RecipeWithRelations | {
    ingredients: any[];
    defenseSystems: DefenseSystem[];
    ingredientSystemMap?: any; // Record<string, Record<string, string>> | null
  }
): Promise<FoodWithSystems[]> {
  const ingredients = recipe.ingredients as Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;

  // Per-ingredient map stored on the recipe (may be null for older recipes)
  const storedMap = (recipe as any).ingredientSystemMap as
    | Record<string, Record<string, string>>
    | null
    | undefined;

  // Load food database once
  const foodDatabase = await prisma.foodDatabase.findMany();

  const foodsWithSystems: FoodWithSystems[] = [];

  for (const ingredient of ingredients) {
    // ── Layer 1: Food database lookup (most authoritative – full multi-system) ──
    const match = await matchIngredientToFood(ingredient.name, foodDatabase);

    if (match.matchedFood && match.defenseSystems.length > 0) {
      foodsWithSystems.push({
        name: ingredient.name,
        systems: match.defenseSystems,
      });
      continue;
    }

    // ── Layer 2: Pre-computed ingredientSystemMap (handles cross-system foods
    //            that may be phrased differently from DB entries) ──────────────
    if (storedMap) {
      const mapEntry =
        storedMap[ingredient.name] ??
        findIngredientInMap(ingredient.name, storedMap);

      if (mapEntry && Object.keys(mapEntry).length > 0) {
        const systems = Object.entries(mapEntry).map(([system, strength]) => ({
          system: system as DefenseSystem,
          strength: strength as BenefitStrength,
        }));
        foodsWithSystems.push({ name: ingredient.name, systems });
        continue;
      }
    }

    // ── Layer 3: Recipe-level fallback – use LOW strength to signal uncertainty.
    //    This avoids neutral ingredients (salt, water, spices) being counted at
    //    the same weight as genuine superfood contributors. ────────────────────
    const fallbackSystems = recipe.defenseSystems.map((system) => ({
      system,
      strength: BenefitStrength.LOW,
    }));

    if (fallbackSystems.length > 0) {
      foodsWithSystems.push({
        name: ingredient.name,
        systems: fallbackSystems,
      });
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
