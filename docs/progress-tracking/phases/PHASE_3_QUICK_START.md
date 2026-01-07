# Phase 3 Quick Start Guide

## Overview
Phase 3 focuses on building the UI components that connect to our newly created backend APIs. This phase will bring the 5x5x5 Progress Tracking System to life in the user interface.

---

## Prerequisites ✅

Before starting Phase 3, verify:
- ✅ Phase 1 Complete (Database schema deployed)
- ✅ Phase 2 Complete (7 API endpoints functional)
- ✅ TypeScript compiling with 0 errors
- ✅ Development server running (`npm run dev`)
- ✅ Database contains 37 foods

**Verification**:
```bash
npm run test:types    # Should show 0 errors
npm run test:apis     # Should show all tests passing
```

---

## Component Architecture

### 1. Core Components (Priority 1)

#### **MealTimeTracker** 
**Purpose**: Visual timeline showing 5 meal times throughout the day

**Location**: `components/progress/MealTimeTracker.tsx`

**Features**:
- Display all 5 meal times (Breakfast → Dinner)
- Show completion status for each meal time
- Click to log food for specific time
- Visual progress indicators

**Props**:
```typescript
interface MealTimeTrackerProps {
  date: Date;
  consumptions: FoodConsumption[];
  onMealClick: (mealTime: MealTime) => void;
}
```

**API Integration**:
- GET `/api/progress/daily-summary` for current state

---

#### **FoodSelector**
**Purpose**: Autocomplete input for selecting foods with multi-system badge display

**Location**: `components/progress/FoodSelector.tsx`

**Features**:
- Autocomplete search from food database
- Display defense system badges (A R M D I)
- Show multi-system foods prominently
- Quantity and unit input

**Props**:
```typescript
interface FoodSelectorProps {
  onSelect: (food: FoodDatabaseEntry) => void;
  placeholder?: string;
  autoFocus?: boolean;
}
```

**API Integration**:
- GET `/api/progress/food-database?search={query}`

---

#### **5x5x5ScoreCard**
**Purpose**: Dashboard widget showing overall 5x5x5 score

**Location**: `components/progress/ScoreCard5x5x5.tsx`

**Features**:
- Display overall score (0-100%)
- Show 3 dimension scores (systems, foods, frequency)
- Performance level badge (Beginner → Master)
- Visual gauge or progress bar

**Props**:
```typescript
interface ScoreCard5x5x5Props {
  date: Date;
  onRefresh?: () => void;
}
```

**API Integration**:
- GET `/api/progress/daily-summary`

---

### 2. Action Components (Priority 2)

#### **RecipeConsumptionModal**
**Purpose**: Modal for marking recipes as consumed

**Location**: `components/progress/RecipeConsumptionModal.tsx`

**Features**:
- Select meal time
- Adjust servings consumed
- Preview defense system impact
- One-click confirmation

