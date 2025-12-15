'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ErrorDetails {
  code: string;
  message: string;
  suggestion: string;
  actionText: string;
  actionUrl: string;
}

const ERROR_MAPPING: Record<string, ErrorDetails> = {
  'payment_failed': {
    code: 'PAYMENT_FAILED',
    message: 'Your payment could not be processed',
    suggestion: 'Please check your card details and try again, or use a different payment method.',
    actionText: 'Try Again',
    actionUrl: '/pricing',
  },
  'card_declined': {
    code: 'CARD_DECLINED',
    message: 'Your card was declined',
    suggestion: 'Your bank declined the transaction. Please contact your bank or try a different card.',
    actionText: 'Use Different Card',
    actionUrl: '/pricing',
  },
  'insufficient_funds': {
    code: 'INSUFFICIENT_FUNDS',
    message: 'Insufficient funds',
    suggestion: 'Your card has insufficient funds. Please try a different payment method.',
    actionText: 'Try Different Card',
    actionUrl: '/pricing',
  },
  'expired_card': {
    code: 'EXPIRED_CARD',
    message: 'Your card has expired',
    suggestion: 'Please update your card information and try again.',
    actionText: 'Update Card',
    actionUrl: '/pricing',
  },
  'authentication_required': {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Additional authentication required',
    suggestion: 'Your bank requires additional verification. Please complete the authentication and try again.',
    actionText: 'Try Again',
    actionUrl: '/pricing',
  },
  'processing_error': {
    code: 'PROCESSING_ERROR',
    message: 'Payment processing error',
    suggestion: 'There was an error processing your payment. Please try again in a few minutes.',
    actionText: 'Try Again',
    actionUrl: '/pricing',
  },
  'cancelled': {
    code: 'CANCELLED',
    message: 'Payment was cancelled',
    suggestion: 'You cancelled the payment process. No charges were made to your account.',
    actionText: 'Try Again',
    actionUrl: '/pricing',
  },
  'session_expired': {
    code: 'SESSION_EXPIRED',
    message: 'Payment session expired',
    suggestion: 'Your payment session has expired. Please start the checkout process again.',
    actionText: 'Start Over',
    actionUrl: '/pricing',
  },
  'default': {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    suggestion: 'Something went wrong with your payment. Please try again or contact support if the problem persists.',
    actionText: 'Try Again',
    actionUrl: '/pricing',
  },
};

export default function PaymentError() {
  const searchParams = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails>(ERROR_MAPPING.default);

  useEffect(() => {
    const errorType = searchParams.get('error') || 'default';
    const customMessage = searchParams.get('message');
    
    const details = ERROR_MAPPING[errorType] || ERROR_MAPPING.default;
    
    if (customMessage) {
      details.message = customMessage;
    }
    
    setErrorDetails(details);
  }, [searchParams]);

  const handleContactSupport = () => {
    // In a real app, this would open a support ticket or chat
    window.location.href = 'mailto:support@wellnesshub.com?subject=Payment Issue&body=I encountered a payment error: ' + errorDetails.code;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 mx-4">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Payment Failed
          </h1>
          
          {/* Error Message */}
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-200">
            {errorDetails.message}
          </p>

          {/* Suggestion */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>What can you do?</strong><br />
              {errorDetails.suggestion}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            <Link
              href={errorDetails.actionUrl}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              {errorDetails.actionText}
            </Link>
            
            <button
              onClick={handleContactSupport}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 transition-colors"
            >
              Contact Support
            </button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Common Solutions</h3>
            <ul className="text-left text-sm text-gray-600 dark:text-gray-200 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Check that your card details are correct
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Ensure your card has sufficient funds
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Try using a different browser or device
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Contact your bank if the card keeps getting declined
              </li>
            </ul>
          </div>

          {/* Error Code */}
          <div className="mt-6">
            <p className="text-xs text-gray-400 dark:text-gray-300">
              Error Code: {errorDetails.code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}