'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SubscriptionDetails {
  plan: string;
  status: string;
  trialEnd?: string;
  currentPeriodEnd?: string;
}

export default function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!sessionId) {
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    // In a real app, you would verify the session with Stripe
    // For now, we'll simulate successful subscription activation
    setTimeout(() => {
      setSubscriptionDetails({
        plan: 'Premium',
        status: 'trialing',
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
      setIsLoading(false);
    }, 1500);
  }, [session, status, sessionId, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-200">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-200">{error}</p>
            <div className="mt-6">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Back to Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 mx-4">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to {subscriptionDetails?.plan}! 🎉
          </h1>
          
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-200">
            Your subscription has been successfully activated.
          </p>

          {/* Subscription Details */}
          {subscriptionDetails && (
            <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-200">Plan:</span>
                  <span className="font-medium text-gray-900">{subscriptionDetails.plan}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-200">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {subscriptionDetails.status === 'trialing' ? 'Free Trial' : subscriptionDetails.status}
                  </span>
                </div>
                
                {subscriptionDetails.trialEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-200">Trial ends:</span>
                    <span className="font-medium text-gray-900">{subscriptionDetails.trialEnd}</span>
                  </div>
                )}
                
                {subscriptionDetails.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-200">Next billing date:</span>
                    <span className="font-medium text-gray-900">{subscriptionDetails.currentPeriodEnd}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="mt-8 text-left bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Start creating your first meal plan with unlimited recipes
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Use AI to generate personalized recipes based on your preferences
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Export your meal plans to PDF for easy sharing
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Track your nutrition and wellness progress
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            
            <Link
              href="/meal-planner"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 transition-colors"
            >
              Create Meal Plan
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Need help getting started?{' '}
              <Link href="/support" className="font-medium text-green-600 hover:text-green-500">
                Contact our support team
              </Link>
            </p>
            
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-300">
              You can manage your subscription anytime from your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}