**Props**:
```typescript
interface RecipeConsumptionModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**API Integration**:
- POST `/api/progress/mark-recipe-consumed`

---

#### **MealPlanSyncDialog**
**Purpose**: Dialog for syncing meal plans to progress

**Location**: `components/progress/MealPlanSyncDialog.tsx`

**Features**:
- Select date range
- Preview meals to sync
- Show sync progress
- Success confirmation

**Props**:
```typescript
interface MealPlanSyncDialogProps {
  mealPlan: MealPlan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**API Integration**:
- POST `/api/progress/sync-meal-plan`

---

#### **FoodLogModal**
**Purpose**: Modal for manually logging food consumption

**Location**: `components/progress/FoodLogModal.tsx`

**Features**:
- Select meal time
- Add multiple foods (FoodSelector)
- Add notes
- Submit consumption

**Props**:
```typescript
interface FoodLogModalProps {
  isOpen: boolean;
  defaultMealTime?: MealTime;
  onClose: () => void;
  onSuccess: () => void;
}
```

**API Integration**:
- POST `/api/progress/consumption`

---

### 3. Display Components (Priority 3)

#### **MultiSystemBadge**
**Purpose**: Reusable badge showing defense system indicators

**Location**: `components/ui/MultiSystemBadge.tsx`

**Features**:
- Display system abbreviations (A R M D I)
- Color-coded by system
- Show benefit strength (HIGH/MEDIUM/LOW)
- Tooltip with full system name

**Props**:
```typescript
interface MultiSystemBadgeProps {
  systems: Array<{
    system: DefenseSystem;
    strength?: BenefitStrength;
  }>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'compact';
}
```

**System Colors**:
- A (Angiogenesis): Red
- R (Regeneration): Green
- M (Microbiome): Purple
- D (DNA Protection): Blue
- I (Immunity): Orange

---

#### **SmartRecommendations**
**Purpose**: Display personalized food recommendations

**Location**: `components/progress/SmartRecommendations.tsx`

**Features**:
- Show missing systems
- Show missing meal times
- Display superfood suggestions
- Click to add to food log

**Props**:
```typescript
interface SmartRecommendationsProps {
  date: Date;
  onFoodClick: (food: FoodDatabaseEntry) => void;
}
```

**API Integration**:
- GET `/api/progress/recommendations`

---

#### **SystemProgressChart**
**Purpose**: Visual chart showing progress across all 5 systems

**Location**: `components/progress/SystemProgressChart.tsx`

**Features**:
- Radar/spider chart for 5 systems
- Show current vs target (5 foods each)
- Interactive tooltips
- Color-coded by system

**Props**:
```typescript
interface SystemProgressChartProps {
  date: Date;
  data?: DailyProgress5x5x5;
}
```

**Uses**: Recharts library (already installed)

---

### 4. Page Updates (Priority 4)

#### **Enhanced Progress Page**
**Location**: `app/(dashboard)/progress/page.tsx`

**Updates Needed**:
- Add MealTimeTracker at top
- Add 5x5x5ScoreCard
- Add SmartRecommendations section
- Add quick action buttons (Log Food, Sync Meal Plan)
- Update to use new API endpoints

**New Sections**:
1. Header: Date selector, overall score
2. Meal Timeline: MealTimeTracker
3. System Breakdown: SystemProgressChart
4. Recommendations: SmartRecommendations
5. Recent Activity: List of today's consumptions
6. Quick Actions: Floating action buttons

---

## Implementation Order

### Week 1: Core Display
1. ✅ MultiSystemBadge (foundation for others)
2. ✅ 5x5x5ScoreCard (show immediate value)
3. ✅ MealTimeTracker (central navigation)

### Week 2: Input Components
4. ✅ FoodSelector (enables food logging)
5. ✅ FoodLogModal (primary user action)
6. ✅ RecipeConsumptionModal (recipe integration)

### Week 3: Advanced Features
7. ✅ SmartRecommendations (AI-powered guidance)
8. ✅ SystemProgressChart (visual analytics)
9. ✅ MealPlanSyncDialog (automation)

### Week 4: Integration & Polish
10. ✅ Update Progress page layout
11. ✅ Add animations and transitions
12. ✅ Mobile responsiveness
13. ✅ User testing and refinement

---

## Design System

### Color Palette (Defense Systems)
```typescript
const systemColors = {
  ANGIOGENESIS: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: '🔴'
  },
  REGENERATION: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: '🟢'
  },
  MICROBIOME: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    icon: '🟣'
  },
  DNA_PROTECTION: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: '🔵'
  },
  IMMUNITY: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    icon: '🟠'
  }
};
```

### Typography
- Headings: Font bold, larger size
- Body: Regular weight
- Scores: Monospace font for numbers
- Badges: Uppercase, small caps

### Spacing
- Use Tailwind spacing scale (4px base)
- Card padding: `p-6`
- Section gaps: `gap-4` or `gap-6`
- Component margins: `mb-4` or `mb-6`

---

## State Management

### React Query (Recommended)
Install if not already present:
```bash
npm install @tanstack/react-query
```

**Benefits**:
- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

**Example**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useProgress(date: Date) {
  return useQuery({
    queryKey: ['progress', date.toISOString()],
    queryFn: () => fetch(`/api/progress/daily-summary?date=${date.toISOString()}`).then(r => r.json()),
  });
}

function useLogFood() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LogFoodData) => 
      fetch('/api/progress/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
```

---

## Testing Strategy

### Component Tests
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

**Test Coverage**:
- [ ] Each component renders correctly
- [ ] Buttons trigger expected actions
- [ ] Forms validate input
- [ ] API calls made with correct data
- [ ] Loading and error states display

### E2E Tests (Later)
- [ ] User can log food consumption
- [ ] User can mark recipe as consumed
- [ ] User can sync meal plan
- [ ] Scores update correctly
- [ ] Recommendations appear

---

## Accessibility

### Requirements
- ✅ Keyboard navigation for all interactions
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators visible
- ✅ Screen reader friendly
- ✅ Color contrast meets WCAG AA

### Best Practices
- Use semantic HTML
- Add `aria-label` to icon buttons
- Include focus management in modals
- Provide text alternatives for charts

---

## Performance

### Optimization Strategies
1. **Code Splitting**: Lazy load modals and dialogs
2. **Image Optimization**: Use Next.js Image component
3. **Data Caching**: Leverage React Query cache
4. **Debouncing**: Debounce search inputs
5. **Pagination**: Limit list lengths

---

## Development Workflow

```bash
# 1. Create component
touch components/progress/ComponentName.tsx

# 2. Start dev server
npm run dev

# 3. Test in browser
# Visit http://localhost:3000

# 4. Check types
npm run test:types

# 5. Commit changes
git add .
git commit -m "Add ComponentName component"
```

---

## Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [React Query Docs](https://tanstack.com/query/latest)
- [NextAuth Session Docs](https://next-auth.js.org/getting-started/client)

---

## Success Criteria

Phase 3 will be complete when:
- [ ] All 8 core components implemented
- [ ] Progress page updated with new features
- [ ] User can log food via UI
- [ ] User can see 5x5x5 score
- [ ] Recommendations display correctly
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)
- [ ] Performance optimized

---

**Ready to build the UI!** 🎨

Start with `MultiSystemBadge` as it's used by most other components.
