import { DefenseSystem } from '@/types';

interface MealPlanSuggestion {
  category: string;
  suggestions: string[];
}

/**
 * Get smart suggestions for meal plan configuration
 */
export function getMealPlanSuggestions(
  focusSystems: DefenseSystem[],
  duration: number,
  servings: number,
  currentRestrictions: string[]
): MealPlanSuggestion[] {
  const suggestions: MealPlanSuggestion[] = [];

  // Duration suggestions
  if (duration === 1) {
    suggestions.push({
      category: 'Duration',
      suggestions: [
        'Consider a 2-week plan for better variety',
        'Longer plans help establish healthy habits',
        '4-week plans offer complete nutritional balance'
      ]
    });
  }

  // Servings suggestions
  if (servings === 1) {
    suggestions.push({
      category: 'Servings',
      suggestions: [
        'Tip: Batch cooking saves time and energy',
        'Consider meal prep portions for efficiency'
      ]
    });
  } else if (servings >= 6) {
    suggestions.push({
      category: 'Servings',
      suggestions: [
        'Large batch recipes perfect for families',
        'Consider freezer-friendly meals for convenience'
      ]
    });
  }

  // Defense system suggestions
  if (focusSystems.length === 0) {
    suggestions.push({
      category: 'Defense Systems',
      suggestions: [
        'Select 2-3 systems for balanced nutrition',
        'IMMUNITY + REGENERATION work well together',
        'DNA_PROTECTION + MICROBIOME support gut health'
      ]
    });
  } else if (focusSystems.length === 1) {
    const system = focusSystems[0];
    const complementarySystems: Record<DefenseSystem, string[]> = {
      ANGIOGENESIS: ['REGENERATION', 'DNA_PROTECTION'],
      DNA_PROTECTION: ['MICROBIOME', 'IMMUNITY'],
      IMMUNITY: ['MICROBIOME', 'REGENERATION'],
      MICROBIOME: ['IMMUNITY', 'DNA_PROTECTION'],
      REGENERATION: ['ANGIOGENESIS', 'IMMUNITY']
    };

    suggestions.push({
      category: 'System Combinations',
      suggestions: [
        `Add ${complementarySystems[system][0]} for better balance`,
        `${complementarySystems[system][1]} complements ${system} well`,
        'Multiple systems ensure varied nutrients'
      ]
    });
  }

  // Dietary restriction suggestions
  const commonPairings: Record<string, string[]> = {
    'vegetarian': ['high-protein foods like legumes, tofu, tempeh'],
    'vegan': ['B12-rich foods, iron sources, complete proteins'],
    'gluten-free': ['alternative grains like quinoa, rice, buckwheat'],
    'dairy-free': ['calcium-rich alternatives like fortified plant milks'],
    'keto': ['healthy fats from avocado, nuts, olive oil'],
    'low-carb': ['protein-rich meals with non-starchy vegetables'],
    'paleo': ['whole foods, grass-fed meats, wild-caught fish']
  };

  currentRestrictions.forEach(restriction => {
    if (commonPairings[restriction]) {
      suggestions.push({
        category: `${restriction.charAt(0).toUpperCase() + restriction.slice(1)} Tips`,
        suggestions: commonPairings[restriction]
      });
    }
  });

  // General optimization tips based on configuration
  const optimizationTips: string[] = [];

  if (focusSystems.length >= 2 && currentRestrictions.length > 0) {
    optimizationTips.push('Great! Your configuration is well-balanced');
  }

  if (duration >= 2 && servings >= 2) {
    optimizationTips.push('Perfect for meal planning and batch cooking');
  }

  if (focusSystems.includes('IMMUNITY' as DefenseSystem) && focusSystems.includes('MICROBIOME' as DefenseSystem)) {
    optimizationTips.push('Excellent combination for gut and immune health');
  }

  if (optimizationTips.length > 0) {
    suggestions.push({
      category: 'Optimization',
      suggestions: optimizationTips
    });
  }

  return suggestions;
}

/**
 * Get example meal plan titles based on configuration
 */
export function getSuggestedTitles(
  focusSystems: DefenseSystem[],
  duration: number,
  dietaryRestrictions: string[]
): string[] {
  const titles: string[] = [];
  
  // System-based titles
  if (focusSystems.length > 0) {
    const systemNames = focusSystems.map(s => {
      switch(s) {
        case 'IMMUNITY': return 'Immune-Boosting';
        case 'MICROBIOME': return 'Gut-Healthy';
        case 'DNA_PROTECTION': return 'Cell-Protecting';
        case 'REGENERATION': return 'Recovery';
        case 'ANGIOGENESIS': return 'Circulation-Enhancing';
      }
    });
    
    if (systemNames.length === 1) {
      titles.push(`${systemNames[0]} ${duration}-Week Plan`);
      titles.push(`My ${systemNames[0]} Journey`);
    } else if (systemNames.length >= 2) {
      titles.push(`${systemNames[0]} & ${systemNames[1]} Plan`);
      titles.push(`Balanced Health ${duration}-Week Plan`);
    }
  }

  // Restriction-based titles
  if (dietaryRestrictions.includes('vegan')) {
    titles.push(`Plant-Powered ${duration}-Week Plan`);
    titles.push('Vegan Wellness Journey');
  } else if (dietaryRestrictions.includes('vegetarian')) {
    titles.push(`Vegetarian ${duration}-Week Plan`);
  }

  if (dietaryRestrictions.includes('keto')) {
    titles.push(`Keto ${duration}-Week Plan`);
    titles.push('Low-Carb Lifestyle Plan');
  }

  if (dietaryRestrictions.includes('paleo')) {
    titles.push(`Paleo ${duration}-Week Plan`);
    titles.push('Whole Foods Journey');
  }

  // Duration-based titles
  if (duration === 4) {
    titles.push('Monthly Meal Plan');
    titles.push('30-Day Health Reset');
  } else if (duration === 2) {
    titles.push('2-Week Wellness Plan');
  }

  // Generic titles
  titles.push(`${duration}-Week Meal Plan`);
  titles.push('My Personalized Plan');
  titles.push('Healthy Eating Journey');

  // Return unique titles
  return [...new Set(titles)].slice(0, 5);
}
