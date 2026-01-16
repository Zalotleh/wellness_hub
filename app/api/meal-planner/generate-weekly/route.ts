import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, parseISO, getDay } from 'date-fns';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'];
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      weekStart,
      weekEnd,
      selectedDays, // Array of yyyy-MM-dd strings
      dietaryRestrictions = [],
      focusSystems = [],
      servings = 2,
    } = body;

    if (!weekStart || !weekEnd || !selectedDays || selectedDays.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating weekly meal plan with AI:', {
      weekStart,
      weekEnd,
      selectedDays,
      focusSystems,
      servings,
    });

    // Check if meal plan already exists for this week
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
      },
      include: {
        dailyMenus: {
          include: {
            meals: true,
          },
        },
      },
    });

    let existingPlanInfo = null;
    if (existingPlan) {
      const totalMeals = existingPlan.dailyMenus.reduce(
        (sum, dm) => sum + dm.meals.length,
        0
      );
      existingPlanInfo = {
        id: existingPlan.id,
        title: existingPlan.title,
        daysPlanned: existingPlan.dailyMenus.length,
        totalMeals: totalMeals,
      };
      
      console.log('⚠️ Existing meal plan found, will be replaced:', existingPlanInfo);
      
      // Delete existing plan and create new one
      await prisma.mealPlan.delete({
        where: { id: existingPlan.id },
      });
    }

    // Generate meal plan using AI
    const aiMealPlan = await generateMealPlanWithAI(
      selectedDays,
      dietaryRestrictions,
      focusSystems,
      servings
    );

    // Create meal plan structure with AI-generated meals
    const dailyMenus = selectedDays.map((dayString: string) => {
      // Parse date string (YYYY-MM-DD) and create noon UTC date
      const [year, month, day] = dayString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      const dayOfWeek = getDay(date); // 0=Sunday, 1=Monday, etc.
      const dayName = DAY_NAMES[dayOfWeek];
      const aiDay = aiMealPlan[dayName];
      
      if (!aiDay) {
        // Fallback to placeholders if AI didn't generate for this day
        return {
          date,
          meals: {
            create: MEAL_TYPES.map(mealType => ({
              mealType,
              mealName: `${mealType.charAt(0) + mealType.slice(1).toLowerCase()} Placeholder`,
              servings: servings,
              defenseSystems: focusSystems,
            })),
          },
        };
      }

      return {
        date,
        meals: {
          create: MEAL_TYPES.map(mealType => {
            const mealKey = mealType.toLowerCase();
            const aiMeal = aiDay[mealKey];
            
            if (!aiMeal) {
              return {
                mealType,
                mealName: `${mealType.charAt(0) + mealType.slice(1).toLowerCase()} Placeholder`,
                servings: servings,
                defenseSystems: focusSystems,
              };
            }

            return {
              mealType,
              mealName: aiMeal.name || `${mealType.charAt(0) + mealType.slice(1).toLowerCase()}`,
              servings: servings,
              defenseSystems: aiMeal.systems || focusSystems,
              prepTime: aiMeal.prepTime || '30 min',
              cookTime: aiMeal.cookTime || '0 min',
            };
          }),
        },
      };
    });

    // Create the meal plan
    // Parse weekStart and weekEnd to noon UTC
    const [wsYear, wsMonth, wsDay] = weekStart.split('-').map(Number);
    const weekStartDate = new Date(Date.UTC(wsYear, wsMonth - 1, wsDay, 12, 0, 0, 0));
    const [weYear, weMonth, weDay] = weekEnd.split('-').map(Number);
    const weekEndDate = new Date(Date.UTC(weYear, weMonth - 1, weDay, 12, 0, 0, 0));
    
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        title: `Week of ${format(weekStartDate, 'MMM d')}`,
        description: `Weekly meal plan with ${selectedDays.length} days`,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        dietaryRestrictions,
        dailyMenus: {
          create: dailyMenus,
        },
      },
      include: {
        dailyMenus: {
          include: {
            meals: true,
          },
        },
      },
    });

    console.log('Meal plan with AI-generated recipes created successfully:', {
      id: mealPlan.id,
      days: mealPlan.dailyMenus.length,
      totalMeals: mealPlan.dailyMenus.reduce((sum: number, dm: any) => sum + dm.meals.length, 0),
    });

    return NextResponse.json({
      success: true,
      replacedExisting: !!existingPlanInfo,
      replacedPlan: existingPlanInfo,
      mealPlan: {
        id: mealPlan.id,
        weekStart: mealPlan.weekStart,
        weekEnd: mealPlan.weekEnd,
        daysPlanned: mealPlan.dailyMenus.length,
        totalMeals: mealPlan.dailyMenus.reduce(
          (sum: number, dm: any) => sum + dm.meals.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Error generating weekly meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

async function generateMealPlanWithAI(
  selectedDays: string[],
  dietaryRestrictions: string[],
  focusSystems: string[],
  servings: number
): Promise<any> {
  // Build day list for AI
  const dayNames = selectedDays.map((dayString) => {
    const date = parseISO(dayString);
    const dayOfWeek = getDay(date);
    return DAY_NAMES[dayOfWeek];
  });

  // Build context about defense systems
  const systemsContext = (focusSystems.length > 0 ? focusSystems : Object.values(DefenseSystem))
    .map((system: string) => {
      const info = DEFENSE_SYSTEMS[system as DefenseSystem];
      if (!info) return '';
      const foodSample = info.keyFoods.slice(0, 20).join(', ');
      const additionalCount = info.keyFoods.length - 20;
      const additionalText = additionalCount > 0 ? ` (plus ${additionalCount} more)` : '';
      return `${info.displayName}: ${foodSample}${additionalText}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `Create a balanced meal plan for ${selectedDays.length} days based on Dr. William Li's 5x5x5 system from "Eat to Beat Disease".

CRITICAL REQUIREMENTS:
- Create meals for ONLY these ${selectedDays.length} days: ${dayNames.join(', ')}
- Each day has 3 meals (breakfast, lunch, dinner)
- Total meals to create: ${selectedDays.length * 3} meals

Requirements:
- Each day should incorporate foods from multiple defense systems
- Meals should be practical, nutritious, and delicious
- Use the comprehensive food lists below to create varied, interesting meals
${dietaryRestrictions.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${focusSystems.length > 0 ? `- Focus on these systems: ${focusSystems.map((s: string) => DEFENSE_SYSTEMS[s as DefenseSystem]?.displayName || s).join(', ')}` : ''}
- Servings per recipe: ${servings}

Defense Systems Foods to Incorporate:
${systemsContext}

Format your response as a JSON object with this EXACT structure (only include the days listed above):
{
  ${dayNames.map(day => `"${day}": {
    "breakfast": {"name": "Recipe Name", "systems": ["ANGIOGENESIS"], "prepTime": "15 min", "cookTime": "10 min"},
    "lunch": {"name": "Recipe Name", "systems": ["MICROBIOME", "IMMUNITY"], "prepTime": "20 min", "cookTime": "15 min"},
    "dinner": {"name": "Recipe Name", "systems": ["REGENERATION"], "prepTime": "30 min", "cookTime": "25 min"}
  }`).join(',\n  ')}
}

Guidelines:
- Maximum variety - don't repeat meals
- Include prep times and cook times (realistic estimates)
- Each meal should support 1-3 defense systems
- Make meals practical and appealing
- Consider meal prep efficiency

RESPONSE FORMAT REQUIREMENTS:
1. Respond with ONLY valid JSON - no explanations, no markdown, no code blocks
2. Ensure all property names are in double quotes
3. Do not include trailing commas
4. Start your response with { and end with }

Respond ONLY with valid JSON, no additional text.`;

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    console.log('⚠️ No API key found, returning empty meal plan');
    return {};
  }

  try {
    console.log('📤 Sending request to Anthropic API for meal generation...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('❌ Anthropic API error:', response.status);
      return {};
    }

    const data = await response.json();
    const aiContent = data.content?.[0]?.text || '';
    
    console.log('📥 AI response received, parsing...');

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = aiContent.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    }

    const mealPlan = JSON.parse(jsonText);
    console.log('✅ Meal plan parsed successfully');
    
    return mealPlan;
  } catch (error) {
    console.error('❌ Error generating meal plan with AI:', error);
    return {};
  }
}
