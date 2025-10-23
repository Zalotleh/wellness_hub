'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from '@/components/recipes/RecipeCard';
import { DefenseSystem } from '@prisma/client';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Search, SlidersHorizontal, Plus, Sparkles, ChefHat, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const { recipes, loading, pagination, goToPage, nextPage, prevPage } = useRecipes({
    search: searchQuery,
    system: selectedSystem || undefined,
    sortBy,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSystem(null);
    setSortBy('recent');
  };

  const activeFiltersCount = [
    searchQuery,
    selectedSystem,
    sortBy !== 'recent',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Community Recipes
              </h1>
              <p className="text-gray-600">
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
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Search recipes by name or ingredient..."
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Filter by Defense System</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
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
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-lg">{info.icon}</span>
                        <span className="ml-1 text-xs">{info.displayName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
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
              <p className="text-gray-600">Loading delicious recipes...</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedSystem
                ? 'Try adjusting your filters or search query'
                : 'Be the first to create a recipe!'}
            </p>
            <div className="flex items-center justify-center space-x-3">
              {(searchQuery || selectedSystem) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            pagination.page === page
                              ? 'bg-green-500 text-white'
                              : 'border-2 border-gray-300 hover:bg-gray-50'
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
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
    </div>
  );
}