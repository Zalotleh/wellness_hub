// app/(dashboard)/shopping-lists/page.tsx
'use client';

import { ShoppingCart, Plus, Filter, Search, Calendar, Check } from 'lucide-react';
import Link from 'next/link';

export default function ShoppingListsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Shopping Lists</h1>
                <p className="text-gray-600">Smart shopping lists from your meal plans</p>
              </div>
            </div>
            <Link 
              href="/meal-planner"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create from Meal Plan</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">0</p>
                <p className="text-sm text-gray-600">Active Lists</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">0</p>
                <p className="text-sm text-gray-600">Items Purchased</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">0</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shopping lists..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Smart Shopping Lists Coming Soon!</h2>
            <p className="text-gray-600 mb-8">
              Automatically generate smart shopping lists from your meal plans with pantry management and price estimates.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">What you'll be able to do:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-generate lists from meal plans</li>
                  <li>• Track pantry inventory</li>
                  <li>• Get price estimates</li>
                  <li>• Share lists with family members</li>
                  <li>• Check off items on mobile</li>
                  <li>• Sync with grocery store apps</li>
                </ul>
              </div>
              <Link 
                href="/meal-planner"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Meal Plan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}