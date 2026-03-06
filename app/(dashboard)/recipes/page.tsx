'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from '@/components/recipes/RecipeCard';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Search, SlidersHorizontal, Plus, Sparkles, ChefHat, User, X, Info, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function RecipesPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedDietaryRestriction, setSelectedDietaryRestriction] = useState<string | null>(null);
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

  // Apply client-side filtering for meal type and dietary restrictions
  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedMealType && recipe.mealType !== selectedMealType) {
      return false;
    }
    if (selectedDietaryRestriction && (!recipe.dietaryRestrictions || !recipe.dietaryRestrictions.includes(selectedDietaryRestriction))) {
      return false;
    }
    return true;
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSystem(null);
    setSelectedMealType(null);
    setSelectedDietaryRestriction(null);
    setSortBy('recent');
    setFilterByUser(null);
  };

  const handleFilterByCreator = (userId: string, _userName: string) => {
    setFilterByUser(userId);
    setShowFilters(true);
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
    selectedMealType,
    selectedDietaryRestriction,
    sortBy !== 'recent',
    filterByUser,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Sticky Top Nav ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Community Recipes</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Discover 5x5x5 health-boosting recipes</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/recipes/ai-generate"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all font-medium text-sm shadow-sm shadow-green-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Generate</span>
            </Link>
            <Link
              href="/recipes/create"
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Recipe</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-teal-600 to-emerald-700 text-white">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold mb-4">
                <ChefHat className="w-3.5 h-3.5" />
                5x5x5 Community
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">Health-Boosting Recipes</h2>
              <p className="text-white/80 text-sm max-w-md">
                Browse recipes crafted around Dr. William Li&apos;s five defense systems — nourish your body, one meal at a time.
              </p>
            </div>
            {!loading && pagination.total > 0 && (
              <div className="flex gap-4 sm:gap-6 flex-shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-extrabold">{pagination.total}</div>
                  <div className="text-xs text-white/70 mt-0.5">Recipes</div>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold">5</div>
                  <div className="text-xs text-white/70 mt-0.5">Systems</div>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold">∞</div>
                  <div className="text-xs text-white/70 mt-0.5">Possibilities</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Search & Filter Bar ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors placeholder:text-gray-400 text-sm"
                placeholder="Search recipes, ingredients, or creator…"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'rating')}
              className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
            {session?.user?.id && (
              <button
                onClick={() => setFilterByUser(filterByUser === session.user.id ? null : session.user.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  filterByUser === session.user.id
                    ? 'bg-teal-500 text-white'
                    : 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">My Recipes</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-green-500 text-white'
                  : 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              {/* Defense System */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Defense System</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSystem(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSystem === null ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >All</button>
                  {Object.values(DefenseSystem).map((system) => {
                    const info = DEFENSE_SYSTEMS[system];
                    const isSelected = selectedSystem === system;
                    return (
                      <button
                        key={system}
                        onClick={() => setSelectedSystem(isSelected ? null : system)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? `${info.bgColor} ${info.textColor} ring-2 ring-offset-1 ${info.borderColor}`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span>{info.icon}</span>
                        {info.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal Type */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Meal Type</p>
                <div className="flex flex-wrap gap-2">
                  {([null, 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as (string | null)[]).map((type) => (
                    <button
                      key={type ?? 'all'}
                      onClick={() => setSelectedMealType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        selectedMealType === type
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type ?? 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Dietary</p>
                <div className="flex flex-wrap gap-2">
                  {([null, 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'] as (string | null)[]).map((r) => (
                    <button
                      key={r ?? 'all'}
                      onClick={() => setSelectedDietaryRestriction(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        selectedDietaryRestriction === r
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {r ?? 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creator */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Creator</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterByUser(null)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      filterByUser === null ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" /> All Creators
                  </button>
                  {session?.user?.id && (
                    <button
                      onClick={() => setFilterByUser(filterByUser === session.user.id ? null : session.user.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        filterByUser === session.user.id ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> My Recipes
                    </button>
                  )}
                </div>
                {filterByUser && (
                  <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
                    {filterByUser === session?.user?.id ? 'Showing your recipes only' : 'Filtered by a specific creator — click "All Creators" to reset'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Help Banner ─────────────────────────────────────── */}
        {showHelpBanner && !filterByUser && recipes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-teal-900 dark:text-teal-300 mb-0.5">💡 Discover by Creator</p>
                <p className="text-xs text-teal-700 dark:text-teal-400">Click any creator&apos;s name on a recipe card to instantly filter by their recipes.</p>
              </div>
            </div>
            <button onClick={dismissHelpBanner} className="flex-shrink-0 p-1 hover:bg-teal-100 dark:hover:bg-teal-800/40 rounded-lg transition-colors" aria-label="Dismiss">
              <X className="w-3.5 h-3.5 text-teal-500" />
            </button>
          </div>
        )}

        {/* ── Results Summary ──────────────────────────────────── */}
        {!loading && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-800 dark:text-white">{filteredRecipes.length}</span> of{' '}
              <span className="font-semibold text-gray-800 dark:text-white">{pagination.total}</span> recipes
              {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
              {selectedSystem && <span> in {DEFENSE_SYSTEMS[selectedSystem].displayName}</span>}
              {filterByUser === session?.user?.id && <span className="text-teal-600 dark:text-teal-400 font-medium"> (My Recipes)</span>}
            </p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Recipe Grid ──────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900" />
              <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading delicious recipes…</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No recipes found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm text-sm">
              {searchQuery || selectedSystem || selectedMealType || selectedDietaryRestriction
                ? 'Try adjusting your filters or search query'
                : 'Be the first to create a recipe for the community!'}
            </p>
            <div className="flex items-center gap-3">
              {(searchQuery || selectedSystem || selectedMealType || selectedDietaryRestriction) && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/recipes/create"
                className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-sm shadow-sm shadow-green-500/20"
              >
                Create Recipe
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFilterByCreator={handleFilterByCreator}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1.5">
                <button
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const current = pagination.page;
                      return page === 1 || page === pagination.totalPages || (page >= current - 1 && page <= current + 1);
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-1 text-gray-400 text-sm">…</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                            pagination.page === page
                              ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                              : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FABs */}
      <div className="md:hidden fixed bottom-6 right-4 flex flex-col gap-2 z-20">
        <Link
          href="/recipes/ai-generate"
          className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center hover:shadow-xl transition-all"
          title="AI Generate"
        >
          <Sparkles className="w-5 h-5" />
        </Link>
        <Link
          href="/recipes/create"
          className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
          title="Create Recipe"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <Footer />
    </div>
  );
}
