'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from '@/components/recipes/RecipeCard';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Search, SlidersHorizontal, Plus, Sparkles, ChefHat, Loader2, User, X, Info } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function RecipesPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [filterByUser, setFilterByUser] = useState<string | null>(null);
  const [showHelpBanner, setShowHelpBanner] = useState(() => {
    // Check if user has dismissed the banner before
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideCreatorTip') !== 'true';
    }
    return true;
  });

  const { recipes, loading, pagination, goToPage, nextPage, prevPage } = useRecipes({
    search: searchQuery,
    system: selectedSystem as DefenseSystem | undefined,
    sortBy,
    userId: filterByUser || undefined,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSystem(null);
    setSortBy('recent');
    setFilterByUser(null);
  };

  const handleFilterByCreator = (userId: string, userName: string) => {
    setFilterByUser(userId);
    setShowFilters(true);
    // Optionally scroll to top or show a notification
  };

  const dismissHelpBanner = () => {
    setShowHelpBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideCreatorTip', 'true');
    }
  };

  const activeFiltersCount = [
    searchQuery,
    selectedSystem,
    sortBy !== 'recent',
    filterByUser,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Community Recipes
              </h1>
              <p className="text-gray-600 dark:text-gray-200">
                Discover health-boosting recipes from our 5x5x5 community
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/recipes/ai-generate"
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>AI Generate</span>
              </Link>
              <Link
                href="/recipes/create"
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Recipe</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Search by recipe name, ingredient, or creator..."
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* My Recipes Quick Filter */}
              {session?.user?.id && (
                <button
                  onClick={() => setFilterByUser(filterByUser === session.user.id ? null : session.user.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    filterByUser === session.user.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">My Recipes</span>
                </button>
              )}

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Filter by Defense System</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    onClick={() => setSelectedSystem(null)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      selectedSystem === null
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  {Object.values(DefenseSystem).map((system) => {
                    const info = DEFENSE_SYSTEMS[system];
                    const isSelected = selectedSystem === system;

                    return (
                      <button
                        key={system}
                        onClick={() => setSelectedSystem(isSelected ? null : system)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                          isSelected
                ? `${info.bgColor} ${info.textColor} ring-2 ring-offset-2 ${info.borderColor}`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-lg">{info.icon}</span>
                        <span className="ml-1 text-xs">{info.displayName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Creator Filter */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Filter by Creator</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterByUser(null)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filterByUser === null
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>All Creators</span>
                    </button>
                    
                    {session?.user?.id && (
                      <button
                        onClick={() => setFilterByUser(filterByUser === session.user.id ? null : session.user.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          filterByUser === session.user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>My Recipes</span>
                      </button>
                    )}
                  </div>
                  
                    {filterByUser && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {filterByUser === session?.user?.id ? (
                          <>
                            <span className="font-medium">Showing only recipes created by you</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">Filtering by a specific creator</span>
                            <br />
                            <span className="text-xs text-blue-700 dark:text-blue-300">Click "All Creators" to remove filter</span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Banner - Dismissible Tip */}
        {showHelpBanner && !filterByUser && recipes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    💡 Quick Tip: Discover Recipes by Creator
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Click on any <span className="font-semibold underline">creator's name</span> on a recipe card to view all their recipes instantly!
                  </p>
                </div>
              </div>
              <button
                onClick={dismissHelpBanner}
                className="flex-shrink-0 p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                aria-label="Dismiss tip"
              >
                <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-200">
            {loading ? (
              'Loading recipes...'
            ) : (
              <>
                Showing <span className="font-semibold">{recipes.length}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> recipes
                {searchQuery && (
                  <span> matching "{searchQuery}"</span>
                )}
                {selectedSystem && (
                  <span> in {DEFENSE_SYSTEMS[selectedSystem].displayName}</span>
                )}
                {filterByUser === session?.user?.id && (
                  <span className="text-blue-600 font-medium"> (My Recipes)</span>
                )}
              </>
            )}
          </p>

          {/* View Toggle (Grid/List) - Optional */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Add view toggle buttons if needed */}
          </div>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-200">Loading delicious recipes...</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No recipes found</h3>
            <p className="text-gray-600 dark:text-gray-200 mb-6">
              {searchQuery || selectedSystem
                ? 'Try adjusting your filters or search query'
                : 'Be the first to create a recipe!'}
            </p>
            <div className="flex items-center justify-center space-x-3">
              {(searchQuery || selectedSystem) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/recipes/create"
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Create Recipe
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  onFilterByCreator={handleFilterByCreator}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const current = pagination.page;
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= current - 1 && page <= current + 1)
                      );
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500 dark:text-gray-300">...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            pagination.page === page
                              ? 'bg-green-500 text-white'
                              : 'border-2 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Quick Actions - Mobile */}
        <div className="md:hidden fixed bottom-4 right-4 flex flex-col space-y-2">
          <Link
            href="/recipes/ai-generate"
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-6 h-6" />
          </Link>
          <Link
            href="/recipes/create"
            className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}