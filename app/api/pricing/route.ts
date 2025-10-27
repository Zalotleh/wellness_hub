import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Static pricing data - in production this might come from Stripe or a CMS
    const pricingData = {
      plans: {
        premium: {
          name: 'Premium',
          monthly: {
            displayPrice: '$9.99',
            amount: 999,
            currency: 'usd',
            interval: 'month',
            monthlyEquivalent: '$9.99',
          },
          annual: {
            displayPrice: '$99.99',
            amount: 9999,
            currency: 'usd',
            interval: 'year',
            monthlyEquivalent: '$8.33',
          },
        },
        family: {
          name: 'Family',
          monthly: {
            displayPrice: '$19.99',
            amount: 1999,
            currency: 'usd',
            interval: 'month',
            monthlyEquivalent: '$19.99',
          },
          annual: {
            displayPrice: '$199.99',
            amount: 19999,
            currency: 'usd',
            interval: 'year',
            monthlyEquivalent: '$16.67',
          },
        },
      },
      trialDays: 14,
      features: {
        free: [
          'Up to 3 meal plans per month',
          'Basic recipe suggestions',
          '5 defense systems tracking',
          'Weekly progress reports',
          'Basic meal planning tools',
        ],
        premium: [
          'Unlimited meal plans',
          'AI-powered recipe generation',
          'Smart shopping lists with price estimates',
          'Pantry management',
          'Advanced analytics and insights',
          'Custom meal preferences',
          'Export plans to PDF',
          'Nutritional analysis',
          'Recipe regeneration',
          '50 AI questions per month',
        ],
        family: [
          'Everything in Premium',
          'Up to 6 family members',
          'Shared shopping lists',
          'Multiple dietary preferences',
          'Family meal coordination',
          'Kids meal suggestions',
          'Unlimited AI questions',
          'Priority support',
          'Monthly meal plan templates',
          'Advanced health integrations',
        ],
      },
    };

    return NextResponse.json(pricingData);

  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}