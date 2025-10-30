// Debug script to check limits
const { FEATURE_LIMITS } = require('./lib/features/feature-flags.ts');

console.log('Feature limits configuration:');
console.log('meal_plans_per_month:', FEATURE_LIMITS.meal_plans_per_month);
console.log('ai_questions_per_month:', FEATURE_LIMITS.ai_questions_per_month);

// Simulate a FREE user
const tier = 'FREE';
const isTrialing = true;

console.log('\nFor FREE user with trial:');
console.log('Tier:', tier);
console.log('Is trialing:', isTrialing);

// Check what limit would be returned
const mealPlanLimit = FEATURE_LIMITS.meal_plans_per_month;
const aiLimit = FEATURE_LIMITS.ai_questions_per_month;

console.log('\nWith old logic (trialing gives premium):');
console.log('Meal plan limit:', isTrialing ? mealPlanLimit.premium : mealPlanLimit[tier.toLowerCase()]);
console.log('AI limit:', isTrialing ? aiLimit.premium : aiLimit[tier.toLowerCase()]);

console.log('\nWith new logic (always use tier):');
console.log('Meal plan limit:', mealPlanLimit[tier.toLowerCase()]);
console.log('AI limit:', aiLimit[tier.toLowerCase()]);