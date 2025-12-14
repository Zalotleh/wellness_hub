import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { FeatureAccess, type SubscriptionTier } from '@/lib/features/feature-flags';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user with subscription info and usage counters
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        recipeGenerationsThisMonth: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscriptionTier = (user.subscriptionTier || 'FREE') as SubscriptionTier;
    const featureAccess = new FeatureAccess(subscriptionTier);

    // Check if we need to reset monthly counters
    const now = new Date();
    const lastReset = new Date(user.lastResetDate);
    const needsReset = 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear();

    let currentRecipeGenerationsCount = user.recipeGenerationsThisMonth;
    
    if (needsReset) {
      // Reset counters for new month
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          mealPlansThisMonth: 0,
          aiQuestionsThisMonth: 0,
          recipeGenerationsThisMonth: 0,
          pdfExportsThisMonth: 0,
          imageGenerationsThisMonth: 0,
          lastResetDate: now,
        },
      });
      currentRecipeGenerationsCount = 0;
    }

    // Check recipe generation limit for FREE tier users
    const recipeGenerationsLimit = featureAccess.getLimit('recipe_generations_per_month');
    
    if (typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity) {
      if (currentRecipeGenerationsCount >= recipeGenerationsLimit) {
        return NextResponse.json(
          { 
            error: 'Recipe generation limit reached',
            message: `You've reached your limit of ${recipeGenerationsLimit} recipe generations per month. Upgrade to Premium for unlimited recipe generation.`,
            limit: recipeGenerationsLimit,
            current: currentRecipeGenerationsCount,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { defenseSystem, ingredients, dietaryRestrictions, mealType, measurementSystem } = body;

    console.log('📝 Request body:', { defenseSystem, ingredients, dietaryRestrictions, mealType, measurementSystem });

    // Validate input
    if (!defenseSystem || !Object.values(DefenseSystem).includes(defenseSystem)) {
      return NextResponse.json(
        { error: 'Valid defense system is required' },
        { status: 400 }
      );
    }

    const systemInfo = DEFENSE_SYSTEMS[defenseSystem as DefenseSystem];

    // Build the AI prompt
    const prompt = buildRecipePrompt({
      defenseSystem,
      systemInfo,
      ingredients: ingredients || [],
      dietaryRestrictions: dietaryRestrictions || [],
      mealType: mealType || 'any',
      measurementSystem: measurementSystem || 'imperial',
    });

    console.log('📤 Sending prompt to Anthropic API...');

    // Call Anthropic API (Claude)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.log('⚠️ No API key found, returning mock recipe');
      return NextResponse.json({
        data: generateMockRecipe(defenseSystem, systemInfo, ingredients),
        message: 'Mock recipe generated (Anthropic API key not configured)',
      });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    console.log('📥 Anthropic response status:', anthropicResponse.status);

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      console.error('❌ Anthropic API error:', errorData);
      throw new Error(`Failed to generate recipe from Anthropic: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    console.log('✅ Anthropic response received');
    console.log('📄 Response structure:', JSON.stringify(anthropicData, null, 2));

    const recipeText = anthropicData.content[0].text;
    console.log('📖 Recipe text length:', recipeText.length);
    console.log('📖 First 200 chars:', recipeText.substring(0, 200));

    // Parse the AI response into structured data
    const parsedRecipe = parseAIRecipe(recipeText, defenseSystem);
    console.log('🍳 Parsed recipe:', JSON.stringify(parsedRecipe, null, 2));

    // Validate recipe quality before counting it as a successful generation
    const isValidRecipe = validateRecipeQuality(parsedRecipe, defenseSystem);
    
    if (!isValidRecipe.valid) {
      console.error('⚠️ Recipe failed quality validation:', isValidRecipe.reasons);
      // Don't increment counter - this generation failed
      return NextResponse.json(
        { 
          error: 'Recipe generation failed quality check',
          details: isValidRecipe.reasons,
          message: 'The AI generated an incomplete recipe. Please try again. This attempt was not counted against your limit.',
          countedAgainstLimit: false,
        },
        { status: 500 }
      );
    }

    // Only increment counter if recipe passed quality validation
    console.log('✅ Recipe passed quality validation, incrementing counter');
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        recipeGenerationsThisMonth: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      data: parsedRecipe,
      message: 'Recipe generated successfully by Claude',
      countedAgainstLimit: true,
    });
  } catch (error: any) {
    console.error('💥 Error generating recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}

// Build the prompt for AI
function buildRecipePrompt({
  defenseSystem,
  systemInfo,
  ingredients,
  dietaryRestrictions,
  mealType,
  measurementSystem = 'imperial',
}: any): string {
  const restrictionsText =
    dietaryRestrictions.length > 0
      ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}.`
      : '';

  const ingredientsText =
    ingredients.length > 0
      ? `Try to incorporate these ingredients: ${ingredients.join(', ')}.`
      : '';

  const mealTypeText = mealType !== 'any' ? `This should be a ${mealType} recipe.` : '';
  
  // Define units based on measurement system
  const volumeUnits = measurementSystem === 'metric' 
    ? 'ml, liter' 
    : 'tsp, tbsp, cup, fl oz, pint, quart, gallon';
  const weightUnits = measurementSystem === 'metric'
    ? 'g, kg'
    : 'oz, lb';
  
  const systemName = measurementSystem === 'metric' ? 'Metric' : 'Imperial';

  return `
Create a detailed, healthy recipe that supports the ${systemInfo.displayName} defense system.

${systemInfo.displayName} System Focus:
${systemInfo.description}

Key foods for this system: ${systemInfo.keyFoods.join(', ')}
Important nutrients: ${systemInfo.nutrients.join(', ')}

${ingredientsText}
${restrictionsText}
${mealTypeText}

MEASUREMENT SYSTEM: Use ${systemName} measurements (${measurementSystem === 'metric' ? 'grams, ml, liters' : 'cups, ounces, pounds'})

IMPORTANT: The recipe title MUST be specific and descriptive. DO NOT use generic titles like "${systemInfo.displayName} Recipe" or "Healthy Recipe". 
Instead, create a creative, appetizing name based on the main ingredients and cooking method.

GOOD EXAMPLES:
- "Roasted Salmon with Garlic Herb Butter and Steamed Broccoli"
- "Spicy Turmeric Chicken Stir-Fry with Brown Rice"
- "Mediterranean Quinoa Bowl with Grilled Vegetables"
- "Creamy Tomato Basil Soup with Whole Grain Crackers"

BAD EXAMPLES:
- "${systemInfo.displayName} Recipe"
- "Healthy Dinner"
- "Immunity Boost Meal"

Please provide the recipe in the following EXACT format:

TITLE: [A specific, creative recipe name that describes the dish - NOT the defense system]

DESCRIPTION: [2-3 sentences about the recipe and its health benefits for the ${systemInfo.displayName} system]

PREP_TIME: [e.g., "15 min"]

COOK_TIME: [e.g., "30 min"]

SERVINGS: [number]

INGREDIENTS:
- [amount] [ingredient name]
- [amount] [ingredient name]
[continue for all ingredients]

CRITICAL: For ingredient amounts, you MUST use ONLY these ${systemName} standardized units:
Volume: ${volumeUnits}
Weight: ${weightUnits}
Count: piece, whole, clove, slice, can, package, bunch
Special: pinch, dash, to taste, as needed

${measurementSystem === 'metric' ? `
Examples for METRIC:
- 250 ml milk (NOT "250ml" or "250 milliliters")
- 200 g flour (NOT "200grams" or "200 gram")
- 45 ml olive oil (NOT "45 milliliters")
- 5 g salt (NOT "5 grams")
- 2 piece chicken breast
` : `
Examples for IMPERIAL:
- 2 cups milk (NOT "2 c milk" or "2 cup of milk")
- 8 oz flour (NOT "8 ounces")
- 3 tbsp olive oil (NOT "3 tablespoons" or "3T")
- 1 tsp salt (NOT "1 teaspoon")
- 2 piece chicken breast (NOT "2 pieces" or "2 breasts")
`}

INSTRUCTIONS:
1. [First step]
2. [Second step]
[continue numbered steps]

NUTRIENTS:
- [nutrient name]: [amount]
- [nutrient name]: [amount]
[key nutrients that support the defense system]

Make the recipe practical, delicious, and easy to follow!
`;
}

// Validate recipe quality to ensure it has minimum required data
function validateRecipeQuality(recipe: any, defenseSystem?: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for title (should exist and not be a fallback)
  if (!recipe.title || recipe.title.trim() === '') {
    reasons.push('Missing recipe title');
  }
  
  // Check for generic or lazy titles that just use the defense system name
  if (recipe.title) {
    const titleLower = recipe.title.toLowerCase();
    const genericPatterns = [
      'recipe',
      'healthy',
      'immunity',
      'angiogenesis',
      'regeneration',
      'microbiome',
      'dna protection',
      'defense system',
      'boost',
      'support',
    ];
    
    // If title is too short and contains generic words, it's probably lazy
    const words = recipe.title.split(' ');
    if (words.length <= 3) {
      const hasGenericWord = genericPatterns.some(pattern => titleLower.includes(pattern));
      if (hasGenericWord) {
        reasons.push(`Title is too generic: "${recipe.title}". Needs specific dish name (e.g., "Roasted Salmon with Herbs")`);
      }
    }
    
    // Check if title is literally just the defense system name + "Recipe"
    if (defenseSystem) {
      const systemName = DEFENSE_SYSTEMS[defenseSystem as DefenseSystem]?.displayName || '';
      if (titleLower.includes(systemName.toLowerCase()) && titleLower.includes('recipe')) {
        reasons.push(`Title is too generic: "${recipe.title}". Should describe the actual dish, not the defense system`);
      }
    }
  }

  // Check for ingredients (minimum 3 ingredients for a real recipe)
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 3) {
    reasons.push(`Insufficient ingredients (has ${recipe.ingredients?.length || 0}, needs at least 3)`);
  }

  // Check for instructions (should have meaningful content, at least 100 chars)
  if (!recipe.instructions || recipe.instructions.trim().length < 100) {
    reasons.push(`Missing or too short cooking instructions (has ${recipe.instructions?.length || 0} chars, needs at least 100)`);
  }

  // Check if instructions is just the fallback
  if (recipe.instructions && recipe.instructions.includes('Instructions not available')) {
    reasons.push('Instructions are placeholder text, not real cooking steps');
  }

  // Check if ingredients have proper structure (name should be meaningful)
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const validIngredients = recipe.ingredients.filter((ing: any) => 
      ing.name && 
      ing.name.trim() !== '' && 
      ing.name.length > 2 &&
      !ing.name.toLowerCase().includes('ingredient') // avoid placeholder text
    );
    
    if (validIngredients.length < 3) {
      reasons.push(`Only ${validIngredients.length} ingredients with valid names (needs at least 3)`);
    }
  }

  const valid = reasons.length === 0;
  
  if (!valid) {
    console.log('❌ Recipe validation failed:', reasons);
  } else {
    console.log('✅ Recipe validation passed');
  }

  return { valid, reasons };
}

// Parse AI response into structured format
function parseAIRecipe(recipeText: string, defenseSystem: DefenseSystem): any {
  console.log('🔍 Parsing recipe text...');
  const lines = recipeText.split('\n').filter((line) => line.trim());

  const recipe: any = {
    defenseSystem,
    ingredients: [],
    nutrients: {},
  };

  let currentSection = '';

  // First pass - look specifically for TITLE
  const titleLine = lines.find(line => line.trim().startsWith('TITLE:'));
  if (titleLine) {
    const title = titleLine.replace('TITLE:', '').trim();
    // Ensure title is not too long and is meaningful
    if (title && title !== '[Creative recipe name]' && title.length >= 3) {
      recipe.title = title.length > 100 ? title.substring(0, 97) + '...' : title;
      console.log('✅ Title found:', recipe.title);
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('DESCRIPTION:')) {
      recipe.description = trimmedLine.replace('DESCRIPTION:', '').trim();
      console.log('✅ Description found');
    } else if (trimmedLine.startsWith('PREP_TIME:')) {
      recipe.prepTime = trimmedLine.replace('PREP_TIME:', '').trim();
    } else if (trimmedLine.startsWith('COOK_TIME:')) {
      recipe.cookTime = trimmedLine.replace('COOK_TIME:', '').trim();
    } else if (trimmedLine.startsWith('SERVINGS:')) {
      recipe.servings = parseInt(trimmedLine.replace('SERVINGS:', '').trim());
    } else if (trimmedLine === 'INGREDIENTS:') {
      currentSection = 'ingredients';
      console.log('📝 Entering ingredients section');
    } else if (trimmedLine === 'INSTRUCTIONS:') {
      currentSection = 'instructions';
      recipe.instructions = '';
      console.log('📝 Entering instructions section');
    } else if (trimmedLine === 'NUTRIENTS:') {
      currentSection = 'nutrients';
      console.log('📝 Entering nutrients section');
    } else if (currentSection === 'ingredients' && trimmedLine.startsWith('-')) {
      const ingredientText = trimmedLine.substring(1).trim();
      
      // Better parsing: "2 cups flour" -> amount: "2", unit: "cups", name: "flour"
      const match = ingredientText.match(/^(\d+\.?\d*)\s+([a-zA-Z]+)\s+(.+)$/);
      
      if (match) {
        const [, quantity, unit, name] = match;
        recipe.ingredients.push({ 
          name: name.trim(), 
          amount: quantity.trim(),
          unit: unit.trim()
        });
      } else {
        // Fallback for items like "pinch of salt" or "to taste"
        const parts = ingredientText.split(' ');
        if (parts.length >= 2) {
          const amount = parts[0];
          const unit = parts[1];
          const name = parts.slice(2).join(' ') || parts[1];
          recipe.ingredients.push({ 
            name: name, 
            amount: amount,
            unit: unit === name ? '' : unit
          });
        } else {
          // Single word ingredient
          recipe.ingredients.push({ 
            name: ingredientText, 
            amount: '1',
            unit: 'piece'
          });
        }
      }
    } else if (currentSection === 'instructions') {
      recipe.instructions += trimmedLine + '\n';
    } else if (currentSection === 'nutrients' && trimmedLine.startsWith('-')) {
      const nutrientText = trimmedLine.substring(1).trim();
      const [name, value] = nutrientText.split(':').map((s) => s.trim());
      if (name && value) {
        recipe.nutrients[name] = value;
      }
    }
  }

  // Title is REQUIRED - no fallback, let validation catch it
  if (!recipe.title || recipe.title.trim() === '') {
    console.log('⚠️ No title found - validation will reject this');
    recipe.title = ''; // Empty title will fail validation
  }

  // Add fallback description if not found
  if (!recipe.description) {
    recipe.description = `A healthy recipe designed to support ${DEFENSE_SYSTEMS[defenseSystem].displayName}.`;
    console.log('⚠️ No description found, using fallback');
  }

  // Ensure instructions is a string
  if (!recipe.instructions || recipe.instructions.trim() === '') {
    recipe.instructions = 'Instructions not available in the generated content.';
    console.log('⚠️ No instructions found, using fallback');
  }

  console.log('✅ Parsing complete. Recipe has:', {
    title: !!recipe.title,
    description: !!recipe.description,
    ingredients: recipe.ingredients.length,
    instructions: !!recipe.instructions,
    nutrients: Object.keys(recipe.nutrients).length,
  });

  return recipe;
}

// Generate mock recipe when API key is not available
function generateMockRecipe(
  defenseSystem: DefenseSystem,
  systemInfo: any,
  ingredients: string[]
): any {
  const mockRecipes: Record<DefenseSystem, any> = {
    [DefenseSystem.ANGIOGENESIS]: {
      title: 'Tomato & Herb Power Bowl',
      description:
        'A vibrant bowl packed with lycopene-rich tomatoes and olive oil to support healthy blood vessel formation.',
      prepTime: '15 min',
      cookTime: '5 min',
      servings: 2,
      ingredients: [
        { name: 'Cherry tomatoes', amount: '2 cups' },
        { name: 'Extra virgin olive oil', amount: '3 tbsp' },
        { name: 'Fresh basil', amount: '1/4 cup' },
        { name: 'Garlic cloves', amount: '2' },
        { name: 'Quinoa (cooked)', amount: '1 cup' },
        { name: 'Balsamic vinegar', amount: '1 tbsp' },
      ],
      instructions: `1. Cook quinoa according to package directions.
2. Halve cherry tomatoes and place in a bowl.
3. Mince garlic and chop basil.
4. Mix tomatoes with olive oil, garlic, and basil.
5. Add balsamic vinegar and let sit for 10 minutes.
6. Serve tomato mixture over warm quinoa.
7. Drizzle with extra olive oil if desired.`,
      nutrients: {
        Lycopene: '15mg',
        'Vitamin C': '35mg',
        'Healthy Fats': '18g',
        Polyphenols: 'High',
      },
    },
    [DefenseSystem.MICROBIOME]: {
      title: 'Probiotic Paradise Bowl',
      description:
        'A gut-loving combination of fermented foods and fiber to nourish your microbiome.',
      prepTime: '10 min',
      servings: 2,
      ingredients: [
        { name: 'Greek yogurt', amount: '1 cup' },
        { name: 'Kimchi', amount: '1/2 cup' },
        { name: 'Mixed berries', amount: '1 cup' },
        { name: 'Walnuts', amount: '1/4 cup' },
        { name: 'Honey', amount: '1 tbsp' },
        { name: 'Chia seeds', amount: '1 tbsp' },
      ],
      instructions: `1. Place Greek yogurt in serving bowls.
2. Top with kimchi on one side.
3. Add mixed berries on the other side.
4. Sprinkle with chopped walnuts.
5. Add chia seeds for extra fiber.
6. Drizzle with honey.
7. Mix together before eating or enjoy layered.`,
      nutrients: {
        Probiotics: '2 billion CFU',
        Fiber: '10g',
        Protein: '18g',
        'Omega-3': '2g',
      },
    },
    [DefenseSystem.DNA_PROTECTION]: {
      title: 'Green Guardian Smoothie',
      description:
        'Antioxidant-packed smoothie with sulforaphane and EGCG to protect your DNA.',
      prepTime: '5 min',
      servings: 1,
      ingredients: [
        { name: 'Broccoli sprouts', amount: '1/4 cup' },
        { name: 'Matcha powder', amount: '1 tsp' },
        { name: 'Spinach', amount: '1 cup' },
        { name: 'Banana', amount: '1' },
        { name: 'Almond milk', amount: '1 cup' },
        { name: 'Turmeric powder', amount: '1/2 tsp' },
      ],
      instructions: `1. Add almond milk to blender.
2. Add spinach and broccoli sprouts.
3. Peel and add banana.
4. Add matcha and turmeric powder.
5. Blend on high for 60 seconds.
6. Check consistency and add ice if desired.
7. Pour into glass and enjoy immediately.`,
      nutrients: {
        Sulforaphane: '15mg',
        EGCG: '50mg',
        'Vitamin K': '200mcg',
        Curcumin: '100mg',
      },
    },
    [DefenseSystem.IMMUNITY]: {
      title: 'Immunity Warrior Soup',
      description:
        'Warming soup with mushrooms, garlic, and ginger to supercharge your immune system.',
      prepTime: '10 min',
      cookTime: '25 min',
      servings: 4,
      ingredients: [
        { name: 'Shiitake mushrooms', amount: '2 cups' },
        { name: 'Garlic cloves', amount: '6' },
        { name: 'Fresh ginger', amount: '2 inches' },
        { name: 'Vegetable broth', amount: '4 cups' },
        { name: 'Onion', amount: '1 large' },
        { name: 'Turmeric powder', amount: '1 tsp' },
      ],
      instructions: `1. Dice onion and slice mushrooms.
2. Mince garlic and grate ginger.
3. Heat oil in large pot.
4. Sauté onion until soft.
5. Add garlic, ginger, and turmeric.
6. Add mushrooms and cook 5 minutes.
7. Pour in broth and simmer 20 minutes.
8. Season with salt and pepper.
9. Serve hot with fresh herbs.`,
      nutrients: {
        'Beta-glucans': '400mg',
        Allicin: 'High',
        'Vitamin D': '150 IU',
        Gingerol: '20mg',
      },
    },
    [DefenseSystem.REGENERATION]: {
      title: 'Regeneration Power Plate',
      description:
        'Omega-3 rich salmon with regenerative foods to support stem cell health.',
      prepTime: '10 min',
      cookTime: '20 min',
      servings: 2,
      ingredients: [
        { name: 'Wild salmon fillet', amount: '12 oz' },
        { name: 'Turmeric powder', amount: '1 tsp' },
        { name: 'Olive oil', amount: '2 tbsp' },
        { name: 'Lemon', amount: '1' },
        { name: 'Walnuts', amount: '1/4 cup' },
        { name: 'Mixed greens', amount: '2 cups' },
      ],
      instructions: `1. Preheat oven to 375°F.
2. Season salmon with turmeric and salt.
3. Drizzle with olive oil.
4. Bake for 15-18 minutes.
5. Toast walnuts in dry pan.
6. Arrange greens on plates.
7. Place salmon on greens.
8. Top with walnuts and lemon juice.`,
      nutrients: {
        'Omega-3': '2.5g',
        'Vitamin D': '500 IU',
        Curcumin: '150mg',
        Protein: '35g',
      },
    },
  };

  return mockRecipes[defenseSystem];
}