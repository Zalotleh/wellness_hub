// app/not-found.tsx
'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
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
            className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Looking for something specific?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/recipes"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-400 transition-all group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🍽️</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Recipes</p>
                <p className="text-xs text-gray-600">Browse healthy recipes</p>
              </div>
            </Link>

            <Link
              href="/meal-planner"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 hover:border-blue-400 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">📅</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Meal Planner</p>
                <p className="text-xs text-gray-600">Plan your week</p>
              </div>
            </Link>

            <Link
              href="/progress"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-400 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">📊</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Progress</p>
                <p className="text-xs text-gray-600">Track your journey</p>
              </div>
            </Link>

            <Link
              href="/advisor"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:border-yellow-400 transition-all group"
            >
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">AI Advisor</p>
                <p className="text-xs text-gray-600">Get nutrition help</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500">
          Need help? Contact our support team or check our{' '}
          <Link href="/learn" className="text-purple-600 hover:text-purple-700 underline">
            learning center
          </Link>
        </p>
      </div>
    </div>
  );
}
