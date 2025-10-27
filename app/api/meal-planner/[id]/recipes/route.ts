import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFeatureAccess, Feature } from '@/lib/features/feature-flags';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

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

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionTier: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const featureAccess = getUserFeatureAccess(user);

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
      
      return NextResponse.json({
        data: recipes,
        message: `Generated ${recipes.filter(r => r.success).length} out of ${mealIds.length} recipes successfully`,
        errors: recipes.filter(r => !r.success),
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
      
      return NextResponse.json({
        data: recipe,
        message: 'Recipe generated successfully',
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
  const systemsContext = meal.defenseSystems
    .map((system: string) => {
      const info = DEFENSE_SYSTEMS[system as keyof typeof DEFENSE_SYSTEMS];
      return info ? `${info.displayName}: Focus on ${info.keyFoods.slice(0, 3).join(', ')}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const servings = meal.dailyMenu.servings || mealPlan.defaultServings || 2;

  const prompt = `Create a detailed recipe for: ${meal.mealName}

Context:
- Meal Type: ${meal.mealType}
- Servings: ${servings}
- Defense Systems to support: ${meal.defenseSystems.join(', ')}
- Estimated prep time: ${meal.prepTime || 'flexible'}
${mealPlan.dietaryRestrictions?.length > 0 ? `- Dietary restrictions: ${mealPlan.dietaryRestrictions.join(', ')}` : ''}
${customInstructions ? `- Special instructions: ${customInstructions}` : ''}
${meal.customInstructions ? `- Meal-specific instructions: ${meal.customInstructions}` : ''}

Defense Systems Context:
${systemsContext}

Create a recipe that incorporates foods known to support these defense systems. Make it practical, delicious, and nutritionally balanced.

Provide a complete recipe with:
1. Brief description (2-3 sentences)
2. Detailed ingredients list with exact quantities
3. Step-by-step instructions
4. Prep time, cook time, and total time
5. Difficulty level (easy/medium/hard)
6. Basic nutritional information (calories, protein, carbs, fat)

Format your response as valid JSON:
{
  "title": "Recipe name",
  "description": "Brief description highlighting health benefits",
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
  "defenseSystems": ${JSON.stringify(meal.defenseSystems)}
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
        model: 'claude-3-sonnet-20240229', // Updated to valid model name
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
        defenseSystems: meal.defenseSystems,
        generatedBy: 'claude-3-sonnet-20240229',
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
  const results = [];
  
  // Generate recipes sequentially to avoid rate limits
  for (let i = 0; i < mealIds.length; i++) {
    const mealId = mealIds[i];
    
    try {
      const recipe = await generateSingleRecipe(
        userId, 
        mealId, 
        mealPlan, 
        customInstructions,
        forceRegenerate
      );
      
      results.push({
        mealId,
        recipe,
        success: true,
      });
      
      // Add delay between requests (2 seconds) to respect rate limits
      if (i < mealIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`Failed to generate recipe for meal ${mealId}:`, error);
      results.push({
        mealId,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }
  
  return results;
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