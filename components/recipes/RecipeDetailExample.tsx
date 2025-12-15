'use client';

import React, { useState } from 'react';
import RecipeDetailView from './RecipeDetailView';
import { RecipeWithRelations, DefenseSystem } from '@/types';
import { ArrowLeft, RefreshCw, Star } from 'lucide-react';

// Sample recipe data for demonstration
const sampleRecipe: RecipeWithRelations = {
  id: '1',
  title: 'Mediterranean Quinoa Power Bowl',
  description: 'A nutrient-dense bowl packed with antioxidants, healthy fats, and plant-based proteins to support all five defense systems.',
  ingredients: [
    { name: 'Quinoa', amount: '1', unit: 'cup', notes: 'rinsed and drained' },
    { name: 'Cherry tomatoes', amount: '1', unit: 'cup', notes: 'halved' },
    { name: 'Cucumber', amount: '1', unit: 'medium', notes: 'diced' },
    { name: 'Red onion', amount: '1/4', unit: 'cup', notes: 'thinly sliced' },
    { name: 'Kalamata olives', amount: '1/3', unit: 'cup', notes: 'pitted and halved' },
    { name: 'Feta cheese', amount: '1/2', unit: 'cup', notes: 'crumbled' },
    { name: 'Fresh spinach', amount: '2', unit: 'cups', notes: 'baby spinach' },
    { name: 'Walnuts', amount: '1/4', unit: 'cup', notes: 'chopped' },
    { name: 'Extra virgin olive oil', amount: '3', unit: 'tbsp' },
    { name: 'Lemon juice', amount: '2', unit: 'tbsp', notes: 'fresh squeezed' },
    { name: 'Dried oregano', amount: '1', unit: 'tsp' },
    { name: 'Garlic', amount: '2', unit: 'cloves', notes: 'minced' },
    { name: 'Salt', amount: '1/2', unit: 'tsp', optional: true },
    { name: 'Black pepper', amount: '1/4', unit: 'tsp', optional: true },
  ],
  instructions: [
    'Cook quinoa according to package directions. In a medium saucepan, bring 2 cups of water to a boil. Add quinoa, reduce heat to low, cover and simmer for 15 minutes until water is absorbed. Remove from heat and let stand 5 minutes, then fluff with a fork.',
    'While quinoa is cooking, prepare the vegetables. Wash and halve the cherry tomatoes, dice the cucumber, and thinly slice the red onion. Set aside in separate bowls.',
    'Make the dressing by whisking together olive oil, lemon juice, minced garlic, oregano, salt, and pepper in a small bowl. Taste and adjust seasoning as needed.',
    'In a large mixing bowl, combine the cooked quinoa with half of the dressing. Toss to coat evenly and let cool slightly.',
    'Add the cherry tomatoes, cucumber, red onion, and olives to the quinoa. Gently toss to combine.',
    'Arrange the baby spinach in serving bowls. Top with the quinoa mixture, crumbled feta cheese, and chopped walnuts.',
    'Drizzle with remaining dressing and serve immediately. Can be stored in refrigerator for up to 3 days.'
  ],
  prepTime: '20',
  cookTime: '15',
  servings: 4,
  defenseSystems: [
    DefenseSystem.ANGIOGENESIS,
    DefenseSystem.REGENERATION,
    DefenseSystem.MICROBIOME,
    DefenseSystem.DNA_PROTECTION,
    DefenseSystem.IMMUNITY
  ],
  nutrients: {
    calories: '385',
    protein: '12',
    carbohydrates: '45',
    fat: '18',
    fiber: '6',
    sugar: '8',
    sodium: '320',
  },
  imageUrl: null,
  userId: 'user1',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  user: {
    id: 'user1',
    name: 'Chef Maria',
    image: null,
  },
  ratings: [
    { id: '1', value: 5, recipeId: '1', userId: 'user2', createdAt: new Date() },
    { id: '2', value: 4, recipeId: '1', userId: 'user3', createdAt: new Date() },
    { id: '3', value: 5, recipeId: '1', userId: 'user4', createdAt: new Date() },
  ],
  comments: [
    {
      id: '1',
      content: 'Amazing recipe! The flavors work so well together.',
      recipeId: '1',
      userId: 'user2',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      user: {
        id: 'user2',
        name: 'John Doe',
        image: null,
      },
    },
  ],
  _count: {
    comments: 1,
    favorites: 15,
  },
  averageRating: 4.7,
  isFavorited: false,
};

