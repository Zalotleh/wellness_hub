# ShareButton Integration Examples

## Overview
This document shows how to integrate the `ShareButton` component into your meal planning application pages.

---

## 1. Meal Plan Detail Page

### File: `app/(dashboard)/meal-plans/[id]/page.tsx`

```typescript
import { ShareButton } from '@/components/sharing/ShareButton';
import { generateShareableLink } from '@/lib/utils/sharing';

export default async function MealPlanPage({ params }: { params: { id: string } }) {
  // Fetch meal plan data
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: params.id },
    include: {
      dailyMenus: {
        include: {
          meals: true,
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!mealPlan) {
    notFound();
  }

  // Generate shareable link
  const shareUrl = generateShareableLink(mealPlan.id);

  return (
    <div className="container mx-auto py-8">
      {/* Header with share button */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{mealPlan.title}</h1>
          <p className="text-gray-600 mt-2">{mealPlan.description}</p>
        </div>

        {/* Share Button - Dropdown variant */}
        <ShareButton
          title={mealPlan.title}
          description={mealPlan.description || undefined}
          url={shareUrl}
          type="meal-plan"
          mealPlan={{
            title: mealPlan.title,
            weekStart: mealPlan.weekStart,
            weekEnd: mealPlan.weekEnd,
            description: mealPlan.description,
            dailyMenus: mealPlan.dailyMenus.map(dm => ({
              date: dm.date,
              meals: dm.meals.map(m => ({
                mealType: m.mealType,
                mealName: m.mealName,
                prepTime: m.prepTime,
                calories: m.calories,
                defenseSystems: m.defenseSystems,
              })),
            })),
          }}
          variant="dropdown"
          onShare={(platform) => {
            // Optional: Track sharing analytics
            console.log(`Shared to ${platform}`);
          }}
        />
      </div>

      {/* Meal plan content */}
      <div className="space-y-6">
        {mealPlan.dailyMenus.map((day) => (
          <DayCard key={day.id} day={day} />
        ))}
      </div>

      {/* Floating share button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <ShareButton
          title={mealPlan.title}
          url={shareUrl}
          type="meal-plan"
          variant="button"
          className="shadow-lg"
        />
      </div>
    </div>
  );
}
```

---

## 2. Shopping List Page

### File: `app/(dashboard)/shopping-lists/[id]/page.tsx`

```typescript
import { ShareButton } from '@/components/sharing/ShareButton';
import { generateShareableLink } from '@/lib/utils/sharing';

export default async function ShoppingListPage({ params }: { params: { id: string } }) {
  const shoppingList = await prisma.shoppingList.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      mealPlan: {
        select: {
          title: true,
          weekStart: true,
        },
      },
    },
  });

  if (!shoppingList) {
    notFound();
  }

  const shareUrl = generateShareableLink(shoppingList.id, 'shopping-list');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{shoppingList.title}</h1>

        {/* Share with grocery services */}
        <ShareButton
          title={shoppingList.title}
          url={shareUrl}
          type="shopping-list"
          shoppingList={{
            title: shoppingList.title,
            items: shoppingList.items.map(item => ({
              ingredient: item.ingredient,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              estimatedCost: item.estimatedCost,
              checked: item.checked,
            })),
            totalCost: shoppingList.totalCost,
          }}
          variant="dropdown"
        />
      </div>

      {/* Shopping list items */}
      <ShoppingListItems items={shoppingList.items} />

      {/* Quick share buttons */}
      <div className="flex gap-2 mt-6">
        <ShareButton
          title={shoppingList.title}
          url={shareUrl}
          type="shopping-list"
          variant="icon"
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
        />
      </div>
    </div>
  );
}
```

---

## 3. Recipe Detail Page

### File: `app/(dashboard)/recipes/[id]/page.tsx`

