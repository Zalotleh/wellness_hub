'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit2, Check, X, Save, Share2, ShoppingCart, RefreshCw, 
  Loader2, Calendar, Users, Eye, EyeOff, Lock, Globe, UserCheck
} from 'lucide-react';
import ShareMenu from './ShareMenu';

interface MealPlanData {
  id?: string;
  title: string;
  description?: string;
  weekStart: Date;
  weekEnd: Date;
  defaultServings: number;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
}

interface MealPlanHeaderProps {
  mealPlan: MealPlanData;
  isEditing?: boolean;
  isSaving?: boolean;
  isGeneratingShoppingList?: boolean;
  onSave: () => void;
  onUpdate: (updates: Partial<MealPlanData>) => void;
  onGenerateShoppingList: () => void;
  onViewShoppingList?: () => void; // New prop for viewing shopping list
  onShoppingListGenerated?: number; // Counter to trigger refresh
  onNewPlan: () => void;
  onShare: (method: 'link' | 'whatsapp' | 'email' | 'facebook' | 'twitter' | 'linkedin') => void;
  onExportPDF: () => void;
  className?: string;
}

export default function MealPlanHeader({
  mealPlan,
  isEditing = false,
  isSaving = false,
  isGeneratingShoppingList = false,
  onSave,
  onUpdate,
  onGenerateShoppingList,
  onViewShoppingList,
  onShoppingListGenerated,
  onNewPlan,
  onShare,
  onExportPDF,
  className = '',
}: MealPlanHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(mealPlan.title);
  const [tempDescription, setTempDescription] = useState(mealPlan.description || '');
  const [hasExistingShoppingList, setHasExistingShoppingList] = useState(false);
  const [checkingShoppingList, setCheckingShoppingList] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  // Focus inputs when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingDescription]);

  // Close visibility menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    }

    if (showVisibilityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVisibilityMenu]);

  // Check for existing shopping list when meal plan ID is available
  const checkExistingShoppingList = async () => {
    if (!mealPlan.id) {
      setHasExistingShoppingList(false);
      return;
    }

    try {
      setCheckingShoppingList(true);
      const response = await fetch(`/api/meal-planner/${mealPlan.id}/shopping-list`);
      
      if (response.ok) {
        const data = await response.json();
        setHasExistingShoppingList(!!data.data);
      } else {
        setHasExistingShoppingList(false);
      }
    } catch (error) {
      console.error('Error checking shopping list:', error);
      setHasExistingShoppingList(false);
    } finally {
      setCheckingShoppingList(false);
    }
  };

  useEffect(() => {
    checkExistingShoppingList();
  }, [mealPlan.id]);

  // Refresh shopping list status when notified
  useEffect(() => {
    if (onShoppingListGenerated && onShoppingListGenerated > 0) {
      // Re-check after a small delay to ensure the API has updated
      const timeoutId = setTimeout(() => {
        checkExistingShoppingList();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [onShoppingListGenerated]);

  const handleTitleEdit = () => {
    if (editingTitle) {
      if (tempTitle.trim() && tempTitle !== mealPlan.title) {
        onUpdate({ title: tempTitle.trim() });
      } else {
        setTempTitle(mealPlan.title);
      }
    } else {
      setTempTitle(mealPlan.title);
    }
    setEditingTitle(!editingTitle);
  };

  const handleDescriptionEdit = () => {
    if (editingDescription) {
      if (tempDescription !== mealPlan.description) {
        onUpdate({ description: tempDescription });
      }
    } else {
      setTempDescription(mealPlan.description || '');
    }
    setEditingDescription(!editingDescription);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        handleTitleEdit();
        break;
      case 'Escape':
        event.preventDefault();
        setTempTitle(mealPlan.title);
        setEditingTitle(false);
        break;
    }
  };

  const handleDescriptionKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleDescriptionEdit();
        }
        break;
      case 'Escape':
        event.preventDefault();
        setTempDescription(mealPlan.description || '');
        setEditingDescription(false);
        break;
    }
  };

  const handleVisibilityChange = (visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS') => {
    onUpdate({ visibility });
    setShowVisibilityMenu(false);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return Globe;
      case 'FRIENDS':
        return UserCheck;
      default:
        return Lock;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Public';
      case 'FRIENDS':
        return 'Friends Only';
      default:
        return 'Private';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FRIENDS':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 ${className}`}>
      {/* Top Row - Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 text-xl sm:text-2xl font-bold px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                placeholder="Enter meal plan title..."
              />
              <button 
                onClick={handleTitleEdit}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                aria-label="Save title"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setTempTitle(mealPlan.title);
                  setEditingTitle(false);
                }}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                aria-label="Cancel editing"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="group/title flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1 min-w-0 break-words">
                {mealPlan.title}
              </h1>
              <button
                onClick={handleTitleEdit}
                className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all"
                aria-label="Edit title"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {mealPlan.id ? 'Update' : 'Save'}
            </span>
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            
            <ShareMenu
              isOpen={showShareMenu}
              onClose={() => setShowShareMenu(false)}
              mealPlanId={mealPlan.id}
              mealPlanTitle={mealPlan.title}
              onShare={onShare}
              onExportPDF={onExportPDF}
            />
          </div>

          {/* Shopping List Buttons */}
          {hasExistingShoppingList ? (
            <>
              {/* Update Shopping List Button */}
              <button
                onClick={onGenerateShoppingList}
                disabled={isGeneratingShoppingList || checkingShoppingList}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingShoppingList || checkingShoppingList ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span className="hidden lg:inline">
                  {checkingShoppingList ? 'Checking...' : 'Update List'}
                </span>
              </button>
              
              {/* View Shopping List Button */}
              {onViewShoppingList && (
                <button
                  onClick={onViewShoppingList}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden lg:inline">View List</span>
                </button>
              )}
            </>
          ) : (
            /* Create Shopping List Button */
            <button
              onClick={onGenerateShoppingList}
              disabled={isGeneratingShoppingList || checkingShoppingList}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingShoppingList || checkingShoppingList ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              <span className="hidden lg:inline">
                {checkingShoppingList ? 'Checking...' : 'Create Shopping List'}
              </span>
            </button>
          )}

          {/* New Plan Button */}
          <button
            onClick={onNewPlan}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden lg:inline">New Plan</span>
          </button>
        </div>
      </div>

      {/* Second Row - Meta Information */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
        {/* Left - Date Range and Servings */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(mealPlan.weekStart, mealPlan.weekEnd)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{mealPlan.defaultServings} {mealPlan.defaultServings === 1 ? 'person' : 'people'}</span>
          </div>
        </div>

        {/* Right - Visibility and Description */}
        <div className="flex items-center gap-4">
          {/* Visibility Selector */}
          <div className="relative" ref={visibilityMenuRef}>
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${getVisibilityColor(mealPlan.visibility)}
              `}
            >
              {React.createElement(getVisibilityIcon(mealPlan.visibility), { className: 'w-3 h-3' })}
              <span>{getVisibilityLabel(mealPlan.visibility)}</span>
            </button>

            {showVisibilityMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {(['PRIVATE', 'FRIENDS', 'PUBLIC'] as const).map((visibility) => {
                  const Icon = getVisibilityIcon(visibility);
                  const isSelected = mealPlan.visibility === visibility;
                  
                  return (
                    <button
                      key={visibility}
                      onClick={() => handleVisibilityChange(visibility)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors
                        ${isSelected ? 'bg-gray-50 font-medium' : ''}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="text-sm">{getVisibilityLabel(visibility)}</div>
                        <div className="text-xs text-gray-500">
                          {visibility === 'PRIVATE' && 'Only you can see this plan'}
                          {visibility === 'FRIENDS' && 'Your friends can see this plan'}
                          {visibility === 'PUBLIC' && 'Anyone with the link can see this plan'}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row - Description */}
      {(mealPlan.description || editingDescription) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {editingDescription ? (
            <div className="space-y-2">
              <textarea
                ref={descriptionInputRef}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 resize-none"
                placeholder="Add a description for your meal plan..."
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDescriptionEdit}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempDescription(mealPlan.description || '');
                    setEditingDescription(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <span className="text-xs text-gray-500">Press Ctrl+Enter to save</span>
              </div>
            </div>
          ) : (
            <div className="group/desc flex items-start gap-2">
              <p className="text-gray-700 flex-1 break-words">
                {mealPlan.description}
              </p>
              <button
                onClick={() => setEditingDescription(true)}
                className="opacity-0 group-hover/desc:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all"
                aria-label="Edit description"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Description Button */}
      {!mealPlan.description && !editingDescription && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setEditingDescription(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            + Add description
          </button>
        </div>
      )}
    </div>
  );
}