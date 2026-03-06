'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeWithRelations } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { Star, Clock, User, Heart, MessageCircle, ChefHat, Calendar, Leaf, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onFavorite?: (recipeId: string) => void;
  onFilterByCreator?: (userId: string, userName: string) => void;
}

/* ─── Defense-system accent colours ─────────────────────────────────────── */
const SYSTEM_ACCENT: Record<string, string> = {
  ANGIOGENESIS:   'from-red-400 to-rose-500',
  STEM_CELLS:     'from-green-400 to-emerald-500',
  MICROBIOME:     'from-amber-400 to-orange-500',
  DNA_PROTECTION: 'from-blue-400 to-indigo-500',
  IMMUNITY:       'from-purple-400 to-violet-500',
};

/* Solid colour per system — used for multi-system segmented strip */
const SYSTEM_COLOR: Record<string, string> = {
  ANGIOGENESIS:   'bg-red-400',
  STEM_CELLS:     'bg-emerald-400',
  MICROBIOME:     'bg-amber-400',
  DNA_PROTECTION: 'bg-blue-400',
  IMMUNITY:       'bg-purple-400',
};

export default function RecipeCard({ recipe, onFavorite, onFilterByCreator }: RecipeCardProps) {
  const ingredients = recipe.ingredients as Array<{ name: string; amount: string }>;
  const primarySystem = recipe.defenseSystems?.[0];
  const accentGradient = primarySystem
    ? (SYSTEM_ACCENT[primarySystem] ?? 'from-green-400 to-teal-500')
    : 'from-green-400 to-teal-500';

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 overflow-hidden group ring-1 ring-gray-100 dark:ring-gray-700 hover:ring-green-200 dark:hover:ring-green-800 flex flex-col">

      {/* ── Top accent strip — one segment per defense system ───────────── */}
      {recipe.defenseSystems.length > 1 ? (
        <div className="h-1.5 w-full flex">
          {recipe.defenseSystems.map((system) => (
            <div
              key={system}
              className={`flex-1 ${SYSTEM_COLOR[system] ?? 'bg-teal-400'}`}
              title={DEFENSE_SYSTEMS[system]?.displayName ?? system}
            />
          ))}
        </div>
      ) : (
        <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient}`} />
      )}

      {/* ── Image area ──────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 flex items-center justify-center overflow-hidden">
        {recipe.imageUrl ? (
          <>
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay for badge readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <ChefHat className="w-16 h-16 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">No image yet</span>
          </div>
        )}

        {/* Meal Type Badge */}
        {recipe.mealType && (() => {
          const mealStyles: Record<string, { bg: string; text: string; emoji: string }> = {
            breakfast: { bg: 'bg-amber-500',   text: 'text-white', emoji: '🌅' },
            lunch:     { bg: 'bg-sky-500',      text: 'text-white', emoji: '☀️'  },
            dinner:    { bg: 'bg-indigo-600',   text: 'text-white', emoji: '🌙' },
            snack:     { bg: 'bg-emerald-500',  text: 'text-white', emoji: '🍎' },
            dessert:   { bg: 'bg-pink-500',     text: 'text-white', emoji: '🍰' },
          };
          const style = mealStyles[recipe.mealType.toLowerCase()] ?? { bg: 'bg-gray-600', text: 'text-white', emoji: '🍽️' };
          return (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${style.bg} ${style.text}`}>
              <span>{style.emoji}</span>
              <span className="capitalize">{recipe.mealType}</span>
            </span>
          );
        })()}

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite(recipe.id);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ring-1 ring-gray-200 dark:ring-gray-600"
          >
            <Heart
              className={`w-4 h-4 ${
                recipe.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-300'
              }`}
            />
          </button>
        )}

        {/* Defense System Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-1.5rem)]">
          {recipe.defenseSystems.map((system) => {
            const info = DEFENSE_SYSTEMS[system];
            return (
              <span
                key={system}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.bgColor} ${info.textColor} backdrop-blur-sm shadow-sm`}
              >
                {info.icon} {info.displayName}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Card Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* Title */}
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors line-clamp-2 leading-snug">
            {recipe.title}
          </h3>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Meta row — time · rating · creator */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            {recipe.prepTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{recipe.prepTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {recipe.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>

          {/* Creator button with tooltip */}
          <div className="group/creator relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                onFilterByCreator?.(recipe.user.id, recipe.user.name || 'Unknown');
              }}
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium group-hover/creator:underline decoration-teal-500 underline-offset-2">
                {recipe.user.name}
              </span>
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover/creator:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded-xl py-2 px-3 whitespace-nowrap shadow-xl">
                <span>View all by <strong>{recipe.user.name}</strong></span>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Chips — dietary restrictions + ingredients ─────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {recipe.dietaryRestrictions && recipe.dietaryRestrictions.slice(0, 2).map((r, i) => (
            <span
              key={`d-${i}`}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium border border-emerald-100 dark:border-emerald-800"
            >
              <Leaf className="w-2.5 h-2.5" />
              {r}
            </span>
          ))}
          {(recipe.dietaryRestrictions?.length ?? 0) > 2 && (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium border border-emerald-100 dark:border-emerald-800">
              +{recipe.dietaryRestrictions!.length - 2}
            </span>
          )}
          {ingredients.slice(0, 3).map((ing, i) => (
            <span
              key={`i-${i}`}
              className="text-xs bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-100 dark:border-gray-600"
            >
              {ing.name}
            </span>
          ))}
          {ingredients.length > 3 && (
            <span className="text-xs bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 px-2.5 py-0.5 rounded-full border border-gray-100 dark:border-gray-600">
              +{ingredients.length - 3} more
            </span>
          )}
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* ── Footer: engagement stats + CTA ──────────────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>{recipe._count.favorites}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-sky-400" />
              <span>{recipe._count.comments}</span>
            </div>
            <div
              className="flex items-center gap-1"
              title={format(new Date(recipe.createdAt), 'PPP')}
            >
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(recipe.createdAt), 'MMM d')}</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/recipes/${recipe.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-semibold rounded-full shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30 hover:from-green-600 hover:to-teal-700 transition-all group/btn"
          >
            View Recipe
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}