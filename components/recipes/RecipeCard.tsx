'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeWithRelations } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Star, Clock, User, Heart, MessageCircle, ChefHat, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onFavorite?: (recipeId: string) => void;
  onFilterByCreator?: (userId: string, userName: string) => void;
}

export default function RecipeCard({ recipe, onFavorite, onFilterByCreator }: RecipeCardProps) {
  const ingredients = recipe.ingredients as Array<{ name: string; amount: string }>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 overflow-hidden group border dark:border-gray-700">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center overflow-hidden">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border dark:border-gray-600"
          >
            <Heart
              className={`w-5 h-5 ${
                recipe.isFavorited
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400 dark:text-gray-300'
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 hover:text-green-600 dark:hover:text-green-400 transition-colors line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300 mb-3">
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
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-200 hover:text-blue-600 transition-all cursor-pointer group-hover/creator:underline group-hover/creator:decoration-2 group-hover/creator:decoration-blue-600"
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
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded"
            >
              {ing.name}
            </span>
          ))}
          {ingredients.length > 3 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
              +{ingredients.length - 3} more
            </span>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{recipe._count.favorites}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{recipe._count.comments}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1" title={format(new Date(recipe.createdAt), 'PPP')}>
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(recipe.createdAt), 'MMM d, yyyy')}</span>
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