import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession, STRIPE_PRODUCTS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    const { plan, interval = 'monthly' } = body;

    // Validate plan
    if (!plan || !['premium', 'family'].includes(plan)) {
      return NextResponse.json(
        { 
          error: 'Invalid plan selected. Must be "premium" or "family"',
          code: 'INVALID_PLAN',
          availablePlans: ['premium', 'family']
        },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['monthly', 'annual'].includes(interval)) {
      return NextResponse.json(
        { 
          error: 'Invalid billing interval. Must be "monthly" or "annual"',
          code: 'INVALID_INTERVAL',
          availableIntervals: ['monthly', 'annual']
        },
        { status: 400 }
      );
    }

    // Get price ID based on plan and interval
    let priceId: string;
    let planDetails;

    try {
      if (plan === 'premium') {
        if (interval === 'annual') {
          priceId = STRIPE_PRODUCTS.PREMIUM_ANNUAL.priceId;
          planDetails = STRIPE_PRODUCTS.PREMIUM_ANNUAL;
        } else {
          priceId = STRIPE_PRODUCTS.PREMIUM_MONTHLY.priceId;
          planDetails = STRIPE_PRODUCTS.PREMIUM_MONTHLY;
        }
      } else {
        if (interval === 'annual') {
          priceId = STRIPE_PRODUCTS.FAMILY_ANNUAL.priceId;
          planDetails = STRIPE_PRODUCTS.FAMILY_ANNUAL;
        } else {
          priceId = STRIPE_PRODUCTS.FAMILY_MONTHLY.priceId;
          planDetails = STRIPE_PRODUCTS.FAMILY_MONTHLY;
        }
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Unable to determine pricing for selected plan',
          code: 'PRICING_ERROR'
        },
        { status: 500 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    
    try {
      const checkoutSession = await createCheckoutSession({
        userId: session.user.id,
        email: session.user.email,
        priceId,
        successUrl: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/pricing?cancelled=true`,
        trialDays: 14, // 14-day free trial
      });

      return NextResponse.json({
        success: true,
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        plan: {
          name: plan.toUpperCase(),
          interval,
          amount: planDetails.amount,
          currency: planDetails.currency,
          priceId,
        },
        trialDays: 14,
      });
    } catch (stripeError) {
      console.error('Stripe checkout session creation failed:', stripeError);
      
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session. Please try again.',
          code: 'STRIPE_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(stripeError) : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected checkout error:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Handle GET requests to provide pricing information
export async function GET() {
  try {
    const pricingInfo = {
      plans: {
        premium: {
          name: 'Premium',
          monthly: {
            amount: STRIPE_PRODUCTS.PREMIUM_MONTHLY.amount,
            currency: STRIPE_PRODUCTS.PREMIUM_MONTHLY.currency,
            priceId: STRIPE_PRODUCTS.PREMIUM_MONTHLY.priceId,
            displayPrice: '$9.99',
          },
          annual: {
            amount: STRIPE_PRODUCTS.PREMIUM_ANNUAL.amount,
            currency: STRIPE_PRODUCTS.PREMIUM_ANNUAL.currency,
            priceId: STRIPE_PRODUCTS.PREMIUM_ANNUAL.priceId,
            displayPrice: '$99.99',
            savings: '$19.89',
            monthlyEquivalent: '$8.33',
          },
        },
        family: {
          name: 'Family',
          monthly: {
            amount: STRIPE_PRODUCTS.FAMILY_MONTHLY.amount,
            currency: STRIPE_PRODUCTS.FAMILY_MONTHLY.currency,
            priceId: STRIPE_PRODUCTS.FAMILY_MONTHLY.priceId,
            displayPrice: '$14.99',
          },
          annual: {
            amount: STRIPE_PRODUCTS.FAMILY_ANNUAL.amount,
            currency: STRIPE_PRODUCTS.FAMILY_ANNUAL.currency,
            priceId: STRIPE_PRODUCTS.FAMILY_ANNUAL.priceId,
            displayPrice: '$149.99',
            savings: '$29.89',
            monthlyEquivalent: '$12.50',
          },
        },
      },
      trialDays: 14,
      features: {
        free: [
          'Basic meal planning',
          '5 recipes per week',
          'Standard shopping lists',
          'Basic nutrition info',
        ],
        premium: [
          'Unlimited meal planning',
          'AI recipe generation',
          'Smart shopping lists with optimization',
          'Advanced nutrition tracking',
          'PDF exports',
          'Progress analytics',
        ],
        family: [
          'Everything in Premium',
          'Up to 6 family members',
          'Family meal preferences',
          'Shared shopping lists',
          'Kids nutrition tracking',
          'Family progress reports',
        ],
      },
    };

    return NextResponse.json(pricingInfo);
  } catch (error) {
    console.error('Error fetching pricing info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing information' },
      { status: 500 }
    );
  }
}