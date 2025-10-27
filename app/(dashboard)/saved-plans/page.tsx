// app/(dashboard)/saved-plans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Utensils, Clock, Users, Plus, CheckSquare, Square, Trash2, MoreVertical, Heart, X, Bookmark, Search, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DeleteConfirmationDialog } from '@/components/ui/ConfirmationDialog';

export default function SavedPlansPage() {
  const { data: session, status } = useSession();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchMealPlans();
    }
  }, [session]);

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved plans...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your saved plans.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Saved Meal Plans</h1>
                <p className="text-gray-600">
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
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                    title={showBulkActions ? 'Cancel selection mode' : 'Select multiple plans to delete'}
                  >
                    {showBulkActions ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    <span>{showBulkActions ? 'Cancel Selection' : 'Manage Plans'}</span>
                  </button>
                  
                  {/* Quick info about bulk selection */}
                  {!showBulkActions && (
                    <span className="text-xs text-gray-500 hidden sm:block">
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

        {/* Bulk Actions Bar */}
        {showBulkActions && mealPlans.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
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
                <span className="text-gray-600">
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search saved plans..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Meal Plans Grid */}
        {!Array.isArray(mealPlans) ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-red-600 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Invalid Data Format</h2>
              <p className="text-gray-600">Expected array, got: {typeof mealPlans}</p>
            </div>
            <button 
              onClick={fetchMealPlans}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Saved Plans Yet</h2>
              <p className="text-gray-600 mb-8">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(mealPlans) && mealPlans.map((plan: any) => (
              <div key={plan.id} className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative group ${
                selectedPlans.has(plan.id) ? 'ring-2 ring-blue-500' : ''
              }`}>
                
                {/* Selection Checkbox */}
                {showBulkActions && (
                  <div className="absolute top-4 left-4 z-20 bg-white rounded-full p-1 shadow-sm">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                      className="text-blue-500 hover:text-blue-600"
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
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-70 hover:opacity-100"
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
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">{plan.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{plan.description}</p>
                  </div>
                  
                  <div className={`space-y-2 mb-4 ${showBulkActions ? 'ml-8' : ''}`}>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{plan.defaultServings} servings</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between ${showBulkActions ? 'ml-8' : ''}`}>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plan.visibility === 'PUBLIC' ? 'bg-green-100 text-green-800' :
                      plan.visibility === 'FRIENDS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.visibility}
                    </span>
                    
                    <span className="text-green-600 font-medium text-sm group-hover:text-green-700 transition-colors">
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
    </div>
  );
}