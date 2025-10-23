import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import EditRecipeForm from '@/components/recipes/EditRecipeForm';

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

  return <EditRecipeForm recipe={recipe} />;
}