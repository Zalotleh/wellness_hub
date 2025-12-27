import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Heart, ChefHat, TrendingUp, Users, Sparkles, ArrowRight, Check } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

export default async function HomePage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  // If user is logged in, redirect to recipes page
  if (session) {
    redirect('/recipes');
  }

  const features = [
    {
      icon: ChefHat,
      title: 'Recipe Creation',
      description: 'Create and share health-boosting recipes aligned with the 5x5x5 system',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Sparkles,
      title: 'AI Recipe Generator',
      description: 'Let AI create personalized recipes based on your health goals',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Track your daily food intake and visualize your health journey',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with others and share your wellness journey',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const benefits = [
    'Evidence-based nutritional guidance',
    'Track 5 defense systems daily',
    'AI-powered recipe generation',
    'Community support and sharing',
    'Visual progress analytics',
    'Personalized meal planning',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Eat to Beat Disease with{' '}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                5x5x5 System
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-200 mb-8 max-w-3xl mx-auto">
              Join thousands using Dr. William Li's revolutionary 5x5x5 framework to harness the power of food for better health and disease prevention.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold text-lg shadow-lg border-2 border-gray-200 dark:border-gray-600"
              >
                Sign In
              </Link>
            </div>

            {/* Social Proof */}
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-300">
              Join 10,000+ people on their health journey
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Defense Systems Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Five Defense Systems for Optimal Health
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200 max-w-3xl mx-auto">
              Based on cutting-edge research, each system plays a crucial role in disease prevention
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(DefenseSystem).map((system) => {
              const info = DEFENSE_SYSTEMS[system];
              return (
                <div
                  key={system}
                  className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg dark:hover:shadow-xl dark:shadow-gray-900/50 ${info.bgColor} ${info.borderColor} dark:bg-opacity-10`}
                >
                  <div className="text-4xl mb-3">{info.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {info.displayName}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">{info.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {info.keyFoods.slice(0, 3).map((food) => (
                      <span
                        key={food}
                        className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full font-medium text-gray-700 dark:text-gray-200"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Your Health Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200">
              Powerful tools to help you eat to beat disease
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-xl dark:hover:shadow-2xl dark:shadow-gray-900/50 transition-all border dark:border-gray-700"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-200">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose 5x5x5 Wellness Hub?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-200">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Start Your Journey Today
                </h3>
                <p className="text-gray-600 dark:text-gray-200 mb-6">
                  Join our community and discover how the right foods can transform your health.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Free to get started</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>No credit card required</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Access to all features</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-bold text-center"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Join thousands of people using food as medicine to prevent and fight disease
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold text-lg shadow-xl"
          >
            <span>Start Your Free Journey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}