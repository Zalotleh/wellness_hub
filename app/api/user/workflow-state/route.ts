import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/workflow-state
 * Get current workflow state for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get or create workflow state
    let workflowState = await prisma.userWorkflowState.findUnique({
      where: { userId: session.user.id },
    });

    // Create if doesn't exist
    if (!workflowState) {
      workflowState = await prisma.userWorkflowState.create({
        data: {
          userId: session.user.id,
          currentStep: 'CREATE',
        },
      });
    }

    // Determine current step and next action
    const enrichedState = enrichWorkflowState(workflowState);

    return NextResponse.json({
      success: true,
      workflowState: enrichedState,
    });
  } catch (error) {
    console.error('Error fetching workflow state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow state. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/workflow-state
 * Update workflow state when user completes an action
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, metadata } = body;

    // Validate action
    const validActions = [
      'RECIPE_CREATED',
      'PLAN_CREATED',
      'SHOPPING_LIST_CREATED',
      'FOOD_LOGGED',
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data based on action
    const updateData: any = {};
    const now = new Date();

    switch (action) {
      case 'RECIPE_CREATED':
        updateData.lastRecipeCreated = now;
        updateData.hasCreatedRecipe = true;
        updateData.currentStep = 'SHOP';
        if (metadata?.recipeId) {
          updateData.activeRecipeId = metadata.recipeId;
        }
        break;
      case 'PLAN_CREATED':
        updateData.lastMealPlanCreated = now;
        updateData.hasCreatedMealPlan = true;
        updateData.currentStep = 'SHOP';
        if (metadata?.mealPlanId) {
          updateData.activeMealPlanId = metadata.mealPlanId;
        }
        break;
      case 'SHOPPING_LIST_CREATED':
        updateData.lastShoppingListUsed = now;
        updateData.hasShoppingList = true;
        updateData.currentStep = 'TRACK';
        if (metadata?.shoppingListId) {
          updateData.activeShoppingListId = metadata.shoppingListId;
        }
        // Increment workflow stat if came from recipe/plan
        const currentState = await prisma.userWorkflowState.findUnique({
          where: { userId: session.user.id },
        });
        if (currentState && (currentState.hasCreatedRecipe || currentState.hasCreatedMealPlan)) {
          updateData.recipesToShoppingList = (currentState.recipesToShoppingList || 0) + 1;
        }
        break;
      case 'FOOD_LOGGED':
        updateData.lastFoodLogged = now;
        updateData.hasLoggedFood = true;
        // Check if full workflow completed
        const state = await prisma.userWorkflowState.findUnique({
          where: { userId: session.user.id },
        });
        if (state && state.hasShoppingList) {
          updateData.shoppingListToLogged = (state.shoppingListToLogged || 0) + 1;
          // If completed full cycle, increment and reset
          if (state.hasCreatedRecipe || state.hasCreatedMealPlan) {
            updateData.completedWorkflows = (state.completedWorkflows || 0) + 1;
            updateData.currentStep = 'CREATE';
            updateData.hasCreatedRecipe = false;
            updateData.hasCreatedMealPlan = false;
            updateData.hasShoppingList = false;
            updateData.hasLoggedFood = false;
          }
        }
        break;
    }

    // Update or create workflow state
    const workflowState = await prisma.userWorkflowState.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        currentStep: 'CREATE',
        ...updateData,
      },
    });

    // Enrich with calculated fields
    const enrichedState = enrichWorkflowState(workflowState);

    return NextResponse.json({
      success: true,
      message: 'Workflow state updated successfully.',
      workflowState: enrichedState,
    });
  } catch (error) {
    console.error('Error updating workflow state:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow state. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Enrich workflow state with calculated fields
 */
function enrichWorkflowState(workflowState: any) {
  const nextAction = determineNextAction(workflowState);
  const progress = calculateWorkflowProgress(workflowState);

  return {
    ...workflowState,
    nextAction,
    progress,
  };
}

/**
 * Determine next recommended action
 */
function determineNextAction(workflowState: any): string {
  const step = workflowState.currentStep;
  
  switch (step) {
    case 'CREATE':
      return workflowState.hasCreatedRecipe || workflowState.hasCreatedMealPlan
        ? 'ADD_SHOPPING_LIST'
        : 'CREATE_RECIPE';
    case 'SHOP':
      return 'ADD_SHOPPING_LIST';
    case 'TRACK':
      return 'LOG_FOOD';
    default:
      return 'CREATE_RECIPE';
  }
}

/**
 * Calculate workflow completion progress (0-100)
 */
function calculateWorkflowProgress(workflowState: any): number {
  let completedSteps = 0;
  const totalSteps = 3;

  // Check if create step completed
  if (workflowState.hasCreatedRecipe || workflowState.hasCreatedMealPlan) {
    completedSteps++;
  }

  // Check if shop step completed
  if (workflowState.hasShoppingList) {
    completedSteps++;
  }

  // Check if track step completed
  if (workflowState.hasLoggedFood) {
    completedSteps++;
  }

  return Math.round((completedSteps / totalSteps) * 100);
}
