'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubscriptionInfo {
  tier: 'FREE' | 'PREMIUM' | 'FAMILY';
  status: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
}

export default function SubscriptionManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchSubscriptionInfo();
  }, [session, status, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate subscription data
      setTimeout(() => {
        setSubscriptionInfo({
          tier: 'PREMIUM',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          trialEndsAt: undefined,
          cancelAtPeriodEnd: false,
          stripeCustomerId: 'cus_example123',
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      setError('Failed to load subscription information');
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your current billing period.')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // In a real app, this would call your API to cancel the subscription
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setSubscriptionInfo(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true,
      } : null);
      
      alert('Your subscription has been scheduled for cancellation at the end of your billing period.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // In a real app, this would call your API to reactivate the subscription
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setSubscriptionInfo(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false,
      } : null);
      
      alert('Your subscription has been reactivated and will continue automatically.');
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setError('Failed to reactivate subscription. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // In a real app, this would create a Stripe customer portal session
      // For now, we'll just show an alert
      alert('This would redirect to Stripe Customer Portal for billing management.');
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      setError('Failed to access billing portal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Subscription Management</h2>
          <p className="text-gray-600 dark:text-gray-200 mb-6">Unable to load subscription information.</p>
          <button
            onClick={fetchSubscriptionInfo}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          Cancels {subscriptionInfo?.currentPeriodEnd}
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            Free Trial
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Subscription Management</h1>
        <p className="text-gray-600 dark:text-gray-200">Manage your plan, billing, and subscription settings.</p>
      </div>

      {/* Error Message */}
      {error && (
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
      )}

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Current Plan</h2>
        
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {subscriptionInfo.tier} Plan
            </h3>
            <div className="mt-2 flex items-center space-x-3">
              {getStatusBadge(subscriptionInfo.status, subscriptionInfo.cancelAtPeriodEnd)}
              {subscriptionInfo.trialEndsAt && (
                <span className="text-sm text-gray-600 dark:text-gray-200">
                  Trial ends: {subscriptionInfo.trialEndsAt}
                </span>
              )}
              {subscriptionInfo.currentPeriodEnd && !subscriptionInfo.cancelAtPeriodEnd && (
                <span className="text-sm text-gray-600 dark:text-gray-200">
                  Renews: {subscriptionInfo.currentPeriodEnd}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {subscriptionInfo.tier === 'FREE' ? (
              <button
                onClick={handleUpgrade}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Upgrade Plan
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Change Plan
              </button>
            )}
          </div>
        </div>

        {/* Plan Features */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your plan includes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptionInfo.tier === 'FREE' && (
              <>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic meal planning
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  5 recipes per week
                </div>
              </>
            )}
            {subscriptionInfo.tier === 'PREMIUM' && (
              <>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited meal planning
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI recipe generation
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  PDF exports
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced nutrition tracking
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {subscriptionInfo.tier !== 'FREE' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Subscription</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleManageBilling}
              disabled={isProcessing}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              Manage Billing
            </button>
            
            {subscriptionInfo.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivateSubscription}
                disabled={isProcessing}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Reactivate Subscription
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="flex items-center justify-center px-4 py-3 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}