```typescript
import { ShareButton } from '@/components/sharing/ShareButton';

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    include: {
      ingredients: true,
      instructions: true,
      ratings: true,
    },
  });

  if (!recipe) {
    notFound();
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/recipes/${recipe.id}`;

  return (
    <div className="container mx-auto py-8">
      {/* Recipe header with image */}
      <div className="relative">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}

        {/* Floating share button on image */}
        <div className="absolute top-4 right-4">
          <ShareButton
            title={recipe.title}
            description={recipe.description || undefined}
            url={shareUrl}
            type="recipe"
            variant="button"
            className="bg-white/90 hover:bg-white"
          />
        </div>
      </div>

      <h1 className="text-4xl font-bold mt-6">{recipe.title}</h1>
      <p className="text-gray-600 mt-2">{recipe.description}</p>

      {/* Recipe content */}
      <RecipeContent recipe={recipe} />
    </div>
  );
}
```

---

## 4. Community Meal Plans Page

### File: `app/(dashboard)/community/page.tsx`

```typescript
import { ShareButton } from '@/components/sharing/ShareButton';
import { generateShareableLink } from '@/lib/utils/sharing';

export default async function CommunityPage() {
  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      visibility: 'PUBLIC',
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          savedBy: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Community Meal Plans</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mealPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{plan.title}</h3>
              
              {/* Icon variant for grid cards */}
              <ShareButton
                title={plan.title}
                description={plan.description || undefined}
                url={generateShareableLink(plan.id)}
                type="meal-plan"
                variant="icon"
                className="text-gray-400 hover:text-gray-600"
              />
            </div>

            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>❤️ {plan._count.likes}</span>
              <span>📌 {plan._count.savedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. User Profile Page

### File: `app/(dashboard)/profile/page.tsx`

```typescript
import { ShareButton } from '@/components/sharing/ShareButton';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: {
      mealPlans: {
        where: { visibility: 'PUBLIC' },
        take: 10,
      },
    },
  });

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user?.id}`;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img
            src={user?.image || '/default-avatar.png'}
            alt={user?.name || 'User'}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-gray-600">@{user?.username}</p>
          </div>
        </div>

        {/* Share profile */}
        <ShareButton
          title={`${user?.name}'s Meal Plans`}
          description={`Check out healthy meal plans from ${user?.name}`}
          url={profileUrl}
          type="meal-plan"
          variant="button"
        />
      </div>

      {/* User's meal plans */}
      <h2 className="text-xl font-semibold mb-4">Public Meal Plans</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {user?.mealPlans.map((plan) => (
          <MealPlanCard key={plan.id} plan={plan} showShareButton />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. With Analytics Tracking

### Example with event tracking

```typescript
'use client';

import { ShareButton } from '@/components/sharing/ShareButton';
import { useEffect } from 'react';

export function MealPlanShareSection({ mealPlan }: { mealPlan: any }) {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/meal-plans/${mealPlan.id}`;

  const handleShare = async (platform: string) => {
    // Track sharing event
    await fetch('/api/analytics/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealPlanId: mealPlan.id,
        platform,
        timestamp: new Date(),
      }),
    });

    // Optional: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'meal_plan',
        item_id: mealPlan.id,
      });
    }
  };

  return (
    <ShareButton
      title={mealPlan.title}
      description={mealPlan.description}
      url={shareUrl}
      type="meal-plan"
      mealPlan={mealPlan}
      variant="dropdown"
      onShare={handleShare}
    />
  );
}
```

---

## 7. Responsive Design Example

### Mobile-first share button placement

```typescript
export function ResponsiveShareButton({ mealPlan }: { mealPlan: any }) {
  const shareUrl = generateShareableLink(mealPlan.id);

  return (
    <>
      {/* Desktop: Top right corner */}
      <div className="hidden md:block absolute top-4 right-4">
        <ShareButton
          title={mealPlan.title}
          url={shareUrl}
          type="meal-plan"
          variant="dropdown"
        />
      </div>

      {/* Mobile: Fixed bottom button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <ShareButton
          title={mealPlan.title}
          url={shareUrl}
          type="meal-plan"
          variant="button"
          className="shadow-2xl bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full"
        />
      </div>

      {/* Alternative: Inline in mobile header */}
      <div className="md:hidden flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">{mealPlan.title}</h1>
        <ShareButton
          title={mealPlan.title}
          url={shareUrl}
          type="meal-plan"
          variant="icon"
        />
      </div>
    </>
  );
}
```

---

## 8. Feature Flag Integration Example

### Show/hide based on subscription tier

```typescript
'use client';

