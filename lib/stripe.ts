import Stripe from 'stripe';
import { prisma } from './prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Using latest stable API version
  apiVersion: '2025-09-30.clover',
});

// Product and price definitions
export const STRIPE_PRODUCTS = {
  PREMIUM_MONTHLY: {
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    amount: 999, // $9.99
    currency: 'usd',
    interval: 'month' as const,
  },
  PREMIUM_ANNUAL: {
    priceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || 'price_premium_annual',
    amount: 9999, // $99.99 (save $19.89)
    currency: 'usd',
    interval: 'year' as const,
  },
  FAMILY_MONTHLY: {
    priceId: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID || 'price_family_monthly',
    amount: 1499, // $14.99
    currency: 'usd',
    interval: 'month' as const,
  },
  FAMILY_ANNUAL: {
    priceId: process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID || 'price_family_annual',
    amount: 14999, // $149.99 (save $29.89)
    currency: 'usd',
    interval: 'year' as const,
  },
} as const;

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'FAMILY';
export type BillingInterval = 'monthly' | 'annual';

interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
  trialDays = 14,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  try {
    // Create or retrieve Stripe customer
    const customer = await getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
        },
      },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      automatic_tax: {
        enabled: true,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<Stripe.Customer> {
  try {
    // Check if user already has a Stripe customer ID
    // Note: This would require adding stripeCustomerId field to User schema
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    // For now, we'll create a new customer each time
    // In production, you'd store and retrieve the customer ID
    const customer = await stripe.customers.create({
      email,
      name: user?.name || undefined,
      metadata: {
        userId,
      },
    });

    // In production, you'd update the user with the customer ID:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { stripeCustomerId: customer.id },
    // });

    return customer;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    throw new Error('Failed to manage customer');
  }
}

export async function handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // The subscription will be handled by subscription.created event
  console.log(`Checkout completed for user ${userId}, session ${session.id}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const tier = getSubscriptionTier(subscription);
  const subscriptionData = subscription as any;
  const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);

  try {
    // For now, we'll just log the subscription creation
    // In production, you'd update the user record:
    console.log(`Subscription created for user ${userId}: ${tier}`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });

    // Uncomment when Prisma schema is updated:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     subscriptionTier: tier,
    //     stripeSubscriptionId: subscription.id,
    //     subscriptionStatus: subscription.status,
    //     currentPeriodEnd,
    //     trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    //   },
    // });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const tier = getSubscriptionTier(subscription);
  const subscriptionData = subscription as any;
  const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);

  try {
    // For now, we'll just log the subscription update
    console.log(`Subscription updated for user ${userId}: ${tier}, status: ${subscription.status}`, {
      subscriptionId: subscription.id,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });

    // Uncomment when Prisma schema is updated:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     subscriptionTier: tier,
    //     subscriptionStatus: subscription.status,
    //     currentPeriodEnd,
    //     trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    //   },
    // });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  try {
    // For now, we'll just log the subscription cancellation
    console.log(`Subscription canceled for user ${userId}`);

    // Uncomment when Prisma schema is updated:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     subscriptionTier: 'FREE',
    //     subscriptionStatus: 'canceled',
    //     stripeSubscriptionId: null,
    //     currentPeriodEnd: null,
    //     trialEndsAt: null,
    //   },
    // });
  } catch (error) {
    console.error('Error canceling user subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Type assertion to access subscription property
  const invoiceWithSub = invoice as any;
  if (!invoiceWithSub.subscription) return;

  console.log(`Payment succeeded for subscription ${invoiceWithSub.subscription}`);
  // Additional logic can be added here (e.g., sending confirmation emails)
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Type assertion to access subscription property
  const invoiceWithSub = invoice as any;
  if (!invoiceWithSub.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoiceWithSub.subscription);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata for failed payment');
    return;
  }

  try {
    // For now, we'll just log the payment failure
    console.log(`Payment failed for user ${userId}, subscription ${subscription.id}`);

    // Uncomment when Prisma schema is updated:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     subscriptionStatus: 'past_due',
    //   },
    // });

    // Additional logic: send email notification, implement retry logic, etc.
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

function getSubscriptionTier(subscription: Stripe.Subscription): SubscriptionTier {
  const priceId = subscription.items.data[0]?.price.id;
  
  switch (priceId) {
    case STRIPE_PRODUCTS.PREMIUM_MONTHLY.priceId:
    case STRIPE_PRODUCTS.PREMIUM_ANNUAL.priceId:
      return 'PREMIUM';
    case STRIPE_PRODUCTS.FAMILY_MONTHLY.priceId:
    case STRIPE_PRODUCTS.FAMILY_ANNUAL.priceId:
      return 'FAMILY';
    default:
      return 'FREE';
  }
}

// Customer portal for managing subscriptions
export async function createCustomerPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription');
  }
}

export default stripe;