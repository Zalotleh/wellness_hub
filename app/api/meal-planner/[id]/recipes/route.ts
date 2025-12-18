import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess, Feature } from '@/lib/features/feature-flags';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { logAIGeneration } from '@/lib/ai-generation/analytics';
import { executeBatch, BatchTask } from '@/lib/ai-generation/batch-optimizer';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit - 10 requests per minute for recipe generation
    if (!checkRateLimit(session.user.id, 10, 60000)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many recipe generation requests. Please wait a minute before trying again.',
          retryAfter: 60 
        },
        { status: 429 }
      );
    }

    const mealPlanId = params.id;
    let body;
    
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { mealId, mealIds, batch = false, customInstructions, forceRegenerate = false } = body;

    // Validate required fields
    if (!mealId && (!mealIds || !Array.isArray(mealIds))) {
      return NextResponse.json(
        { error: 'Either mealId or mealIds array is required' },
        { status: 400 }
      );
    }

    // Get user with subscription info and generation counts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        recipeGenerationsThisMonth: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const featureAccess = getUserFeatureAccess(user);

    // Check if monthly reset is needed
    const now = new Date();
    const lastReset = user.lastResetDate || new Date(0);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    let currentRecipeGenerationsCount = user.recipeGenerationsThisMonth;

    if (daysSinceReset >= 30) {
      // Reset monthly counters
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          recipeGenerationsThisMonth: 0,
          lastResetDate: now,
        },
      });
      currentRecipeGenerationsCount = 0;
    }

    // Check recipe generation limit (unified counter for both standalone and meal plan recipes)
    const recipeGenerationsLimit = featureAccess.getLimit('recipe_generations_per_month');
    
    if (typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity) {
      // Calculate how many recipes we're about to generate
      const recipesToGenerate = batch && mealIds ? mealIds.length : 1;
      
      if (currentRecipeGenerationsCount + recipesToGenerate > recipeGenerationsLimit) {
        return NextResponse.json(
          {
            error: 'Recipe generation limit reached',
            message: `You've used ${currentRecipeGenerationsCount}/${recipeGenerationsLimit} AI recipe generations this month. ${
              recipesToGenerate > 1 
                ? `You need ${recipesToGenerate} more but only have ${recipeGenerationsLimit - currentRecipeGenerationsCount} remaining.`
                : 'Upgrade to Premium for unlimited recipe generation.'
            }`,
            limit: recipeGenerationsLimit,
            current: currentRecipeGenerationsCount,
            needed: recipesToGenerate,
            upgrade: true,
          },
          { status: 403 }
        );
      }
    }

    // Check batch generation permission
    if (batch && mealIds && mealIds.length > 1 && !featureAccess.hasFeature(Feature.BATCH_RECIPE_GENERATION)) {
      return NextResponse.json(
        {
          error: 'Batch recipe generation requires Premium',
          upgrade: true,
          feature: Feature.BATCH_RECIPE_GENERATION,
          message: 'Upgrade to Premium to generate multiple recipes at once',
        },
        { status: 403 }
      );
    }

    // Limit batch size for free users
    if (batch && mealIds && mealIds.length > 5 && user.subscriptionTier === 'FREE') {
      return NextResponse.json(
        {
          error: 'Batch size limit exceeded',
          message: 'Free users can generate up to 5 recipes at once. Upgrade to Premium for unlimited batch generation.',
          maxBatchSize: 5,
        },
        { status: 403 }
      );
    }

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      select: { 
        userId: true,
        title: true,
        dietaryRestrictions: true,
        defaultServings: true,
      },
    });

    if (!mealPlan || mealPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Meal plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Handle batch generation
    if (batch && mealIds && Array.isArray(mealIds)) {
      const recipes = await generateBatchRecipes(
        session.user.id,
        mealIds,
        mealPlan,
        customInstructions,
        forceRegenerate
      );
      
      // Increment counter for successful generations (only if not unlimited)
      const successfulCount = recipes.filter(r => r.success).length;
      if (typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity && successfulCount > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            recipeGenerationsThisMonth: {
              increment: successfulCount,
            },
          },
        });
      }
      
      return NextResponse.json({
        data: recipes,
        message: `Generated ${successfulCount} out of ${mealIds.length} recipes successfully`,
        errors: recipes.filter(r => !r.success),
        countedAgainstLimit: typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity,
        remainingGenerations: typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity 
          ? recipeGenerationsLimit - (currentRecipeGenerationsCount + successfulCount)
          : Infinity,
      });
    }

    // Handle single meal generation
    if (mealId) {
      const recipe = await generateSingleRecipe(
        session.user.id,
        mealId,
        mealPlan,
        customInstructions,
        forceRegenerate
      );
      
      // Increment counter (only if not unlimited)
      if (typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            recipeGenerationsThisMonth: {
              increment: 1,
            },
          },
        });
      }
      
      return NextResponse.json({
        data: recipe,
        message: 'Recipe generated successfully',
        countedAgainstLimit: typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity,
        remainingGenerations: typeof recipeGenerationsLimit === 'number' && recipeGenerationsLimit !== Infinity 
          ? recipeGenerationsLimit - (currentRecipeGenerationsCount + 1)
          : Infinity,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error generating recipe:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'AI service temporarily unavailable',
            message: 'Please try again in a few minutes',
            retryAfter: 300 
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'Recipe generation took too long. Please try again.',
          },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}

