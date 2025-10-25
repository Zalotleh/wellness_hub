# Feature Flags System - Usage Examples

## 📁 File Structure

```
lib/
  features/
    feature-flags.ts      # ✅ Core feature flag definitions and logic
    api-access.ts         # ✅ API route helpers
components/
  features/
    FeatureGate.tsx       # ✅ React components for feature gating
hooks/
  useFeatureAccess.ts     # ✅ React hooks for components
```

---

## 🎯 Usage Examples

### 1. **Using in Components**

#### Example 1: Simple Feature Check
```tsx
// components/MealPlanner.tsx
'use client';

import { Feature } from '@/lib/features/feature-flags';
import { useFeature } from '@/hooks/useFeatureAccess';

export function MealPlanner() {
  const canDragDrop = useFeature(Feature.DRAG_DROP_MEALS);

  return (
    <div>
      {canDragDrop ? (
        <DraggableMealList />
      ) : (
        <StaticMealList />
      )}
    </div>
  );
}
```

#### Example 2: Feature Gate Component
```tsx
// components/PantryManager.tsx
'use client';

import { Feature } from '@/lib/features/feature-flags';
import { FeatureGate } from '@/components/features/FeatureGate';

export function PantryManager() {
  return (
    <FeatureGate feature={Feature.PANTRY_MANAGEMENT}>
      <PantryInventory />
      <ExpirationTracking />
      <SmartSuggestions />
    </FeatureGate>
  );
}
```

#### Example 3: Usage Limits with Progress Bar
```tsx
// components/CreateMealPlanButton.tsx
'use client';

import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UsageLimitBar } from '@/components/features/FeatureGate';

export function CreateMealPlanButton({ userMealPlans }: { userMealPlans: number }) {
  const { canUse, tier } = useFeatureAccess();
  
  const canCreate = canUse('meal_plans_per_month', userMealPlans);

  return (
    <div className="space-y-4">
      <UsageLimitBar 
        limitKey="meal_plans_per_month" 
        currentUsage={userMealPlans}
        showWarning
      />
      
      <button 
        disabled={!canCreate}
        className="btn-primary"
      >
        {canCreate ? 'Create Meal Plan' : 'Upgrade to Create More'}
      </button>
    </div>
  );
}
```

#### Example 4: Full Feature Access Hook
```tsx
// components/RecipeGenerator.tsx
'use client';

import { Feature } from '@/lib/features/feature-flags';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export function RecipeGenerator() {
  const {
    hasFeature,
    canUse,
    getUpgradeMessage,
    tier,
    isTrialing,
  } = useFeatureAccess();

  const userRecipes = 5;
  
  const canGenerateBatch = hasFeature(Feature.BATCH_RECIPE_GENERATION);
  const canGenerateMore = canUse('recipe_generations_per_month', userRecipes);

  if (!canGenerateMore) {
    return (
      <div className="upgrade-prompt">
        <p>You've used all your recipe generations this month</p>
        <button>Upgrade to Premium</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Generate Recipe</h2>
      
      {canGenerateBatch ? (
        <BatchRecipeGenerator />
      ) : (
        <>
          <SingleRecipeGenerator />
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">
              💡 {getUpgradeMessage(Feature.BATCH_RECIPE_GENERATION)}
            </p>
          </div>
        </>
      )}
      
      {isTrialing && (
        <div className="trial-banner">
          🎉 You're on a trial! Enjoying {tier} features
        </div>
      )}
    </div>
  );
}
```

---

### 2. **Using in API Routes**

#### Example 1: Simple Feature Check
```typescript
// app/api/meal-plans/route.ts
import { requireFeature } from '@/lib/features/api-access';
import { Feature } from '@/lib/features/feature-flags';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Check if user has access to unlimited meal plans
  const featureCheck = await requireFeature(Feature.UNLIMITED_MEAL_PLANS);
  if (featureCheck.error) return featureCheck.error;

  const access = featureCheck.access;

  // Create meal plan logic...
  const body = await req.json();
  
  // ... your logic here

  return NextResponse.json({ success: true });
}
```

#### Example 2: Usage Limit Check
```typescript
// app/api/recipes/generate/route.ts
import { checkUsageLimit, incrementUsage } from '@/lib/features/api-access';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Check if user can generate more recipes
  const limitCheck = await checkUsageLimit(
    'recipe_generations_per_month',
    async (access) => access.usage.aiQuestions // Or fetch from DB
  );

  if (limitCheck.error) return limitCheck.error;

  const access = limitCheck.access;

  // Generate recipe logic...
  const recipe = await generateRecipe(/* ... */);

  // ✅ Don't forget to increment usage!
  await incrementUsage(access.userId, 'aiQuestions');

  return NextResponse.json({ recipe });
}
```

