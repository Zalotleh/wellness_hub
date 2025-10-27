'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import {
  Heart,
  Clock,
  Users,
  ChefHat,
  Star,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  Send,
} from 'lucide-react';
import { RecipeWithRelations } from '@/types';

interface RecipeDetail extends RecipeWithRelations {
  totalRatings?: number;
  userRating?: number;
  averageRating?: number;
  generatedBy?: string;
  mealContext?: string;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [params.id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${params.id}`);
      if (!response.ok) throw new Error('Recipe not found');
      
      const data = await response.json();
      setRecipe(data);
      setUserRating(data.userRating || 0);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      router.push('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!session?.user || isSubmittingRating) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: params.id, value: rating }),
      });

      if (response.ok) {
        const { averageRating, totalRatings } = await response.json();
        setRecipe((prev) => prev ? {
          ...prev,
          averageRating,
          totalRatings,
        } : null);
        setUserRating(rating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !comment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: params.id, content: comment }),
      });

      if (response.ok) {
        setComment('');
        await fetchRecipe();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/recipes');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: recipe?.title,
        text: recipe?.description || undefined,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  // Handle both old and new ingredient formats
  const ingredients = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.map((ing: any) => {
        if (typeof ing === 'object' && ing.name) {
          // New AI-generated format: {name, amount, unit, notes}
          return {
            name: ing.name,
            amount: ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount,
            notes: ing.notes
          };
        } else if (typeof ing === 'object' && ing.amount) {
          // Old format: {name, amount}
          return ing;
        } else {
          // String format or other
          return { name: String(ing), amount: '' };
        }
      })
    : [];

  const isOwner = session?.user?.id === recipe.user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/recipes"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recipes</span>
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Image/Placeholder */}
          <div className="relative h-80 bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefHat className="w-32 h-32 text-white opacity-50" />
            )}

            {/* Overlay Actions */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleShare}
                className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
              {isOwner && (
                <>
                  <Link
                    href={`/recipes/${params.id}/edit`}
                    className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-700" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recipe Content */}
          <div className="p-8">
            {/* Title & System */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {(recipe.defenseSystems || []).map((system) => {
                  const systemInfo = DEFENSE_SYSTEMS[system];
                  return (
                    <div
                      key={system}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold ${systemInfo.bgColor} ${systemInfo.textColor}`}
                    >
                      <span>{systemInfo.icon}</span>
                      <span>{systemInfo.displayName}</span>
                    </div>
                  );
                })}
                {recipe.generatedBy && (
                  <div className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <ChefHat className="w-3 h-3" />
                    <span>AI-Enhanced Recipe</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {recipe.title}
              </h1>

              {recipe.description && (
                <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
              )}

              {recipe.mealContext && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">From meal plan:</span> {recipe.mealContext}
                  </p>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                {recipe.prepTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Prep: {recipe.prepTime}</span>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-5 h-5" />
                    <span>Cook: {recipe.cookTime}</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{recipe.servings} servings</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Section */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">
                      {recipe.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({recipe.totalRatings || 0} ratings)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Heart className={`w-6 h-6 ${recipe.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">
                    {recipe._count.favorites} favorites
                  </span>
                </div>
              </div>

              {session?.user && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Rate this recipe:
                  </p>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={isSubmittingRating}
                        className="transition-transform hover:scale-110 disabled:opacity-50"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || userRating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        Your rating: {userRating} stars
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ingredients
              </h2>
              <ul className="space-y-3">
                {ingredients.map((ingredient: any, index: number) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {ingredient.amount && (
                          <span className="font-semibold text-gray-900">
                            {ingredient.amount}
                          </span>
                        )}
                        <span className="text-gray-700 font-medium">{ingredient.name}</span>
                      </div>
                      {ingredient.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          {ingredient.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Instructions
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                {Array.isArray(recipe.instructions) ? (
                  <ol className="space-y-4">
                    {recipe.instructions.map((instruction: any, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {typeof instruction === 'object' ? instruction.step || (index + 1) : (index + 1)}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-700 leading-relaxed">
                            {typeof instruction === 'object' ? instruction.instruction : instruction}
                          </p>
                          {typeof instruction === 'object' && instruction.time && (
                            <p className="text-sm text-gray-500 mt-1">⏱️ {instruction.time}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {recipe.instructions}
                  </pre>
                )}
              </div>
            </div>

            {/* Nutrients */}
            {recipe.nutrients && Object.keys(recipe.nutrients).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Key Nutrients
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(recipe.nutrients as Record<string, string>).map(
                    ([nutrient, value]) => (
                      <div
                        key={nutrient}
                        className="px-4 py-2 bg-green-50 border-2 border-green-200 rounded-lg"
                      >
                        <span className="font-semibold text-green-900">
                          {nutrient}:
                        </span>{' '}
                        <span className="text-green-700">{value}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {recipe.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipe by</p>
                  <p className="font-bold text-gray-900">{recipe.user.name}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <MessageCircle className="w-6 h-6" />
                <span>Comments ({recipe.comments?.length || 0})</span>
              </h2>

              {/* Add Comment Form */}
              {session?.user ? (
                <form onSubmit={handleComment} className="mb-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    rows={3}
                    placeholder="Share your thoughts about this recipe..."
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmittingComment}
                    className="mt-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmittingComment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Post Comment</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <p className="mb-6 text-gray-600">
                  <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                    Sign in
                  </Link>{' '}
                  to leave a comment
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {recipe.comments && recipe.comments.length > 0 ? (
                  recipe.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {comment.user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}