import { ShareButton } from '@/components/sharing/ShareButton';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Feature } from '@/lib/features/feature-flags';

export function PremiumShareButton({ mealPlan }: { mealPlan: any }) {
  const featureAccess = useFeatureAccess();
  const shareUrl = generateShareableLink(mealPlan.id);

  // Only show advanced sharing for premium users
  const hasPremiumSharing = featureAccess.hasFeature(Feature.SHARE_QR_CODE);

  return (
    <div>
      <ShareButton
        title={mealPlan.title}
        url={shareUrl}
        type="meal-plan"
        variant="dropdown"
      />

      {!hasPremiumSharing && (
        <p className="text-xs text-gray-500 mt-2">
          Upgrade to Premium for QR codes, social media sharing, and grocery integrations
        </p>
      )}
    </div>
  );
}
```

---

## 9. Custom Styling Examples

### Different visual styles

```typescript
// Minimal icon style
<ShareButton
  title={plan.title}
  url={shareUrl}
  type="meal-plan"
  variant="icon"
  className="text-gray-400 hover:text-blue-500 transition-colors"
/>

// Primary button style
<ShareButton
  title={plan.title}
  url={shareUrl}
  type="meal-plan"
  variant="button"
  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
/>

// Outline style
<ShareButton
  title={plan.title}
  url={shareUrl}
  type="meal-plan"
  variant="button"
  className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-md"
/>
```

---

## 10. Error Handling Example

### Handling share failures gracefully

```typescript
'use client';

import { useState } from 'react';
import { ShareButton } from '@/components/sharing/ShareButton';

export function ShareWithErrorHandling({ mealPlan }: { mealPlan: any }) {
  const [error, setError] = useState<string | null>(null);
  const shareUrl = generateShareableLink(mealPlan.id);

  const handleShare = async (platform: string) => {
    try {
      setError(null);
      
      // Custom logic here
      await trackShare(platform, mealPlan.id);
      
    } catch (err) {
      setError(`Failed to share to ${platform}. Please try again.`);
      console.error('Share error:', err);
    }
  };

  return (
    <div>
      <ShareButton
        title={mealPlan.title}
        url={shareUrl}
        type="meal-plan"
        variant="dropdown"
        onShare={handleShare}
      />

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
```

---

## Testing These Integrations

1. **Start your development server:**
```bash
npm run dev
```

2. **Navigate to each page and test:**
   - Click share buttons
   - Verify dropdown menus open
   - Test each sharing platform
   - Check mobile responsiveness

3. **Check feature flags:**
   - Test with free user account
   - Test with premium user account
   - Verify premium features are gated correctly

4. **Verify analytics (if implemented):**
   - Check that share events are tracked
   - Verify data is sent to analytics service

---

## Best Practices

1. **Always provide descriptive titles and descriptions** for better social media previews
2. **Use the correct variant** for the context (icon for cards, dropdown for detail pages)
3. **Track sharing events** for analytics and engagement metrics
4. **Handle errors gracefully** with user-friendly messages
5. **Test on actual devices** - especially mobile WhatsApp/calendar integrations
6. **Consider performance** - lazy load ShareButton on large lists
7. **Respect privacy** - don't share private meal plans without permission

---

## Next Steps

- ✅ Integrate ShareButton into your pages
- ✅ Test sharing on different platforms
- ✅ Set up analytics tracking
- ✅ Customize styling to match your design system
- ✅ Add share count tracking to database
- ✅ Implement viral growth features (referral tracking, etc.)
