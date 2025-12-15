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

CRITICAL REQUIREMENTS:
- YOU MUST CREATE EXACTLY ${duration} WEEK(S) OF MEALS
- ${duration === 1 ? 'Create 1 week with 7 days' : `Create ALL ${duration} weeks (week1, week2${duration > 2 ? ', week3' : ''}${duration > 3 ? ', week4' : ''})`}
- Each week contains 7 days (Monday through Sunday)
- Each day has 3 meals (breakfast, lunch, dinner)
- Total meals to create: ${totalDays * 3} meals

Week Structure Required:
${weekStructure}

Additional Requirements:
- Each day should incorporate foods from multiple defense systems
- Meals should be practical, nutritious, and delicious
- Use the comprehensive food lists below to create varied, interesting meals
${dietaryRestrictions?.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${focusSystems?.length > 0 ? `- Focus on these systems: ${focusSystems.map((s: DefenseSystem) => DEFENSE_SYSTEMS[s].displayName).join(', ')}` : ''}

Defense Systems Foods to Incorporate:
${systemsContext}

IMPORTANT: Draw from the diverse food lists above. Don't just use the same 5-10 ingredients. Create variety by incorporating different foods from each system throughout the ${weekText}.

${duration > 1 ? `
FOR MULTI-WEEK PLANS - ABSOLUTELY REQUIRED:
- You MUST generate ${duration} complete weeks (week1, week2${duration > 2 ? ', week3' : ''}${duration > 3 ? ', week4' : ''})
- Each week must have all 7 days with 3 meals per day
- Ensure variety across weeks - don't repeat the same meals
- Consider seasonal variations
- Balance cooking complexity across the entire period
- Think about ingredient efficiency across weeks
` : ''}

Format your response as a JSON object with this EXACT structure (DO NOT SKIP ANY WEEKS):
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
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}
  },
  "week2": {
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}
  }${duration > 2 ? `,
  "week3": {
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}
  }` : ''}${duration > 3 ? `,
  "week4": {
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}
  }` : ''}
}`}

Guidelines:
- Maximum variety - don't repeat meals ${duration > 1 ? 'across all weeks' : 'within the week'}
- Include prep times (realistic estimates)
- Each meal should support 1-3 defense systems
- Make meals practical and appealing
- Balance complexity across the ${weekText}
- Consider meal prep efficiency (similar ingredients)

RESPONSE FORMAT REQUIREMENTS:
1. Respond with ONLY valid JSON - no explanations, no markdown, no code blocks
2. Ensure all property names are in double quotes
3. Ensure all string values are in double quotes
4. Do not include trailing commas
5. Do not include comments
6. Start your response with { and end with }

Respond ONLY with valid JSON, no additional text or formatting.`;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.log('⚠️ No API key found, returning mock meal plan');
      return NextResponse.json({
        data: generateMockMealPlan(duration),
        message: 'Mock meal plan generated (API key not configured)',
      });
    }

    console.log('📤 Sending request to Anthropic API...');

    // Retry logic for transient Anthropic API errors (e.g. 429 / 529)
    const maxAttempts = 3;
    let attempt = 0;
    let anthropicResponse: Response | null = null;
    let anthropicData: any = null;

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16000, // Supports up to 4 weeks (84 meals) with full details
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        console.log(`📥 Anthropic response status (attempt ${attempt}):`, anthropicResponse.status);

        if (anthropicResponse.ok) {
          anthropicData = await anthropicResponse.json().catch(() => null);
          break; // success
        }

        // Try to read error payload for logging
        const errorData = await anthropicResponse.json().catch(() => ({}));
        console.error('❌ Anthropic API error (non-ok):', anthropicResponse.status, errorData);

        // If this is a transient server-side error or rate-limit-like error, retry with backoff
        if ((anthropicResponse.status >= 500 || anthropicResponse.status === 429 || anthropicResponse.status === 529) && attempt < maxAttempts) {
          const backoffMs = 500 * Math.pow(2, attempt - 1); // 500ms, 1000ms, 2000ms
          console.log(`Retrying Anthropic request after ${backoffMs}ms...`);
          await sleep(backoffMs);
          continue;
        }

        // Non-retriable error or exhausted attempts -> return informative error
        return NextResponse.json(
          { error: 'Anthropic API error', details: errorData, status: anthropicResponse.status },
          { status: 502 }
        );
      } catch (fetchErr: any) {
        console.error('❌ Anthropic fetch error:', fetchErr);
        if (attempt < maxAttempts) {
          const backoffMs = 500 * Math.pow(2, attempt - 1);
          await sleep(backoffMs);
          continue;
        }

        return NextResponse.json(
          { error: 'Failed to reach Anthropic API', details: fetchErr?.message || String(fetchErr) },
          { status: 502 }
        );
      }
    }

    if (!anthropicResponse || !anthropicResponse.ok || !anthropicData) {
      console.error('❌ Anthropic request failed after retries');
      return NextResponse.json(
        { error: 'Anthropic API failed to generate a meal plan after retries' },
        { status: 502 }
      );
    }

    // Try to extract response text depending on Anthropic response shape
    const responseText =
      (anthropicData?.content && Array.isArray(anthropicData.content) && anthropicData.content[0]?.text) ||
      anthropicData?.text ||
      JSON.stringify(anthropicData);

    console.log('✅ Meal plan response received');

    // Parse JSON from response
    let mealPlan;
    try {
      // Try to extract and clean JSON if wrapped in markdown code blocks or has extra content
      let jsonText = responseText;
      
      // Log first 500 chars for debugging
      console.log('📄 Raw response preview (first 500 chars):', jsonText.substring(0, 500));
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find the JSON object (look for outermost braces)
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      
      // Clean up common JSON issues
      // Fix trailing commas before closing braces/brackets
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      // Fix unescaped quotes in strings (basic attempt)
      // Fix missing commas between properties (look for }" followed by ")
      jsonText = jsonText.replace(/("\s*)\n(\s*"[^"]+"\s*:)/g, '$1,$2');
      
      console.log('🔧 Cleaned JSON preview (first 500 chars):', jsonText.substring(0, 500));
      
      mealPlan = JSON.parse(jsonText);

      // Log what we received to debug multi-week issues
      const weekKeys = Object.keys(mealPlan).filter(k => k.startsWith('week'));
      console.log(`📊 AI returned ${weekKeys.length} week(s):`, weekKeys);
      console.log(`📊 Expected ${duration} week(s)`);
      
      // If AI didn't return enough weeks, fill in with generated content
      if (weekKeys.length < duration) {
        console.warn(`⚠️ AI returned ${weekKeys.length} weeks but ${duration} were requested. Generating missing weeks...`);
        
        // Get the mock meal plan for the missing weeks
        const mockPlan = generateMockMealPlan(duration);
        
        // Fill in missing weeks
        for (let weekNum = weekKeys.length + 1; weekNum <= duration; weekNum++) {
          const weekKey = `week${weekNum}`;
          if (!mealPlan[weekKey]) {
            console.log(`📝 Adding generated ${weekKey}`);
            mealPlan[weekKey] = mockPlan[weekKey];
          }
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse meal plan JSON:', parseError);
      console.error('📄 Failed JSON length:', responseText.length, 'chars');
      console.error('📄 Failed JSON preview (first 1000 chars):', responseText.substring(0, 1000));
      console.error('📄 Failed JSON preview (around error position):', 
        parseError instanceof SyntaxError && parseError.message.includes('position') 
          ? responseText.substring(Math.max(0, parseInt(parseError.message.match(/\d+/)?.[0] || '0') - 100), parseInt(parseError.message.match(/\d+/)?.[0] || '0') + 100)
          : 'N/A'
      );
      return NextResponse.json({
        data: generateMockMealPlan(duration),
        message: 'Generated fallback meal plan due to AI response parsing error',
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

function generateMockMealPlan(duration: number = 1) {
  const singleWeekData = {
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

  // For single week, return legacy format
  if (duration === 1) {
    return singleWeekData;
  }

  // For multi-week, create week structure
  const multiWeekData: any = {};
  
  for (let weekNum = 1; weekNum <= duration; weekNum++) {
    // Create variations for each week
    multiWeekData[`week${weekNum}`] = JSON.parse(JSON.stringify(singleWeekData));
    
    // Add week number suffix to meal names for variety
    Object.keys(multiWeekData[`week${weekNum}`]).forEach((day) => {
      Object.keys(multiWeekData[`week${weekNum}`][day]).forEach((mealType) => {
        const meal = multiWeekData[`week${weekNum}`][day][mealType];
        if (weekNum > 1) {
          // Add variation markers for weeks 2+
          meal.name = `${meal.name} (Week ${weekNum} Variation)`;
        }
      });
    });
  }

  return multiWeekData;
}
