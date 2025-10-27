// app/(dashboard)/upgrade/page.tsx
'use client';

import { Crown, Check, X, Star, Zap, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function UpgradePage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      current: true,
      features: [
        { name: '1 meal plan per month', included: true },
        { name: '10 AI questions per month', included: true },
        { name: 'Basic recipes', included: true },
        { name: 'Community access', included: true },
        { name: 'Unlimited meal plans', included: false },
        { name: 'Advanced AI features', included: false },
        { name: 'Priority support', included: false },
        { name: 'Export to PDF', included: false },
      ]
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      description: 'For serious meal planners',
      popular: true,
      features: [
        { name: 'Unlimited meal plans', included: true },
        { name: 'Unlimited AI questions', included: true },
        { name: 'Advanced recipe generation', included: true },
        { name: 'Smart shopping lists', included: true },
        { name: 'Export to PDF', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Family sharing', included: false },
      ]
    },
    {
      name: 'Family',
      price: '$19.99',
      period: 'per month',
      description: 'Perfect for families',
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Up to 6 family members', included: true },
        { name: 'Shared meal plans', included: true },
        { name: 'Family calendar integration', included: true },
        { name: 'Bulk shopping lists', included: true },
        { name: 'Priority phone support', included: true },
        { name: 'Custom meal templates', included: true },
        { name: 'Advanced health tracking', included: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited meal planning, advanced AI features, and premium tools to transform your nutrition journey.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-green-100 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Unlimited Everything</h3>
            <p className="text-sm text-gray-600">No limits on meal plans, recipes, or AI questions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-blue-100 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Advanced AI</h3>
            <p className="text-sm text-gray-600">Smart recipe generation and personalized recommendations</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-purple-100 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Family Sharing</h3>
            <p className="text-sm text-gray-600">Share plans and lists with family members</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-amber-100 p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Priority Support</h3>
            <p className="text-sm text-gray-600">Get help when you need it most</p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg ${
                plan.popular ? 'ring-2 ring-amber-500 scale-105' : ''
              } ${plan.current ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 rounded-t-lg">
                  <span className="font-medium">Most Popular</span>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  
                  {plan.current ? (
                    <div className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      {plan.name === 'Premium' ? 'Start Free Trial' : 'Choose Plan'}
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">Yes! Premium plans come with a 14-day free trial. No credit card required to start.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">What happens to my data?</h3>
              <p className="text-gray-600 text-sm">Your meal plans and recipes are always yours. Even if you downgrade, you keep access to everything you've created.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Need help choosing?</h3>
              <p className="text-gray-600 text-sm">Contact our support team for personalized recommendations based on your needs.</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link 
            href="/meal-planner"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Meal Planner
          </Link>
        </div>
      </div>
    </div>
  );
}