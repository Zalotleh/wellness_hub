import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, handleSubscriptionWebhook } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { 
          error: 'Missing stripe-signature header',
          code: 'MISSING_SIGNATURE'
        },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { 
          error: 'Webhook secret not configured',
          code: 'WEBHOOK_CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook received: ${event.type} (${event.id})`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown signature verification error';
      console.error('Webhook signature verification failed:', errorMessage);
      
      return NextResponse.json(
        { 
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 400 }
      );
    }

    // Log the event for debugging
    console.log(`Processing webhook event: ${event.type}`);
    
    try {
      // Handle the webhook event
      await handleSubscriptionWebhook(event);
      
      // Log successful processing
      console.log(`Successfully processed webhook: ${event.type} (${event.id})`);
      
      return NextResponse.json({ 
        received: true,
        eventId: event.id,
        eventType: event.type
      });
    } catch (processingError) {
      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Unknown processing error';
      
      console.error('Error processing webhook:', {
        eventType: event.type,
        eventId: event.id,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Webhook processing failed',
          code: 'PROCESSING_ERROR',
          eventId: event.id,
          eventType: event.type,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected webhook error:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Unexpected webhook error',
        code: 'UNEXPECTED_ERROR',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for webhook testing
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'stripe-webhook',
    timestamp: new Date().toISOString(),
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';