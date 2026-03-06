// app/(dashboard)/saved-plans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Clock, Users, Plus, CheckSquare, Square, Trash2, X, Bookmark, Search, Filter, Calendar, Shield, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DeleteConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import Footer from '@/components/layout/Footer';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

type SortBy = 'recent' | 'oldest' | 'title' | 'duration';

type MealPlan = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  durationWeeks?: number;
  defaultServings?: number;
  visibility?: string;
  focusSystems?: string[];
  dietaryRestrictions?: string[];
};

export default function SavedPlansPage() {
  const { data: session, status } = useSession();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<MealPlan[]>([]);
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
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  useEffect(() => {
    if (session?.user) {
      fetchMealPlans();
    }
  }, [session]);

  // Apply filters whenever filters or mealPlans change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        plan.focusSystems && selectedSystems.some((system: string) => plan.focusSystems!.includes(system))
      );
    }

    // Dietary restrictions filter
    if (selectedRestrictions.length > 0) {
      filtered = filtered.filter(plan =>
        plan.dietaryRestrictions && selectedRestrictions.some((restriction: string) => plan.dietaryRestrictions!.includes(restriction))
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-lg mb-5">
            <div className="animate-spin w-7 h-7 border-[3px] border-white border-t-transparent rounded-full" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading your saved plans…</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-lg mb-5">
            <Bookmark className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign in to continue</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Please sign in to view your saved meal plans.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-md"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* ── STICKY TOP NAV ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Saved Plans</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-teal-500 rounded-md flex items-center justify-center shadow">
              <Bookmark className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">Meal Plans</span>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-56 h-56 bg-green-300 dark:bg-green-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-20 right-10 w-56 h-56 bg-teal-300 dark:bg-teal-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/3 w-56 h-56 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-lg flex-shrink-0">
                <Bookmark className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-0.5">
                  Your Collection
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Saved{' '}
                  <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    Meal Plans
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {mealPlans.length > 0
                    ? `${mealPlans.length} plan${mealPlans.length > 1 ? 's' : ''} saved`
                    : 'Ready to build your first plan?'}
                </p>
              </div>
            </div>

            {/* CTA + manage button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {mealPlans.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    showBulkActions
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 dark:shadow-red-900/30'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {showBulkActions ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  <span>{showBulkActions ? 'Cancel' : 'Manage'}</span>
                </button>
              )}
              <Link
                href="/meal-planner"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-green-200 dark:shadow-green-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>New Plan</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-8">

        {/* Search and Filter Bar */}
        {mealPlans.length > 0 && (
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex flex-col gap-4">
              {/* Search row */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search meal plans…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white placeholder-gray-400 transition-shadow"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    showFilters || hasActiveFilters
                      ? 'bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && !showFilters && (
                    <span className="bg-white text-green-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold leading-none">
                      {[selectedDuration !== null, selectedServings !== null, selectedSystems.length > 0, selectedRestrictions.length > 0, selectedVisibility !== null, sortBy !== 'recent'].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Duration Filter */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => setSelectedDuration(selectedDuration === weeks ? null : weeks)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedDuration === weeks
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {weeks}W
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Servings Filter */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      <Users className="w-3.5 h-3.5" /> Servings
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 4, 6].map((servings) => (
                        <button
                          key={servings}
                          onClick={() => setSelectedServings(selectedServings === servings ? null : servings)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedServings === servings
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {servings}×
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-green-500 dark:text-white"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Title (A–Z)</option>
                      <option value="duration">Duration</option>
                    </select>
                  </div>

                  {/* Defense Systems Filter */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      <Shield className="w-3.5 h-3.5" /> Defense Systems
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(DEFENSE_SYSTEMS).map((system) => (
                        <button
                          key={system.id}
                          onClick={() => toggleSystem(system.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedSystems.includes(system.id)
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      Dietary
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'].map((restriction) => (
                        <button
                          key={restriction}
                          onClick={() => toggleRestriction(restriction)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                            selectedRestrictions.includes(restriction)
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {restriction}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visibility Filter */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                      Visibility
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['PRIVATE', 'PUBLIC', 'FRIENDS'].map((visibility) => (
                        <button
                          key={visibility}
                          onClick={() => setSelectedVisibility(selectedVisibility === visibility ? null : visibility)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedVisibility === visibility
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredPlans.length}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{mealPlans.length}</span>
                {' '}meal plan{mealPlans.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && mealPlans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {selectedPlans.size === mealPlans.length ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                <span>{selectedPlans.size === mealPlans.length ? 'Deselect All' : 'Select All'}</span>
              </button>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">{selectedPlans.size}</strong> of {mealPlans.length} selected
              </span>

              {selectedPlans.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedPlans.size})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-start justify-between gap-4">
            <div className="text-red-800 dark:text-red-300">
              <p className="font-semibold text-sm">Something went wrong</p>
              <p className="text-sm mt-0.5 text-red-600 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── CONTENT STATES ─────────────────────────────────────────────── */}

        {/* Invalid data */}
        {!Array.isArray(mealPlans) ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
              <Calendar className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Unexpected Data</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Got <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{typeof mealPlans}</code> instead of an array.</p>
            <button
              onClick={fetchMealPlans}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-teal-600 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>

        /* Empty — no plans at all */
        ) : mealPlans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-2xl mb-6">
                <Calendar className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">No Saved Plans Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Create your first meal plan and it will appear here for easy access anytime.
              </p>
              <Link
                href="/meal-planner"
                className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30"
              >
                <Plus className="w-4 h-4" />
                Create Your First Plan
              </Link>
            </div>
          </div>

        /* Empty — filters return nothing */
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl mb-6">
                <Search className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">No Matches Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                No plans match your current filters. Try adjusting or clearing them.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-7 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>

        /* Plans grid */
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  selectedPlans.has(plan.id)
                    ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg'
                }`}
              >
                {/* Gradient top accent bar */}
                <div className="h-1 bg-gradient-to-r from-green-400 to-teal-500" />

                {/* Selection Checkbox (bulk mode) */}
                {showBulkActions && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectPlan(plan.id); }}
                    className="absolute top-4 left-4 z-20 w-6 h-6 flex items-center justify-center"
                  >
                    {selectedPlans.has(plan.id) ? (
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors" />
                    )}
                  </button>
                )}

                {/* Delete button (normal mode) */}
                {!showBulkActions && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSingle({ id: plan.id, title: plan.title }); }}
                    className="absolute top-3 right-3 z-20 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete this meal plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Card body */}
                <Link
                  href={`/meal-planner/${plan.id}`}
                  className="block p-5"
                  onClick={() => showBulkActions && handleSelectPlan(plan.id)}
                >
                  <div className={showBulkActions ? 'pl-7' : ''}>
                    {/* Title + description */}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1 pr-6">
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {plan.defaultServings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {plan.defaultServings} serving{plan.defaultServings > 1 ? 's' : ''}
                        </span>
                      )}
                      {plan.durationWeeks && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {plan.durationWeeks}w
                        </span>
                      )}
                    </div>

                    {/* Defense systems tags */}
                    {plan.focusSystems && plan.focusSystems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {plan.focusSystems.slice(0, 3).map((sysId) => {
                          const sys = Object.values(DEFENSE_SYSTEMS).find(s => s.id === sysId);
                          return sys ? (
                            <span
                              key={sysId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-lg border border-green-100 dark:border-green-800/50 font-medium"
                            >
                              <span>{sys.icon}</span>
                              <span>{sys.name}</span>
                            </span>
                          ) : null;
                        })}
                        {plan.focusSystems.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-lg">
                            +{plan.focusSystems.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        plan.visibility === 'PUBLIC'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : plan.visibility === 'FRIENDS'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {plan.visibility ?? 'PRIVATE'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 group-hover:gap-2 transition-all">
                        View plan
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {/* "New plan" ghost card */}
            <Link
              href="/meal-planner"
              className="group flex flex-col items-center justify-center gap-3 min-h-[200px] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 rounded-2xl transition-all hover:bg-green-50/40 dark:hover:bg-green-900/10 text-center p-6"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 rounded-xl flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Create New Plan</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Add another plan to your collection</p>
              </div>
            </Link>
          </div>
        )}
      </div>

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

      {/* Footer */}
      <Footer />
    </div>
  );
}