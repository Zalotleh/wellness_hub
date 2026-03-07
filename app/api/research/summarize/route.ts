import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pmid, title, abstract, defenseSystem, keywords } = body as {
      pmid: string;
      title: string;
      abstract: string;
      defenseSystem: string;
      keywords?: string[];
    };

    if (!pmid || !title || !abstract) {
      return NextResponse.json(
        { error: 'pmid, title, and abstract are required' },
        { status: 400 },
      );
    }

    // ── Step 1: Check database cache ────────────────────────────────────────
    const cached = await prisma.researchSummaryCache.findUnique({ where: { pmid } });
    if (cached) {
      await prisma.researchSummaryCache.update({
        where: { pmid },
        data: { hitCount: { increment: 1 } },
      });
      return NextResponse.json({ summary: cached.summary, source: 'cache' });
    }

    // ── Step 2: Call Claude via Anthropic API ────────────────────────────────
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 },
      );
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:
          'You are a warm health educator for the 5x5x5 Wellness Hub wellness app. Never use jargon. Make science feel exciting and personal.',
        messages: [
          {
            role: 'user',
            content: `Summarize this research paper in exactly 3 sentences for a wellness app user.
Sentence 1: What was found (plain English, no jargon).
Sentence 2: Why this matters for everyday health.
Sentence 3: One specific food or habit the user can try TODAY.

Title: "${title}"
Abstract: "${abstract}"
Defense system: ${defenseSystem}
Keywords: ${keywords?.join(', ')}

Reply with exactly 3 sentences only. No bullet points, no labels.`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      console.error('Anthropic API error:', anthropicResponse.status, errorData);
      return NextResponse.json(
        { error: 'Failed to generate summary from Claude' },
        { status: 502 },
      );
    }

    const anthropicData = await anthropicResponse.json();
    const summary =
      anthropicData.content?.[0]?.type === 'text'
        ? anthropicData.content[0].text
        : '';

    if (!summary) {
      return NextResponse.json({ error: 'Empty summary from Claude' }, { status: 502 });
    }

    // ── Step 3: Save to database ─────────────────────────────────────────────
    await prisma.researchSummaryCache.create({
      data: {
        pmid,
        summary,
        articleTitle: title,
        defenseSystem,
        hitCount: 0,
      },
    });

    return NextResponse.json({ summary, source: 'claude' });
  } catch (error) {
    console.error('Error in /api/research/summarize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
