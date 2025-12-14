// app/api/meal-planner/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dietaryRestrictions, focusSystems, preferences, duration = 1 } = body;

    console.log('📝 Meal planner request:', { dietaryRestrictions, focusSystems, preferences, duration });

    // Build context about defense systems with comprehensive food lists
    const systemsContext = (focusSystems || Object.values(DefenseSystem))
      .map((system: DefenseSystem) => {
        const info = DEFENSE_SYSTEMS[system];
        // Show first 20 foods to give AI good variety without overwhelming the prompt
        const foodSample = info.keyFoods.slice(0, 20).join(', ');
        const additionalCount = info.keyFoods.length - 20;
        const additionalText = additionalCount > 0 ? ` (plus ${additionalCount} more)` : '';
        return `${info.displayName}: ${foodSample}${additionalText}`;
      })
      .join('\n\n');

    const totalDays = duration * 7;
    const weekText = duration === 1 ? '1 week' : `${duration} weeks`;
    const weekStructure = duration === 1 
      ? 'Week 1: Monday through Sunday'
      : Array.from({ length: duration }, (_, i) => `Week ${i + 1}: Monday through Sunday`).join('\n');

    const prompt = `Create a balanced ${weekText} meal plan (${totalDays} days total) based on Dr. William Li's 5x5x5 system from "Eat to Beat Disease".

Requirements:
- ${duration} week(s) of meals
- 7 days per week (Monday through Sunday)
- 3 meals per day (breakfast, lunch, dinner)
- Each day should incorporate foods from multiple defense systems
- Meals should be practical, nutritious, and delicious
- Use the comprehensive food lists below to create varied, interesting meals
${dietaryRestrictions?.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${focusSystems?.length > 0 ? `- Focus on these systems: ${focusSystems.map((s: DefenseSystem) => DEFENSE_SYSTEMS[s].displayName).join(', ')}` : ''}

Defense Systems Foods to Incorporate:
${systemsContext}

IMPORTANT: Draw from the diverse food lists above. Don't just use the same 5-10 ingredients. Create variety by incorporating different foods from each system throughout the ${weekText}.

${duration > 1 ? `
FOR MULTI-WEEK PLANS:
- Ensure variety across weeks - don't repeat the same meals
- Consider seasonal variations
- Balance cooking complexity across the entire period
- Think about ingredient efficiency across weeks
` : ''}

Format your response as a JSON object with this EXACT structure:
${duration === 1 ? `{
  "week1": {
    "monday": {
      "breakfast": {"name": "Recipe Name", "systems": ["ANGIOGENESIS"], "prepTime": "15 min"},
      "lunch": {"name": "Recipe Name", "systems": ["MICROBIOME", "IMMUNITY"], "prepTime": "20 min"},
      "dinner": {"name": "Recipe Name", "systems": ["REGENERATION"], "prepTime": "30 min"}
    },
    "tuesday": { ... },
    ... continue for all 7 days
  }
}` : `{
  "week1": {
    "monday": {...}, "tuesday": {...}, ... all 7 days
  },
  "week2": {
    "monday": {...}, "tuesday": {...}, ... all 7 days
  },
  ${duration > 2 ? `"week3": { ... },` : ''}
  ${duration > 3 ? `"week4": { ... }` : ''}
}`}

Guidelines:
- Maximum variety - don't repeat meals ${duration > 1 ? 'across all weeks' : 'within the week'}
- Include prep times (realistic estimates)
- Each meal should support 1-3 defense systems
- Make meals practical and appealing
- Balance complexity across the ${weekText}
- Consider meal prep efficiency (similar ingredients)

Respond ONLY with valid JSON, no additional text.`;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.log('⚠️ No API key found, returning mock meal plan');
      return NextResponse.json({
        data: generateMockMealPlan(),
        message: 'Mock meal plan generated (API key not configured)',
      });
    }

    console.log('📤 Sending request to Anthropic API...');

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
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
      throw new Error(`Failed to generate meal plan: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;

    console.log('✅ Meal plan response received');

    // Parse JSON from response
    let mealPlan;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealPlan = JSON.parse(jsonMatch[0]);
      } else {
        mealPlan = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse meal plan JSON:', parseError);
      return NextResponse.json({
        data: generateMockMealPlan(),
        message: 'Generated fallback meal plan',
      });
    }

    return NextResponse.json({
      data: mealPlan,
      message: 'Meal plan generated successfully',
    });
  } catch (error: any) {
    console.error('💥 Error generating meal plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function generateMockMealPlan() {
  return {
    monday: {
      breakfast: {
        name: 'Berry Greek Yogurt Bowl with Walnuts',
        systems: ['MICROBIOME', 'DNA_PROTECTION'],
        prepTime: '10 min',
      },
      lunch: {
        name: 'Tomato Basil Soup with Olive Oil',
        systems: ['ANGIOGENESIS'],
        prepTime: '20 min',
      },
      dinner: {
        name: 'Grilled Salmon with Turmeric Rice',
        systems: ['REGENERATION', 'IMMUNITY'],
        prepTime: '30 min',
      },
    },
    tuesday: {
      breakfast: {
        name: 'Green Tea Matcha Smoothie',
        systems: ['DNA_PROTECTION', 'ANGIOGENESIS'],
        prepTime: '5 min',
      },
      lunch: {
        name: 'Kimchi Fried Rice Bowl',
        systems: ['MICROBIOME'],
        prepTime: '15 min',
      },
      dinner: {
        name: 'Mushroom Garlic Stir-Fry',
        systems: ['IMMUNITY'],
        prepTime: '25 min',
      },
    },
    wednesday: {
      breakfast: {
        name: 'Oatmeal with Berries and Cinnamon',
        systems: ['MICROBIOME', 'DNA_PROTECTION'],
        prepTime: '10 min',
      },
      lunch: {
        name: 'Mediterranean Chickpea Salad',
        systems: ['ANGIOGENESIS', 'MICROBIOME'],
        prepTime: '15 min',
      },
      dinner: {
        name: 'Broccoli and Garlic Chicken',
        systems: ['DNA_PROTECTION', 'IMMUNITY'],
        prepTime: '35 min',
      },
    },
    thursday: {
      breakfast: {
        name: 'Avocado Toast with Tomatoes',
        systems: ['ANGIOGENESIS', 'REGENERATION'],
        prepTime: '10 min',
      },
      lunch: {
        name: 'Miso Soup with Seaweed',
        systems: ['MICROBIOME', 'IMMUNITY'],
        prepTime: '15 min',
      },
      dinner: {
        name: 'Salmon Poke Bowl',
        systems: ['REGENERATION', 'ANGIOGENESIS'],
        prepTime: '20 min',
      },
    },
    friday: {
      breakfast: {
        name: 'Turmeric Golden Milk Latte',
        systems: ['IMMUNITY', 'REGENERATION'],
        prepTime: '10 min',
      },
      lunch: {
        name: 'Kale Caesar with Tempeh',
        systems: ['DNA_PROTECTION', 'MICROBIOME'],
        prepTime: '20 min',
      },
      dinner: {
        name: 'Tomato Basil Pasta with Olive Oil',
        systems: ['ANGIOGENESIS'],
        prepTime: '25 min',
      },
    },
    saturday: {
      breakfast: {
        name: 'Berry Smoothie Bowl',
        systems: ['DNA_PROTECTION', 'ANGIOGENESIS'],
        prepTime: '10 min',
      },
      lunch: {
        name: 'Sauerkraut and Sausage Plate',
        systems: ['MICROBIOME'],
        prepTime: '15 min',
      },
      dinner: {
        name: 'Herb-Crusted Salmon with Vegetables',
        systems: ['REGENERATION', 'DNA_PROTECTION'],
        prepTime: '40 min',
      },
    },
    sunday: {
      breakfast: {
        name: 'Veggie Omelet with Mushrooms',
        systems: ['IMMUNITY', 'REGENERATION'],
        prepTime: '15 min',
      },
      lunch: {
        name: 'Greek Yogurt Parfait',
        systems: ['MICROBIOME'],
        prepTime: '5 min',
      },
      dinner: {
        name: 'Roasted Veggie Bowl with Quinoa',
        systems: ['ANGIOGENESIS', 'DNA_PROTECTION', 'IMMUNITY'],
        prepTime: '35 min',
      },
    },
  };
}