// Alternative recipe for testing
const alternativeRecipe: RecipeWithRelations = {
  id: '2',
  title: 'Wild Salmon with Turmeric Rice',
  description: 'Anti-inflammatory powerhouse featuring omega-3 rich salmon and turmeric-spiced rice.',
  ingredients: [
    { name: 'Wild salmon fillets', amount: '4', unit: 'pieces', notes: '6 oz each' },
    { name: 'Basmati rice', amount: '1.5', unit: 'cups' },
    { name: 'Turmeric powder', amount: '1', unit: 'tsp' },
    { name: 'Coconut oil', amount: '2', unit: 'tbsp' },
    { name: 'Ginger', amount: '1', unit: 'inch', notes: 'fresh, grated' },
    { name: 'Broccoli', amount: '2', unit: 'cups', notes: 'cut into florets' },
    { name: 'Lemon', amount: '1', unit: 'large', notes: 'sliced' },
  ],
  instructions: [
    'Preheat oven to 400°F (200°C). Line a baking sheet with parchment paper.',
    'Rinse rice until water runs clear. In a medium saucepan, combine rice, turmeric, and 3 cups water. Bring to boil, then reduce heat and simmer covered for 18 minutes.',
    'Season salmon fillets with salt and pepper. Heat coconut oil in an oven-safe skillet over medium-high heat.',
    'Sear salmon skin-side up for 3-4 minutes until golden. Flip and transfer skillet to oven for 6-8 minutes.',
    'Steam broccoli for 5-6 minutes until tender-crisp.',
    'Serve salmon over turmeric rice with steamed broccoli and lemon slices.'
  ],
  prepTime: '15',
  cookTime: '25',
  servings: 4,
  defenseSystems: [DefenseSystem.REGENERATION, DefenseSystem.DNA_PROTECTION],
  nutrients: {
    calories: '420',
    protein: '35',
    carbohydrates: '38',
    fat: '16',
    fiber: '4',
    sugar: '3',
    sodium: '180',
  },
  imageUrl: null,
  userId: 'user1',
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-20'),
  user: {
    id: 'user1',
    name: 'Chef Maria',
    image: null,
  },
  ratings: [],
  comments: [],
  _count: {
    comments: 0,
    favorites: 8,
  },
  averageRating: 0,
  isFavorited: true,
};

interface RecipeDetailExampleProps {
  className?: string;
}

export default function RecipeDetailExample({ className = '' }: RecipeDetailExampleProps) {
  const [currentRecipe, setCurrentRecipe] = useState(sampleRecipe);
  const [favorites, setFavorites] = useState(new Set(['2'])); // Second recipe is favorited
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // Handle favorite toggle
  const handleFavorite = (recipeId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
    }
    setFavorites(newFavorites);
    
    // Update current recipe if it's the one being favorited
    if (currentRecipe.id === recipeId) {
      setCurrentRecipe(prev => ({
        ...prev,
        isFavorited: newFavorites.has(recipeId),
      }));
    }
  };

  // Handle rating
  const handleRate = (recipeId: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [recipeId]: rating,
    }));
    
    console.log(`Rated recipe ${recipeId} with ${rating} stars`);
  };

  // Switch recipes for demo
  const switchRecipe = () => {
    const newRecipe = currentRecipe.id === '1' ? alternativeRecipe : sampleRecipe;
    setCurrentRecipe({
      ...newRecipe,
      isFavorited: favorites.has(newRecipe.id),
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Demo Controls */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Recipe Detail Demo</h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={switchRecipe}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Switch Recipe
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-200">
            <Star className="w-4 h-4" />
            <span>Current recipe: <strong>{currentRecipe.title}</strong></span>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Features Demonstrated:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ <strong>Recipe Header:</strong> Name, description, and hero image</li>
            <li>✅ <strong>Time Badges:</strong> Prep, cook, and total time indicators</li>
            <li>✅ <strong>Servings Selector:</strong> Adjust quantities with +/- buttons</li>
            <li>✅ <strong>Ingredients Checklist:</strong> Interactive checkboxes with scaling</li>
            <li>✅ <strong>Step Instructions:</strong> Numbered steps with image placeholders</li>
            <li>✅ <strong>Nutrition Facts:</strong> Standard nutrition label format</li>
            <li>✅ <strong>Print Function:</strong> Clean print layout (try the print button!)</li>
            <li>✅ <strong>Share Integration:</strong> Uses ShareMenu component</li>
            <li>✅ <strong>Defense Systems:</strong> Visual system badges</li>
            <li>✅ <strong>Interactive Rating:</strong> 5-star rating system</li>
          </ul>
        </div>
      </div>

      {/* Recipe Detail View */}
      <RecipeDetailView
        recipe={currentRecipe}
        onFavorite={handleFavorite}
        onRate={handleRate}
      />

      {/* Usage Information */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">Usage Example:</h4>
        <pre className="text-sm text-green-800 bg-green-100 p-3 rounded overflow-x-auto">
{`<RecipeDetailView
  recipe={recipeData}
  onFavorite={(id) => toggleFavorite(id)}
  onRate={(id, rating) => submitRating(id, rating)}
  className="max-w-6xl mx-auto"
/>`}
        </pre>
      </div>

      {/* Component Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">Accessibility Features:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• ARIA labels for all interactive elements</li>
            <li>• Keyboard navigation support</li>
            <li>• Screen reader friendly structure</li>
            <li>• High contrast color schemes</li>
            <li>• Focus indicators for all buttons</li>
          </ul>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">Mobile Optimizations:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Responsive grid layout</li>
            <li>• Touch-friendly button sizes</li>
            <li>• Optimized text sizes</li>
            <li>• Swipe-friendly interfaces</li>
            <li>• Mobile-first design approach</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Provider component for app integration
export function RecipeDetailProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}