#### Example 3: Combined Feature + Limit Check
```typescript
// app/api/meal-plans/batch/route.ts
import { requireFeatureAndLimit, incrementUsage } from '@/lib/features/api-access';
import { Feature } from '@/lib/features/feature-flags';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Check both feature access AND usage limit in one call
  const check = await requireFeatureAndLimit(
    Feature.BATCH_RECIPE_GENERATION,
    'meal_plans_per_month',
    async (access) => access.usage.mealPlans
  );

  if (check.error) return check.error;

  const { access, currentUsage } = check;

  // Create batch meal plans...
  const body = await req.json();
  const plans = await createBatchPlans(body);

  // Increment usage for each plan created
  for (let i = 0; i < plans.length; i++) {
    await incrementUsage(access.userId, 'mealPlans');
  }

  return NextResponse.json({ plans });
}
```

#### Example 4: Manual Feature Access
```typescript
// app/api/pantry/route.ts
import { getApiFeatureAccess } from '@/lib/features/api-access';
import { Feature } from '@/lib/features/feature-flags';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const access = await getApiFeatureAccess();

  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Custom logic with feature access
  if (access.hasFeature(Feature.PANTRY_MANAGEMENT)) {
    // Return full pantry data with smart suggestions
    return NextResponse.json({
      items: await getFullPantry(access.userId),
      suggestions: await getSmartSuggestions(access.userId),
      expirationAlerts: await getExpirationAlerts(access.userId),
    });
  } else {
    // Return basic pantry data only
    return NextResponse.json({
      items: await getBasicPantry(access.userId),
      upgradeMessage: access.getUpgradeMessage(Feature.PANTRY_MANAGEMENT),
    });
  }
}
```

---

### 3. **Usage Limit Patterns**

#### Pattern 1: Soft Limit (Show Warning)
```tsx
export function MealPlanCreator() {
  const { isApproachingLimit, canUse } = useFeatureAccess();
  const userPlans = 4;

  const approaching = isApproachingLimit('meal_plans_per_month', userPlans);
  const canCreate = canUse('meal_plans_per_month', userPlans);

  return (
    <div>
      {approaching && canCreate && (
        <Alert variant="warning">
          ⚠️ You're close to your monthly limit!
        </Alert>
      )}
      
      <CreatePlanButton disabled={!canCreate} />
    </div>
  );
}
```

#### Pattern 2: Hard Limit (Block Action)
```tsx
export function AIAdvisor() {
  const limit = useLimit('ai_questions_per_month', userQuestions);

  if (!limit.canUse) {
    return (
      <UpgradePrompt
        message={`You've used all ${limit.maxLimit} questions this month`}
        action="Upgrade for unlimited AI questions"
      />
    );
  }

  return <AskAIForm remaining={limit.remaining} />;
}
```

#### Pattern 3: Graceful Degradation
```tsx
export function DataExport() {
  const { hasFeature } = useFeatureAccess();
  const canExportPDF = hasFeature(Feature.PDF_EXPORT);

  return (
    <div>
      <h3>Export Your Data</h3>
      
      {/* Always available */}
      <button onClick={exportToClipboard}>
        📋 Copy to Clipboard
      </button>
      
      {/* Premium feature */}
      {canExportPDF ? (
        <button onClick={exportToPDF}>
          📄 Export to PDF
        </button>
      ) : (
        <button disabled className="opacity-50">
          📄 Export to PDF (Premium)
        </button>
      )}
    </div>
  );
}
```

---

## 🎨 UI Patterns

### Tier Badges
```tsx
import { TierBadge } from '@/components/features/FeatureGate';

function UserProfile() {
  return (
    <div>
      <h1>John Doe</h1>
      <TierBadge />
    </div>
  );
}
```

### Feature Comparison Table
```tsx
function PricingPage() {
  return (
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Free</th>
          <th>Premium</th>
          <th>Family</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Meal Plans per Month</td>
          <td>1</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
        </tr>
        <tr>
          <td>AI Questions</td>
          <td>10/month</td>
          <td>Unlimited</td>
          <td>Unlimited</td>
        </tr>
      </tbody>
    </table>
  );
}
```

---

## 🔐 Security Best Practices

1. **Always check on server**: Don't rely on client-side checks alone
2. **Increment usage**: Remember to call `incrementUsage()` after successful operations
3. **Handle trial periods**: Trial users should get premium access
4. **Reset monthly counters**: The system auto-resets on month change

---

## 🚀 Quick Reference

| Task | Component | API Route |
|------|-----------|-----------|
| Check single feature | `useFeature(Feature.X)` | `requireFeature(Feature.X)` |
| Check usage limit | `useLimit('key', usage)` | `checkUsageLimit('key', fn)` |
| Full access object | `useFeatureAccess()` | `getApiFeatureAccess()` |
| Both checks | N/A | `requireFeatureAndLimit(...)` |
| Increment usage | N/A | `incrementUsage(userId, type)` |

---

## 📊 Testing

```typescript
// Mock user with different tiers
const freeUser = {
  subscriptionTier: 'FREE',
  trialEndsAt: null,
};

const premiumUser = {
  subscriptionTier: 'PREMIUM',
  trialEndsAt: null,
};

const trialUser = {
  subscriptionTier: 'FREE',
  trialEndsAt: new Date('2025-12-31'),
};
```

---

**Ready to use!** 🎉

The feature flags system is fully integrated and ready for your subscription model.
