'use client';

import React from 'react';
import Link from 'next/link';
import { RecipeWithRelations } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Star, Clock, User, Heart, MessageCircle, ChefHat } from 'lucide-react';

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onFavorite?: (recipeId: string) => void;
  onFilterByCreator?: (userId: string, userName: string) => void;
}

export default function RecipeCard({ recipe, onFavorite, onFilterByCreator }: RecipeCardProps) {
  const ingredients = recipe.ingredients as Array<{ name: string; amount: string }>;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <ChefHat className="w-24 h-24 text-white opacity-50 group-hover:scale-110 transition-transform duration-300" />
        )}

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite(recipe.id);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                recipe.isFavorited
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400'
              }`}
            />
          </button>
        )}

        {/* System Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-1.5rem)]">
          {recipe.defenseSystems.map((system) => {
            const systemInfo = DEFENSE_SYSTEMS[system];
            return (
              <span
                key={system}
                className={`px-2 py-1 rounded-full text-xs font-bold ${systemInfo.bgColor} ${systemInfo.textColor} backdrop-blur-sm`}
              >
                {systemInfo.icon} {systemInfo.displayName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-green-600 transition-colors line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            {recipe.prepTime && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.prepTime}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">
                {recipe.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
          <div className="group/creator relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (onFilterByCreator) {
                  onFilterByCreator(recipe.user.id, recipe.user.name || 'Unknown');
                }
              }}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-all cursor-pointer group-hover/creator:underline group-hover/creator:decoration-2 group-hover/creator:decoration-blue-600"
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium">{recipe.user.name}</span>
              <svg 
                className="w-3 h-3 opacity-0 group-hover/creator:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            
            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/creator:block z-10 animate-fade-in">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                <div className="flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Click to view all recipes by <strong>{recipe.user.name}</strong></span>
                </div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {ingredients.slice(0, 3).map((ing, idx) => (
            <span
              key={idx}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {ing.name}
            </span>
          ))}
          {ingredients.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              +{ingredients.length - 3} more
            </span>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center space-x-1">
            <Heart className="w-3 h-3" />
            <span>{recipe._count.favorites}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>{recipe._count.comments}</span>
          </div>
        </div>

        {/* View Recipe Button */}
        <Link href={`/recipes/${recipe.id}`}>
          <button className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors">
            View Recipe
          </button>
        </Link>
      </div>
    </div>
  );
}