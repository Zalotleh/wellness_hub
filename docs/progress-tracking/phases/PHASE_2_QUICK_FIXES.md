# Phase 2 - Quick Fixes Reference

## Current Situation
- ✅ Phase 1: Database schema deployed successfully (37 foods seeded)
- 🔄 Phase 2: 7 API endpoints created but have TypeScript errors
- ❌ 21 TypeScript compilation errors across 7 files

## Quick Fix Checklist

### 1. Fix Import Statements
**Problem**: Using default import for Prisma client
**Files Affected**: All API routes
**Fix**:
```typescript
// ❌ Wrong
import prisma from '@/lib/prisma';

// ✅ Correct
import { prisma } from '@/lib/prisma';
```

### 2. Remove customMealName Field
**Problem**: Field doesn't exist in FoodConsumption model
**Files Affected**: 
- `app/api/progress/consumption/route.ts`
- `app/api/progress/mark-recipe-consumed/route.ts`
- `app/api/progress/daily-summary/route.ts`

**Fix**: Remove `customMealName` field from all queries and mutations

### 3. Fix FoodDatabase Queries
**Problem**: Incorrect query structure for defenseSystems relation
**File**: `app/api/progress/recommendations/route.ts`
**Current**:
```typescript
where: {
  defenseSystems: {
    some: {
      system: system,
      strength: 'HIGH',
    },
  },
}
```
**Need to verify**: Schema structure for FoodDatabase.defenseSystems relation

### 4. Fix MealPlan Include
**Problem**: 'meals' relation might not be included correctly
**File**: `app/api/progress/sync-meal-plan/route.ts`
**Need to verify**: MealPlan schema structure

### 5. Add Missing Type Annotations
**Problem**: Implicit 'any' types on callbacks
**Files**: Multiple
**Fix**: Add explicit type annotations to all callback parameters

### 6. Fix weekly-summary Score Property
**Problem**: Using `score` instead of `overallScore`
**File**: `app/api/progress/weekly-summary/route.ts`
**Fix**: Rename property to match expected type

## Files That Need Fixing

### Priority 1: Schema Alignment
1. Check actual Prisma schema for FoodDatabase model structure
2. Verify FoodConsumption model fields
3. Verify MealPlan relations

### Priority 2: Type Fixes
1. `app/api/progress/recommendations/route.ts` - 3 errors
2. `app/api/progress/sync-meal-plan/route.ts` - 4 errors
3. `app/api/progress/mark-recipe-consumed/route.ts` - 7 errors

### Priority 3: Minor Fixes
1. `app/api/progress/consumption/route.ts` - 1 error
2. `app/api/progress/daily-summary/route.ts` - 1 error
3. `app/api/progress/weekly-summary/route.ts` - 1 error
4. `lib/utils/food-matcher.ts` - 1 error

## Verification Steps

### After Fixes:
```bash
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Generate Prisma client (if schema changed)
npx prisma generate

# 3. Run development server
npm run dev

# 4. Test API endpoints
# Use Postman, curl, or built-in testing tools
```

## Testing Endpoints

### Test 1: Food Database Search
```bash
curl http://localhost:3000/api/progress/food-database?search=blueberry
```

### Test 2: Get Recommendations
```bash
curl http://localhost:3000/api/progress/recommendations?date=2024-01-15
```

### Test 3: Log Consumption
```bash
curl -X POST http://localhost:3000/api/progress/consumption \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "mealTime": "BREAKFAST",
    "foods": [{"name": "Blueberries", "quantity": 1, "unit": "cup"}]
  }'
```

## Next Steps After Fixes

1. **Complete Phase 2**:
   - Fix all TypeScript errors
   - Test all 7 endpoints
   - Write API documentation
   - Add input validation (Zod schemas)

2. **Begin Phase 3** (UI Components):
   - MealTimeTracker component
   - FoodSelector with autocomplete
   - 5x5x5 Score visualization
   - Recipe consumption UI
   - Meal plan sync interface

3. **Phase 4** (Integration):
   - Connect UI to new APIs
   - Update existing pages
   - Add real-time updates
   - Polish user experience

## Key Schema Reference

### FoodConsumption Model (Actual):
```prisma
model FoodConsumption {
  id           String            @id @default(cuid())
  userId       String
  date         DateTime          @db.Date
  mealTime     MealTime
  timeConsumed DateTime?
  sourceType   ConsumptionSource
  recipeId     String?
  mealId       String?
  mealPlanId   String?
  servings     Float             @default(1)
  notes        String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  user         User              @relation(...)
  recipe       Recipe?           @relation(...)
  meal         Meal?             @relation(...)
  mealPlan     MealPlan?         @relation(...)
  foodItems    FoodItem[]
}
```

### FoodItem Model (Actual):
```prisma
model FoodItem {
  id             String                  @id @default(cuid())
  consumptionId  String
  name           String
  quantity       Float?
  unit           String?
  
  defenseSystems DefenseSystemBenefit[]
  consumption    FoodConsumption         @relation(...)
}
```

### DefenseSystemBenefit Model (Actual):
```prisma
model DefenseSystemBenefit {
  id            String          @id @default(cuid())
  foodItemId    String
  defenseSystem DefenseSystem  // Note: field name is defenseSystem, not system
  strength      BenefitStrength @default(MEDIUM)
  
  foodItem      FoodItem        @relation(...)
}
```

## Common Mistakes to Avoid

1. ❌ Don't use `system` - use `defenseSystem`
2. ❌ Don't use `foods` relation - use `foodItems`
3. ❌ Don't use `benefits` relation - use `defenseSystems`
4. ❌ Don't add fields that don't exist in schema
5. ❌ Don't forget to include relations in queries

## Success Criteria

Phase 2 complete when:
- ✅ Zero TypeScript errors
- ✅ All 7 endpoints respond correctly
- ✅ Database queries return expected data
- ✅ Multi-system tracking works
- ✅ 5x5x5 scoring calculates correctly

---

**Current Status**: Awaiting TypeScript error fixes
**Estimated Time**: 1-2 hours for fixes + testing
**Blocker**: Cannot test endpoints until compilation succeeds
