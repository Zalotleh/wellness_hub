// app/not-found.tsx
'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            404
          </div>
          <div className="mt-4">
            <span className="text-6xl">🤷‍♂️</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-200 mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps it never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/"
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Looking for something specific?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/recipes"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 transition-all group"
            >
              <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🍽️</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">Recipes</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Browse healthy recipes</p>
              </div>
            </Link>

            <Link
              href="/meal-planner"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">📅</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">Meal Planner</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Plan your week</p>
              </div>
            </Link>

            <Link
              href="/progress"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">📊</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">Progress</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Track your journey</p>
              </div>
            </Link>

            <Link
              href="/advisor"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all group"
            >
              <div className="w-10 h-10 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">AI Advisor</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Get nutrition help</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-300">
          Need help? Contact our support team or check our{' '}
          <Link href="/learn" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">
            learning center
          </Link>
        </p>
      </div>
    </div>
  );
}
