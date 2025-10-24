import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import EditRecipeForm from '@/components/recipes/EditRecipeForm';
import { RecipeWithRelations, DefenseSystem } from '@/types';

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: resolvedParams.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      ratings: true,
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          favorites: true,
        },
      },
    },
  });

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Recipe not found</h1>
      </div>
    );
  }

  // Check if the user is the owner of the recipe
  if (recipe.userId !== session.user.id) {
    redirect('/recipes'); // Redirect to recipes list if not the owner
  }

  // Transform recipe data to match the expected type
  const transformedRecipe: RecipeWithRelations = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) 
      ? recipe.instructions 
      : typeof recipe.instructions === 'string'
      ? recipe.instructions.split('\n').filter(Boolean)
      : [],
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    defenseSystem: recipe.defenseSystem as DefenseSystem,
    nutrients: recipe.nutrients || {},
    imageUrl: recipe.imageUrl,
    userId: recipe.userId,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    user: {
      id: recipe.user.id,
      name: recipe.user.name,
      image: recipe.user.image,
    },
    ratings: recipe.ratings,
    comments: recipe.comments,
    _count: recipe._count,
  };

  return <EditRecipeForm recipe={transformedRecipe} />;
}