async function generateSingleRecipe(
  userId: string,
  mealId: string,
  mealPlan: any,
  customInstructions?: string,
  forceRegenerate = false
): Promise<any> {
  // Get meal details
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: {
      dailyMenu: {
        select: {
          date: true,
          servings: true,
          mealPlanId: true,
        },
      },
      generatedRecipe: true, // Include existing recipe if any
    },
  });

  if (!meal) {
    throw new Error('Meal not found');
  }

  // Check if recipe already exists and we're not forcing regeneration
  if (!forceRegenerate && meal.generatedRecipe) {
    return meal.generatedRecipe;
  }

  // Build context about the meal and defense systems
  const servings = meal.dailyMenu.servings || mealPlan.defaultServings || 2;
  
  // Prepare defense systems context with intelligent assignment
  const mealDefenseSystems = meal.defenseSystems && meal.defenseSystems.length > 0 
    ? meal.defenseSystems 
    : null;

  const systemsContext = mealDefenseSystems
    ? mealDefenseSystems.map((system: string) => {
        const info = DEFENSE_SYSTEMS[system as keyof typeof DEFENSE_SYSTEMS];
        return info ? `${info.displayName}: ${info.description}. Key foods: ${info.keyFoods.join(', ')}` : '';
      }).filter(Boolean).join('\n')
    : 'All defense systems available - choose the most appropriate ones based on ingredients and meal type';

  const prompt = `Create a detailed recipe for: ${meal.mealName}

Context:
- Meal Type: ${meal.mealType}
- Servings: ${servings}
${mealDefenseSystems 
  ? `- Target Defense Systems: ${mealDefenseSystems.join(', ')} (focus specifically on these)`
  : `- Defense Systems: Choose 1-3 most appropriate systems based on ingredients (ANGIOGENESIS, REGENERATION, MICROBIOME, DNA_PROTECTION, IMMUNITY)`
}
- Estimated prep time: ${meal.prepTime || 'flexible'}
${mealPlan.dietaryRestrictions?.length > 0 ? `- Dietary restrictions: ${mealPlan.dietaryRestrictions.join(', ')}` : ''}
${customInstructions ? `- Special instructions: ${customInstructions}` : ''}
${meal.customInstructions ? `- Meal-specific instructions: ${meal.customInstructions}` : ''}

Defense Systems Context:
${systemsContext}

${mealDefenseSystems 
  ? `Create a recipe that specifically incorporates foods known to support these defense systems: ${mealDefenseSystems.join(', ')}.`
  : `Analyze the meal name and type, then choose 1-3 most appropriate defense systems and incorporate foods that support them. Base your choice on the natural ingredients that would work best for this dish.`
}

Make the recipe practical, delicious, and nutritionally balanced.

Provide a complete recipe with:
1. Brief description (2-3 sentences) highlighting health benefits
2. Detailed ingredients list with exact quantities
3. Step-by-step instructions
4. Prep time, cook time, and total time
5. Difficulty level (easy/medium/hard)
6. Basic nutritional information (calories, protein, carbs, fat, fiber)
7. Defense systems this recipe supports (either the specified ones or your intelligent selection)

Format your response as valid JSON:
{
  "title": "Recipe name",
  "description": "Brief description highlighting health benefits and defense systems supported",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "20 min", 
  "totalTime": "35 min",
  "difficulty": "easy",
  "ingredients": [
    {"name": "ingredient name", "amount": "2", "unit": "cups", "notes": "optional preparation notes"}
  ],
  "instructions": [
    {"step": 1, "instruction": "Detailed step description", "time": "5 min"},
    {"step": 2, "instruction": "Next step description"}
  ],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 40,
    "fat": 12,
    "fiber": 8
  },
  "tips": ["Helpful cooking tips or variations"],
  "defenseSystems": ${mealDefenseSystems ? JSON.stringify(mealDefenseSystems) : '["SYSTEM1", "SYSTEM2"]'}
}

Respond ONLY with valid JSON, no additional text or formatting.`;

  // Check for Anthropic API key
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Create request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929', // Updated to requested model name
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status} ${anthropicResponse.statusText}`);
    }

    const anthropicData = await anthropicResponse.json();
    
    if (!anthropicData.content || !anthropicData.content[0] || !anthropicData.content[0].text) {
      throw new Error('Invalid response format from Anthropic API');
    }

    const content = anthropicData.content[0].text.trim();
    
    // Clean up JSON if it has markdown formatting
    const cleanedContent = content.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
    
    // Parse JSON response
    let recipeData;
    try {
      recipeData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse recipe data from AI response');
    }

    // Validate required fields
    if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      throw new Error('AI response missing required recipe fields');
    }

    // Save recipe to database
    const recipe = await prisma.generatedRecipe.create({
      data: {
        userId,
        mealId,
        name: recipeData.title,
        description: recipeData.description || '',
        servings: recipeData.servings || servings,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        totalTime: recipeData.totalTime || null,
        difficulty: recipeData.difficulty || 'medium',
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        calories: recipeData.nutrition?.calories || null,
        protein: recipeData.nutrition?.protein || null,
        carbs: recipeData.nutrition?.carbs || null,
        fat: recipeData.nutrition?.fat || null,
        fiber: recipeData.nutrition?.fiber || null,
        // Use AI-determined defense systems if meal had none, otherwise use meal's systems
        defenseSystems: recipeData.defenseSystems && Array.isArray(recipeData.defenseSystems) 
          ? recipeData.defenseSystems 
          : meal.defenseSystems || [],
        generatedBy: 'claude-sonnet-4-5-20250929',
        customPrompt: customInstructions || null,
      },
    });

    return recipe;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - recipe generation took too long');
    }
    throw error;
  }
}

async function generateBatchRecipes(
  userId: string,
  mealIds: string[],
  mealPlan: any,
  customInstructions?: string,
  forceRegenerate = false
): Promise<any[]> {
  // Create batch tasks for parallel execution
  const tasks: BatchTask<any>[] = mealIds.map((mealId) => ({
    id: mealId,
    execute: async () => {
      return await generateSingleRecipe(
        userId,
        mealId,
        mealPlan,
        customInstructions,
        forceRegenerate
      );
    },
  }));

  // Execute with optimized batch processing
  // Concurrency of 3 means 3 recipes generated in parallel
  // 500ms delay between batches to respect rate limits
  const results = await executeBatch(tasks, 3, 500);

  // Transform results into expected format
  return results.map((result) => ({
    mealId: result.id,
    recipe: result.data,
    success: result.success,
    error: result.error,
    duration: result.duration,
  }));
}

// GET - Fetch recipes for a meal plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlanId = params.id;

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      select: { userId: true, title: true },
    });

    if (!mealPlan || mealPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Meal plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all recipes for this meal plan
    const recipes = await prisma.generatedRecipe.findMany({
      where: {
        meal: {
          dailyMenu: {
            mealPlanId,
          },
        },
      },
      include: {
        meal: {
          select: {
            id: true,
            mealName: true,
            mealType: true,
            defenseSystems: true,
            dailyMenu: {
              select: {
                date: true,
                mealPlanId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { meal: { dailyMenu: { date: 'asc' } } },
        { meal: { position: 'asc' } },
      ],
    });

    return NextResponse.json({ 
      data: recipes,
      total: recipes.length,
      mealPlanTitle: mealPlan.title,
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}