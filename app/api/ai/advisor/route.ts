// app/api/ai/advisor/route.ts
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
    const { message, conversationHistory } = body;

    console.log('📝 AI Advisor request:', { message });

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context about 5x5x5 system
    const systemContext = Object.values(DefenseSystem)
      .map((system) => {
        const info = DEFENSE_SYSTEMS[system];
        return `${info.displayName}: ${info.description}\nKey foods: ${info.keyFoods.join(', ')}\nKey nutrients: ${info.nutrients.join(', ')}`;
      })
      .join('\n\n');

    const systemPrompt = `You are a knowledgeable AI nutrition advisor specializing in Dr. William Li's 5x5x5 system for disease prevention through food. Your role is to:

1. Answer questions about the 5x5x5 system and its five defense systems
2. Recommend foods that support specific health goals
3. Suggest recipes and meal ideas based on user preferences
4. Provide evidence-based nutritional guidance
5. Be encouraging and supportive of users' health journeys

The 5x5x5 System:
- 5 Defense Systems (Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity)
- 5 Foods per system
- 5 Times per day

Defense Systems Information:
${systemContext}

Guidelines:
- Keep responses conversational, friendly, and encouraging
- Cite specific foods and their benefits
- Suggest practical ways to incorporate foods into daily meals
- Be specific with portion suggestions when relevant
- Acknowledge when questions are outside your expertise
- Always emphasize whole foods and balanced nutrition
- Reference Dr. William Li's research when appropriate

Remember: You're here to educate, support, and inspire healthy eating habits!`;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.log('⚠️ No API key found, returning mock response');
      return NextResponse.json({
        data: {
          message: "I'm the 5x5x5 Wellness AI Advisor! I can help you understand the defense systems and recommend foods for your health goals. What would you like to know about?",
          suggestions: [
            "What foods are best for immunity?",
            "How can I support my microbiome?",
            "Tell me about angiogenesis"
          ]
        },
        message: 'Mock response (API key not configured)',
      });
    }

    // Build conversation history for context
    const messages = [
      {
        role: 'user',
        content: message,
      },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      // Include last 5 messages for context
      const recentHistory = conversationHistory.slice(-5);
      messages.unshift(...recentHistory);
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
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages,
      }),
    });

    console.log('📥 Anthropic response status:', anthropicResponse.status);

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      console.error('❌ Anthropic API error:', errorData);
      throw new Error(`Failed to get response from AI: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;

    console.log('✅ AI Advisor response generated');

    // Generate smart suggestions based on the conversation
    const suggestions = generateSmartSuggestions(message, responseText);

    return NextResponse.json({
      data: {
        message: responseText,
        suggestions,
      },
      message: 'AI advisor response generated successfully',
    });
  } catch (error: any) {
    console.error('💥 Error in AI advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}

function generateSmartSuggestions(userMessage: string, aiResponse: string): string[] {
  const lowercaseMessage = userMessage.toLowerCase();
  const lowercaseResponse = aiResponse.toLowerCase();
  
  const suggestions: string[] = [];

  // Defense system specific suggestions
  if (lowercaseMessage.includes('immunity') || lowercaseResponse.includes('immunity')) {
    suggestions.push("What foods boost immunity naturally?");
    suggestions.push("Tell me about mushrooms for immune health");
  } else if (lowercaseMessage.includes('microbiome') || lowercaseResponse.includes('microbiome')) {
    suggestions.push("Best fermented foods for gut health?");
    suggestions.push("How does the microbiome affect overall health?");
  } else if (lowercaseMessage.includes('angiogenesis') || lowercaseResponse.includes('angiogenesis')) {
    suggestions.push("Foods that starve cancer cells?");
    suggestions.push("How does tomato support blood vessels?");
  } else if (lowercaseMessage.includes('dna') || lowercaseResponse.includes('dna protection')) {
    suggestions.push("Best foods to protect DNA?");
    suggestions.push("What is sulforaphane?");
  } else if (lowercaseMessage.includes('regeneration') || lowercaseResponse.includes('stem cell')) {
    suggestions.push("How do omega-3s support regeneration?");
    suggestions.push("Foods that activate stem cells?");
  }

  // Recipe and meal suggestions
  if (lowercaseMessage.includes('recipe') || lowercaseMessage.includes('meal')) {
    suggestions.push("Suggest a breakfast for all 5 systems");
    suggestions.push("Quick lunch ideas for busy days");
  }

  // Default suggestions if none were added
  if (suggestions.length === 0) {
    suggestions.push(
      "How do I start the 5x5x5 system?",
      "What's the best defense system to focus on first?",
      "Suggest a meal plan for this week"
    );
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}