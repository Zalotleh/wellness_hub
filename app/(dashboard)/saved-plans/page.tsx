// app/(dashboard)/saved-plans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Utensils, Clock, Users, Plus, CheckSquare, Square, Trash2, MoreVertical, Heart, X, Bookmark, Search, Filter, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DeleteConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import Footer from '@/components/layout/Footer';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

export default function SavedPlansPage() {
  const { data: session, status } = useSession();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedServings, setSelectedServings] = useState<number | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title' | 'duration'>('recent');

  useEffect(() => {
    if (session?.user) {
      fetchMealPlans();
    }
  }, [session]);

  // Apply filters whenever filters or mealPlans change
  useEffect(() => {
    applyFilters();
  }, [mealPlans, searchQuery, selectedDuration, selectedServings, selectedSystems, selectedRestrictions, selectedVisibility, sortBy]);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/meal-planner');
      
      if (!response.ok) {
        throw new Error('Failed to fetch meal plans');
      }

      const data = await response.json();
      console.log('📥 Fetched meal plans data:', data);
      
      // Handle different response structures
      let plans = [];
      if (Array.isArray(data)) {
        plans = data;
      } else if (data.data && Array.isArray(data.data)) {
        plans = data.data;
      } else if (data.mealPlans && Array.isArray(data.mealPlans)) {
        plans = data.mealPlans;
      } else {
        console.warn('Unexpected data structure:', data);
        plans = [];
      }
      
      setMealPlans(plans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      setError('Failed to load meal plans');
      setMealPlans([]); // Ensure it stays as an array even on error
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...mealPlans];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.title?.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query)
      );
    }

    // Duration filter
    if (selectedDuration !== null) {
      filtered = filtered.filter(plan => plan.durationWeeks === selectedDuration);
    }

    // Servings filter
    if (selectedServings !== null) {
      filtered = filtered.filter(plan => plan.defaultServings === selectedServings);
    }

    // Defense systems filter
    if (selectedSystems.length > 0) {
      filtered = filtered.filter(plan =>
        plan.focusSystems && selectedSystems.some((system: string) => plan.focusSystems.includes(system))
      );
    }

    // Dietary restrictions filter
    if (selectedRestrictions.length > 0) {
      filtered = filtered.filter(plan =>
        plan.dietaryRestrictions && selectedRestrictions.some((restriction: string) => plan.dietaryRestrictions.includes(restriction))
      );
    }

    // Visibility filter
    if (selectedVisibility) {
      filtered = filtered.filter(plan => plan.visibility === selectedVisibility);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'duration':
          return (b.durationWeeks || 0) - (a.durationWeeks || 0);
        default:
          return 0;
      }
    });

    setFilteredPlans(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDuration(null);
    setSelectedServings(null);
    setSelectedSystems([]);
    setSelectedRestrictions([]);
    setSelectedVisibility(null);
    setSortBy('recent');
  };

  const toggleSystem = (system: string) => {
    setSelectedSystems(prev =>
      prev.includes(system) ? prev.filter(s => s !== system) : [...prev, system]
    );
  };

  const toggleRestriction = (restriction: string) => {
    setSelectedRestrictions(prev =>
      prev.includes(restriction) ? prev.filter(r => r !== restriction) : [...prev, restriction]
    );
  };

  const hasActiveFilters = searchQuery || selectedDuration !== null || selectedServings !== null || 
                          selectedSystems.length > 0 || selectedRestrictions.length > 0 || 
                          selectedVisibility !== null || sortBy !== 'recent';

  const handleSelectPlan = (planId: string) => {
    const newSelection = new Set(selectedPlans);
    if (newSelection.has(planId)) {
      newSelection.delete(planId);
    } else {
      newSelection.add(planId);
    }
    setSelectedPlans(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedPlans.size === mealPlans.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(mealPlans.map(plan => plan.id)));
    }
  };

  const handleDeleteSingle = async (plan: {id: string, title: string}) => {
    setDeletingPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedPlans.size === 0) return;
    setIsBulkDeleting(true);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      if (isBulkDeleting && selectedPlans.size > 0) {
        // Bulk delete
        const idsToDelete = Array.from(selectedPlans);
        const response = await fetch(`/api/meal-planner?ids=${idsToDelete.join(',')}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete meal plans');
        }

        const result = await response.json();
        console.log('Bulk delete result:', result);
        
        // Update local state
        setMealPlans(plans => plans.filter(plan => !selectedPlans.has(plan.id)));
        setSelectedPlans(new Set());
        setShowBulkActions(false);
        
      } else if (deletingPlan) {
        // Single delete
        const response = await fetch(`/api/meal-planner/${deletingPlan.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409 && errorData.warning) {
            // Plan has interactions, ask for force delete
            const forceResponse = await fetch(`/api/meal-planner/${deletingPlan.id}?force=true`, {
              method: 'DELETE',
            });
            
            if (!forceResponse.ok) {
              const forceErrorData = await forceResponse.json();
              throw new Error(forceErrorData.error || 'Failed to delete meal plan');
            }
          } else {
            throw new Error(errorData.error || 'Failed to delete meal plan');
          }
        }

        // Update local state
        setMealPlans(plans => plans.filter(plan => plan.id !== deletingPlan.id));
      }

      // Refresh the list to ensure consistency
      await fetchMealPlans();
      
    } catch (error) {
      console.error('Error deleting meal plan(s):', error);
      setError(error instanceof Error ? error.message : 'Failed to delete meal plan(s)');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingPlan(null);
      setIsBulkDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingPlan(null);
    setIsBulkDeleting(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your saved plans...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please sign in to view your saved plans.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Saved Meal Plans</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Your collection of favorite meal plans
                  {mealPlans.length > 0 && ` (${mealPlans.length} plan${mealPlans.length > 1 ? 's' : ''})`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {mealPlans.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      showBulkActions
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                    title={showBulkActions ? 'Cancel selection mode' : 'Select multiple plans to delete'}
                  >
                    {showBulkActions ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    <span>{showBulkActions ? 'Cancel Selection' : 'Manage Plans'}</span>
                  </button>
                  
                  {/* Quick info about bulk selection */}
                  {!showBulkActions && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      Select multiple to delete
                    </span>
                  )}
                </div>
              )}
              <Link 
                href="/meal-planner"
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {mealPlans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              {/* Search and Filter Toggle */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search meal plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && !showFilters && (
                    <span className="bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {[selectedDuration !== null, selectedServings !== null, selectedSystems.length > 0, selectedRestrictions.length > 0, selectedVisibility !== null, sortBy !== 'recent'].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
                  {/* Duration Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => setSelectedDuration(selectedDuration === weeks ? null : weeks)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedDuration === weeks
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {weeks} Week{weeks > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Servings Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Servings
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 4, 6].map((servings) => (
                        <button
                          key={servings}
                          onClick={() => setSelectedServings(selectedServings === servings ? null : servings)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedServings === servings
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {servings} {servings === 1 ? 'Person' : 'People'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="duration">Duration</option>
                    </select>
                  </div>

                  {/* Defense Systems Filter */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Defense Systems
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(DEFENSE_SYSTEMS).map((system) => (
                        <button
                          key={system.id}
                          onClick={() => toggleSystem(system.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            selectedSystems.includes(system.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={system.name}
                        >
                          {system.icon} {system.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Restrictions Filter */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'].map((restriction) => (
                        <button
                          key={restriction}
                          onClick={() => toggleRestriction(restriction)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedRestrictions.includes(restriction)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {restriction}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visibility Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visibility
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['PRIVATE', 'PUBLIC', 'FRIENDS'].map((visibility) => (
                        <button
                          key={visibility}
                          onClick={() => setSelectedVisibility(selectedVisibility === visibility ? null : visibility)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedVisibility === visibility
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {visibility}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredPlans.length}</span> of <span className="font-semibold">{mealPlans.length}</span> meal plans
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && mealPlans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  {selectedPlans.size === mealPlans.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>
                    {selectedPlans.size === mealPlans.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedPlans.size} of {mealPlans.length} selected
                </span>
              </div>
              
              {selectedPlans.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedPlans.size})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="text-red-800 dark:text-red-300">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Meal Plans Grid */}
        {!Array.isArray(mealPlans) ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border dark:border-gray-700">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Invalid Data Format</h2>
              <p className="text-gray-600 dark:text-gray-300">Expected array, got: {typeof mealPlans}</p>
            </div>
            <button 
              onClick={fetchMealPlans}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Saved Plans Yet</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Create your first meal plan and it will appear here for easy access.
              </p>
              <Link 
                href="/meal-planner"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Meal Plan</span>
              </Link>
            </div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Plans Match Your Filters</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Try adjusting your filters or clear them to see all plans.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan: any) => (
              <div key={plan.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative group border dark:border-gray-700 ${
                selectedPlans.has(plan.id) ? 'ring-2 ring-blue-500' : ''
              }`}>
                
                {/* Selection Checkbox */}
                {showBulkActions && (
                  <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      {selectedPlans.has(plan.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Delete Button - Always visible but styled appropriately */}
                {!showBulkActions && (
                  <div className="absolute top-4 right-4 z-20 flex space-x-1">
                    {/* Quick delete button - subtle but accessible */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteSingle({id: plan.id, title: plan.title});
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-70 hover:opacity-100"
                      title="Delete this meal plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Clickable Card Content */}
                <Link 
                  href={`/meal-planner/${plan.id}`}
                  className="block p-6 cursor-pointer"
                  onClick={() => showBulkActions && handleSelectPlan(plan.id)}
                >
                  <div className={`mb-4 ${showBulkActions ? 'ml-8' : ''}`}>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{plan.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{plan.description}</p>
                  </div>
                  
                  <div className={`space-y-2 mb-4 ${showBulkActions ? 'ml-8' : ''}`}>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{plan.defaultServings} servings</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between ${showBulkActions ? 'ml-8' : ''}`}>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.visibility === 'PUBLIC' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      plan.visibility === 'FRIENDS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {plan.visibility}
                    </span>
                    
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                      Click to view →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName={
            isBulkDeleting 
              ? `${selectedPlans.size} meal plan${selectedPlans.size > 1 ? 's' : ''}`
              : deletingPlan?.title
          }
          itemType="meal plan"
          count={isBulkDeleting ? selectedPlans.size : 1}
          isLoading={isDeleting}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}