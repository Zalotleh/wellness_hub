'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: () => void;
  disabled?: boolean;
}

interface PricingData {
  plans: {
    premium: {
      name: string;
      monthly: any;
      annual: any;
    };
    family: {
      name: string;
      monthly: any;
      annual: any;
    };
  };
  trialDays: number;
  features: {
    free: string[];
    premium: string[];
    family: string[];
  };
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data');
      }
      const data = await response.json();
      setPricingData(data);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setError('Failed to load pricing information');
    }
  };

  const handleCheckout = async (plan: 'premium' | 'family', interval: 'monthly' | 'annual') => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try Stripe checkout first
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      // If Stripe fails, fall back to test upgrade for development
      console.log('Stripe checkout failed, using test upgrade:', data.error);
      
      const testResponse = await fetch('/api/upgrade-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
        }),
      });

      const testData = await testResponse.json();

      if (testResponse.ok) {
        // Show success message and redirect
        alert(`🎉 ${testData.message}\n\nNote: This is a test upgrade for development purposes.`);
        if (testData.redirectUrl) {
          router.push(testData.redirectUrl);
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(testData.error || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreePlan = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    router.push('/dashboard');
  };

  if (!pricingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-200">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  const tiers: PricingTier[] = [
    {
      name: 'Free',
      price: '$0',
      interval: '',
      description: 'Perfect for getting started with meal planning',
      features: pricingData.features.free,
      buttonText: session ? 'Current Plan' : 'Get Started Free',
      buttonAction: handleFreePlan,
      disabled: false,
    },
    {
      name: 'Premium',
      price: billingInterval === 'monthly' 
        ? pricingData.plans.premium.monthly.displayPrice
        : pricingData.plans.premium.annual.displayPrice,
      interval: billingInterval === 'monthly' ? '/month' : '/year',
      description: 'Advanced features for serious meal planners',
      features: pricingData.features.premium,
      popular: true,
      buttonText: `Start ${pricingData.trialDays}-Day Trial`,
      buttonAction: () => handleCheckout('premium', billingInterval),
      disabled: isLoading,
    },
    {
      name: 'Family',
      price: billingInterval === 'monthly' 
        ? pricingData.plans.family.monthly.displayPrice
        : pricingData.plans.family.annual.displayPrice,
      interval: billingInterval === 'monthly' ? '/month' : '/year',
      description: 'Perfect for families with kids and multiple preferences',
      features: pricingData.features.family,
      buttonText: `Start ${pricingData.trialDays}-Day Trial`,
      buttonAction: () => handleCheckout('family', billingInterval),
      disabled: isLoading,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Wellness Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-200 mb-8">
            Start your health journey with our meal planning tools
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={cn(
              "text-sm font-medium",
              billingInterval === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'
            )}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
              className="mx-3 relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  billingInterval === 'annual' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn(
              "text-sm font-medium",
              billingInterval === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300'
            )}>
              Annual
            </span>
            {billingInterval === 'annual' && (
              <span className="ml-2 text-sm text-green-600 font-semibold">
                Save up to $30/year
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                  "relative rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-sm",
                  tier.popular 
                    ? "border-green-500 ring-2 ring-green-500 dark:ring-green-700" 
                    : "border-gray-200 dark:border-gray-700"
                )}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {tier.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                  {tier.interval && (
                    <span className="text-lg text-gray-600 dark:text-gray-200">
                      {tier.interval}
                    </span>
                  )}
                  {billingInterval === 'annual' && tier.name !== 'Free' && pricingData && (
                    <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                      {tier.name === 'Premium' 
                        ? `${pricingData.plans.premium.annual.monthlyEquivalent}/month when billed annually`
                        : `${pricingData.plans.family.annual.monthlyEquivalent}/month when billed annually`
                      }
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-200 mb-6">
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-3 text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={tier.buttonAction}
                disabled={tier.disabled}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                  tier.popular
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50 dark:bg-gray-700 disabled:text-gray-400 dark:text-gray-300",
                  tier.disabled && "cursor-not-allowed"
                )}
              >
                {tier.disabled && isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  tier.buttonText
                )}
              </button>

              {tier.name !== 'Free' && (
                <p className="text-xs text-gray-500 dark:text-gray-300 text-center mt-4">
                  {pricingData.trialDays} days free, then {tier.price}{tier.interval}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-200">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens after the free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-200">
                After your {pricingData.trialDays}-day free trial, you'll be charged for your selected plan. You can cancel before the trial ends to avoid any charges.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-gray-600 dark:text-gray-200">
                Absolutely! You can upgrade or downgrade your plan at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}