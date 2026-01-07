# Progress Tracking System Redesign & Implementation Plan

## Executive Summary

This document outlines a comprehensive redesign of the progress tracking system to fully implement the **5x5x5 Defense System** concept and integrate it with recipes and meal plans.

---

## Current System Analysis

### What Exists Now

#### ✅ Strengths
1. **Defense System Framework**: Well-defined 5 defense systems (Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity)
2. **Manual Food Logging**: Users can log up to 5 foods per system per day
3. **Progress Visualization**: Daily and weekly charts showing completion percentages
4. **Food Database**: Comprehensive list of foods categorized by defense system
5. **Database Schema**: `Progress` model with daily tracking by defense system

#### ❌ Gaps & Issues

1. **Missing "5 Times Per Day" Tracking**
   - Current: Only tracks 5 foods per system (2 out of 3 dimensions of 5x5x5)
   - Missing: No concept of eating frequency (5 times per day)
   - Impact: Users can't track meal timing or frequency

2. **No Multi-System Food Categorization**
   - Current: Foods are categorized per system but can't be tagged across multiple systems
   - Example: Blueberries benefit both Angiogenesis AND Regeneration, but logging it for one system doesn't reflect in the other
   - Impact: Users under-report actual defense system coverage

3. **Zero Recipe Integration**
   - Current: Progress tracking and recipes are completely separate
   - No way to mark a recipe as "consumed" and have it auto-populate progress
   - Recipes contain ingredients that map to defense systems, but this data isn't leveraged

4. **No Meal Plan Synchronization**
   - Current: Meal plans exist with scheduled dates but don't interact with progress
   - Users must manually log foods even if they're following a planned meal
   - Date misalignment between meal plans and progress tracking

5. **Limited Progress Sources**
   - Current: Only manual food entry
   - Missing: Recipe-based tracking, meal plan consumption tracking, quick logging from recipes

### Database Schema Analysis

```prisma
// Current Progress Model
model Progress {
  id            String        @id @default(cuid())
  userId        String
  date          DateTime      @db.Date
  defenseSystem DefenseSystem  // Only ONE system per entry
  foodsConsumed Json           // Array of food strings
  count         Int
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  user          User          @relation(...)

  @@unique([userId, date, defenseSystem])
}

// Available: MealPlan, DailyMenu, Meal, GeneratedRecipe
// No connection between these and Progress model
```

**Problems:**
- `defenseSystem` is singular - can't track a food across multiple systems
- `foodsConsumed` is a simple JSON array - no metadata about timing, servings, or multi-system benefits
- No relationship to `Recipe`, `Meal`, or `MealPlan` models
- No concept of "meal times" (breakfast, lunch, dinner, snacks)

---

## Understanding the 5x5x5 Concept

### The Three Dimensions

1. **5 Defense Systems**: Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity
2. **5 Foods Per System**: Aim for 5 different foods that support each system daily
3. **5 Times Per Day**: Eat 5 times throughout the day (3 meals + 2 snacks)

### Ideal Daily Goal
- **25 food servings total** across the day (5 systems × 5 foods)
- **Distributed across 5 eating occasions** (breakfast, snack, lunch, snack, dinner)
- **Cross-system benefits**: Many foods support multiple systems simultaneously

### Example Day (Perfect 5x5x5)

**Breakfast (8 AM)**: Smoothie Bowl
- Blueberries → Angiogenesis + Regeneration
- Spinach → Angiogenesis + Microbiome
- Chia Seeds → Angiogenesis + Immunity
- Yogurt → Microbiome
- Walnuts → Regeneration + DNA Protection

**Morning Snack (10:30 AM)**: Trail Mix
- Almonds → DNA Protection
- Dark Chocolate → Angiogenesis + Regeneration
- Dried Cranberries → Immunity

**Lunch (1 PM)**: Salmon Salad
- Wild Salmon → Regeneration + Immunity
- Kale → Angiogenesis + DNA Protection
- Tomatoes → Angiogenesis
- Olive Oil → Angiogenesis + Microbiome
- Chickpeas → Microbiome

**Afternoon Snack (4 PM)**: Fruit & Nuts
- Apple → Angiogenesis
- Pecans → Regeneration

**Dinner (7 PM)**: Stir-Fry
- Broccoli → DNA Protection + Immunity
- Bell Peppers → Angiogenesis
- Brown Rice → Microbiome
- Garlic → Immunity + Microbiome
- Green Tea → Angiogenesis + Regeneration

**Result**: 
- ✅ 5 eating times
- ✅ 5+ foods per system (with multi-system counting)
- ✅ 25+ total food items

---

## Proposed Solution Architecture

### High-Level Strategy

1. **Enhanced Food Item Model**: Track individual food items with multi-system associations
2. **Meal Consumption Tracking**: Log meals by time of day
3. **Recipe Integration**: Auto-populate progress from consumed recipes
4. **Meal Plan Sync**: Connect meal plan schedules to progress tracking
5. **Intelligent Analysis**: Calculate multi-system benefits automatically

---

## Detailed Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 New Models

```prisma
// Enhanced food consumption entry
model FoodConsumption {
  id              String          @id @default(cuid())
  userId          String
  date            DateTime        @db.Date
  mealTime        MealTime        // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, DINNER
  timeConsumed    DateTime?       // Actual timestamp when consumed
  
  // Source tracking
  sourceType      ConsumptionSource  // MANUAL, RECIPE, MEAL_PLAN
  recipeId        String?
  mealId          String?         // From meal plan
  mealPlanId      String?
  
  // Food details
  foodItems       FoodItem[]      // Relation to individual foods
  servings        Float           @default(1)
  notes           String?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  user            User            @relation(...)
  recipe          Recipe?         @relation(...)
  meal            Meal?           @relation(...)
  mealPlan        MealPlan?       @relation(...)
  
  @@index([userId, date])
  @@index([userId, date, mealTime])
}

// Individual food item with multi-system associations
model FoodItem {
  id                 String             @id @default(cuid())
  consumptionId      String
  name               String
  quantity           Float?
  unit               String?
  
  // Multi-system tracking
  defenseSystems     DefenseSystemBenefit[]
  
  consumption        FoodConsumption    @relation(...)
  
  @@index([consumptionId])
}

// Junction table for food-defense system relationship
model DefenseSystemBenefit {
  id              String          @id @default(cuid())
  foodItemId      String
  defenseSystem   DefenseSystem
  strength        BenefitStrength @default(MEDIUM)  // LOW, MEDIUM, HIGH
  
  foodItem        FoodItem        @relation(...)
  
  @@unique([foodItemId, defenseSystem])
  @@index([defenseSystem])
}

// Enums
enum MealTime {
  BREAKFAST
  MORNING_SNACK
  LUNCH
  AFTERNOON_SNACK
  DINNER
  EVENING_SNACK    // Optional 6th time
  CUSTOM
}

enum ConsumptionSource {
  MANUAL           // User manually logs individual foods
  RECIPE           // From marking a recipe as consumed
  MEAL_PLAN        // From meal plan tracking
}

enum BenefitStrength {
  LOW              // Minor benefit
  MEDIUM           // Moderate benefit
  HIGH             // Primary benefit
}
```

#### 1.2 Schema Additions to Existing Models

```prisma
// Add to Recipe model
model Recipe {
  // ... existing fields ...
  consumptions    FoodConsumption[]
  
  // Add ingredient-system mapping
  ingredientSystemMap  Json?  // Maps each ingredient to defense systems
}

// Add to Meal model (in meal plans)
model Meal {
  // ... existing fields ...
  consumed        Boolean          @default(false)
  consumedAt      DateTime?
  consumptions    FoodConsumption[]
}

// Add to MealPlan model
model MealPlan {
  // ... existing fields ...
  consumptions    FoodConsumption[]
}

// Keep existing Progress model for backward compatibility
// Will be gradually deprecated
model Progress {
  // ... existing fields ...
  deprecated      Boolean          @default(false)
  migratedTo      String?          // ID of FoodConsumption entry
}
```

#### 1.3 Food-Defense System Master Database

```prisma
// Optional: Master food database with pre-categorized foods
model FoodDatabase {
  id                String          @id @default(cuid())
  name              String          @unique
  category          String          // Fruits, Vegetables, Proteins, etc.
  defenseSystems    DefenseSystem[] // Primary systems
  nutrients         String[]
  description       String?
  
  // Multi-system benefits with strength
  systemBenefits    Json            // { ANGIOGENESIS: "HIGH", REGENERATION: "MEDIUM" }
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([name])
  @@index([category])
}
```

---

### Phase 2: Backend API Updates

#### 2.1 New API Endpoints

```typescript
// POST /api/progress/consumption
// Log a meal consumption
interface CreateConsumptionRequest {
  date: string;                    // ISO date
  mealTime: MealTime;
  timeConsumed?: string;           // ISO timestamp
  sourceType: ConsumptionSource;
  
  // Source references
  recipeId?: string;
  mealId?: string;
  mealPlanId?: string;
  
  // Food items
  foodItems: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    defenseSystems: Array<{
      system: DefenseSystem;
      strength?: BenefitStrength;
    }>;
  }>;
  
  servings?: number;
  notes?: string;
}

// POST /api/progress/mark-recipe-consumed
// Mark a recipe as consumed and auto-log progress
interface MarkRecipeConsumedRequest {
  recipeId: string;
  date: string;
  mealTime: MealTime;
  servings?: number;
  notes?: string;
}

// POST /api/progress/mark-meal-consumed
// Mark a meal plan meal as consumed
interface MarkMealConsumedRequest {
  mealId: string;
  mealPlanId: string;
  date: string;
  actualMealTime?: MealTime;       // Override scheduled time if different
  servings?: number;
  notes?: string;
}

// POST /api/progress/sync-meal-plan
// Bulk sync entire meal plan or date range to progress
interface SyncMealPlanRequest {
  mealPlanId: string;
  syncType: 'DAY' | 'WEEK' | 'FULL_PLAN';
  startDate?: string;
  endDate?: string;
  markAllConsumed?: boolean;       // Auto-mark as consumed
}

// GET /api/progress/daily-summary
// Enhanced daily summary with all 3 dimensions
interface DailySummaryResponse {
  date: string;
  
  // Dimension 1: Defense Systems (5 systems)
  systemProgress: {
    [key in DefenseSystem]: {
      foodCount: number;
      uniqueFoods: string[];
      target: number;
      percentage: number;
      topFoods: Array<{
        name: string;
        count: number;
        benefitStrength: BenefitStrength;
      }>;
    };
  };
  
  // Dimension 2: Food Variety (5 foods per system)
  foodVariety: {
    totalUniqueFoods: number;
    totalFoodServings: number;
    foodsBySystem: {
      [key in DefenseSystem]: string[];
    };
  };
  
  // Dimension 3: Meal Frequency (5 times per day)
  mealFrequency: {
    mealsConsumed: number;
    target: 5;
    percentage: number;
    mealTimes: Array<{
      mealTime: MealTime;
      timeConsumed: string | null;
      foods: string[];
      defenseSystems: DefenseSystem[];
      sourceType: ConsumptionSource;
    }>;
    missedMealTimes: MealTime[];
  };
  
  // Overall 5x5x5 score
  overall: {
    systemsComplete: number;        // Systems with 5+ foods
    foodsPerSystemAvg: number;
    mealsConsumed: number;
    overallPercentage: number;      // Combined score
    streak: number;                 // Consecutive days achieving 5x5x5
  };
}

// GET /api/progress/weekly-summary
// Enhanced weekly analytics
interface WeeklySummaryResponse {
  startDate: string;
  endDate: string;
  
  dailySummaries: DailySummaryResponse[];
  
  weeklyAverages: {
    avgSystemCompletion: number;
    avgFoodsPerDay: number;
    avgMealsPerDay: number;
    bestDay: string;
    worstDay: string;
  };
  
  systemTrends: {
    [key in DefenseSystem]: {
      avgCompletion: number;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      daysCompleted: number;
    };
  };
  
  achievements: Array<{
    type: string;
    description: string;
    earnedAt: string;
  }>;
}

// GET /api/progress/food-database
// Get master food database with system associations
interface FoodDatabaseResponse {
  foods: Array<{
    id: string;
    name: string;
    category: string;
    defenseSystems: DefenseSystem[];
    systemBenefits: {
      [key in DefenseSystem]?: BenefitStrength;
    };
    nutrients: string[];
  }>;
}

// PUT /api/recipes/:id/ingredient-mapping
// Map recipe ingredients to defense systems
interface UpdateIngredientMappingRequest {
  ingredientSystemMap: {
    [ingredientName: string]: Array<{
      system: DefenseSystem;
      strength: BenefitStrength;
    }>;
  };
}
```

#### 2.2 Updated Logic

```typescript
// lib/utils/progress-calculator.ts

export interface FoodSystemBenefit {
  system: DefenseSystem;
  strength: BenefitStrength;
}

export interface FoodWithSystems {
  name: string;
  systems: FoodSystemBenefit[];
}

/**
 * Calculate multi-system benefits for a list of foods
 * One food can contribute to multiple systems
 */
export function calculateSystemBenefits(
  foods: FoodWithSystems[]
): Record<DefenseSystem, Set<string>> {
  const systemFoods: Record<DefenseSystem, Set<string>> = {
    [DefenseSystem.ANGIOGENESIS]: new Set(),
    [DefenseSystem.REGENERATION]: new Set(),
    [DefenseSystem.MICROBIOME]: new Set(),
    [DefenseSystem.DNA_PROTECTION]: new Set(),
    [DefenseSystem.IMMUNITY]: new Set(),
  };
  
  foods.forEach(food => {
    food.systems.forEach(benefit => {
      systemFoods[benefit.system].add(food.name);
    });
  });
  
  return systemFoods;
}

/**
 * Calculate 5x5x5 score for a given day
 */
export function calculate5x5x5Score(consumption: {
  systemFoodCounts: Record<DefenseSystem, number>;
  totalMeals: number;
}): {
  systemScore: number;      // Out of 5
  foodScore: number;        // Out of 5
  frequencyScore: number;   // Out of 5
  overallScore: number;     // Out of 100
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
} {
  // System dimension: How many systems hit 5 foods?
  const systemsComplete = Object.values(consumption.systemFoodCounts)
    .filter(count => count >= 5).length;
  
  // Food dimension: Average foods per system
  const avgFoodsPerSystem = Object.values(consumption.systemFoodCounts)
    .reduce((sum, count) => sum + count, 0) / 5;
  
  // Frequency dimension: Meals consumed
  const frequencyScore = Math.min(consumption.totalMeals, 5);
  
  // Overall percentage
  const systemPerc = (systemsComplete / 5) * 100;
  const foodPerc = (Math.min(avgFoodsPerSystem, 5) / 5) * 100;
  const freqPerc = (frequencyScore / 5) * 100;
  
  const overallScore = (systemPerc + foodPerc + freqPerc) / 3;
  
  // Determine level
  let level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER' = 'BEGINNER';
  if (overallScore >= 90) level = 'MASTER';
  else if (overallScore >= 70) level = 'ADVANCED';
  else if (overallScore >= 50) level = 'INTERMEDIATE';
  
  return {
    systemScore: systemsComplete,
    foodScore: avgFoodsPerSystem,
    frequencyScore,
    overallScore,
    level,
  };
}

/**
 * Extract defense system benefits from recipe ingredients
 */
export async function extractRecipeSystemBenefits(
  recipe: Recipe,
  foodDatabase: FoodDatabase[]
): Promise<FoodWithSystems[]> {
  const ingredients = recipe.ingredients as Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  
  const foodsWithSystems: FoodWithSystems[] = [];
  
  for (const ingredient of ingredients) {
    // Match ingredient to food database
    const foodEntry = foodDatabase.find(food => 
      ingredient.name.toLowerCase().includes(food.name.toLowerCase()) ||
      food.name.toLowerCase().includes(ingredient.name.toLowerCase())
    );
    
    if (foodEntry) {
      const systems = Object.entries(foodEntry.systemBenefits).map(
        ([system, strength]) => ({
          system: system as DefenseSystem,
          strength: strength as BenefitStrength,
        })
      );
      
      foodsWithSystems.push({
        name: ingredient.name,
        systems,
      });
    } else {
      // If not in database, use recipe's defenseSystems as fallback
      // Distribute equally across recipe's tagged systems
      const systems = recipe.defenseSystems.map(system => ({
        system,
        strength: BenefitStrength.MEDIUM,
      }));
      
      foodsWithSystems.push({
        name: ingredient.name,
        systems,
      });
    }
  }
  
  return foodsWithSystems;
}
```

---

### Phase 3: Frontend Components

#### 3.1 Enhanced Progress Tracker UI

**Components to Create/Update:**

1. **`MealTimeTracker.tsx`** - NEW
   - Visual timeline of 5 meal times
   - Shows consumed vs. missed meals
   - Click to log food for specific meal time
   - Drag-and-drop from recipe suggestions

2. **`DefenseSystemGrid.tsx`** - ENHANCED
   - Current: Shows 5 systems with food count
   - New: Shows multi-system food highlighting
   - Hover over food to see all systems it benefits

3. **`FoodSelector.tsx`** - NEW
   - Smart autocomplete with food database
   - Shows which systems each food supports
   - Visual indicators (badges) for multi-system foods
   - Filter by: All Foods, Favorites, Recently Used, High Impact

4. **`RecipeConsumptionModal.tsx`** - NEW
   - Popup when clicking "Mark as Consumed" on a recipe
   - Select date and meal time
   - Shows which systems the recipe supports
   - Preview of progress impact
   - Option to adjust servings

5. **`MealPlanSyncDialog.tsx`** - NEW
   - Interface to sync meal plan to progress
   - Options: Sync Today, Sync This Week, Sync Full Plan
   - Preview changes before confirming
   - Checkbox: "Mark all as consumed"

6. **`ProgressDashboard.tsx`** - ENHANCED
   - Three tabs: Daily Progress, Weekly Analytics, Meal Plan Sync
   - **Daily Progress Tab:**
     - Meal Time Timeline (5 meals)
     - Defense System Progress (5 systems)
     - Food Variety Counter (X/25 foods logged)
     - 5x5x5 Score visualization
   - **Weekly Analytics Tab:**
     - All existing charts
     - New: Meal frequency heatmap
     - New: Multi-system food analysis
   - **Meal Plan Sync Tab:** - NEW
     - List of active meal plans
     - Quick sync buttons
     - Sync history

#### 3.2 Recipe Page Enhancements

**Add to Recipe Detail Page:**

```tsx
// components/recipes/RecipeActions.tsx

interface RecipeActionsProps {
  recipe: RecipeWithRelations;
  onMarkConsumed?: () => void;
}

export function RecipeActions({ recipe, onMarkConsumed }: RecipeActionsProps) {
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  
  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowConsumptionModal(true)}
          className="btn-primary"
        >
          <Check className="w-4 h-4" />
          Mark as Consumed
        </button>
        
        <button className="btn-secondary">
          <Calendar className="w-4 h-4" />
          Add to Meal Plan
        </button>
      </div>
      
      {showConsumptionModal && (
        <RecipeConsumptionModal
          recipe={recipe}
          onClose={() => setShowConsumptionModal(false)}
          onConfirm={onMarkConsumed}
        />
      )}
    </>
  );
}
```

**Defense System Preview:**

```tsx
// components/recipes/RecipeSystemImpact.tsx

export function RecipeSystemImpact({ recipe }: { recipe: RecipeWithRelations }) {
  const [systemBreakdown, setSystemBreakdown] = useState<any>(null);
  
  useEffect(() => {
    // Fetch system breakdown for recipe ingredients
    fetchSystemBreakdown(recipe.id).then(setSystemBreakdown);
  }, [recipe.id]);
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Defense System Impact</h3>
      <p className="text-sm text-gray-600 mb-3">
        This recipe supports {recipe.defenseSystems.length} defense systems
      </p>
      
      <div className="space-y-2">
        {recipe.defenseSystems.map(system => (
          <div key={system} className="flex items-center gap-2">
            <span className="text-2xl">{getSystemIcon(system)}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{getSystemName(system)}</span>
                <span className="text-sm">
                  {systemBreakdown?.[system]?.ingredientCount || 0} ingredients
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {systemBreakdown?.[system]?.ingredients.map((ing: string) => (
                  <span
                    key={ing}
                    className="text-xs bg-white px-2 py-1 rounded-full"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border-2 border-green-500">
        <p className="text-sm font-medium">
          ✅ Consuming this recipe will add {systemBreakdown?.totalFoods || 0} foods
          to your daily progress across {recipe.defenseSystems.length} systems!
        </p>
      </div>
    </div>
  );
}
```

#### 3.3 Updated Progress Page Layout

```tsx
// app/(dashboard)/progress/page.tsx

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'sync'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime | null>(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with 5x5x5 Branding */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">5×5×5 Progress Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">
            5 Defense Systems × 5 Foods Each × 5 Times Daily = Optimal Health
          </p>
        </header>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={cn('tab', activeTab === 'daily' && 'tab-active')}
          >
            <Calendar className="w-4 h-4" />
            Daily Progress
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={cn('tab', activeTab === 'weekly' && 'tab-active')}
          >
            <BarChart3 className="w-4 h-4" />
            Weekly Analytics
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={cn('tab', activeTab === 'sync' && 'tab-active')}
          >
            <RefreshCw className="w-4 h-4" />
            Meal Plan Sync
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'daily' && (
          <DailyProgressTab
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedMealTime={selectedMealTime}
            onMealTimeChange={setSelectedMealTime}
          />
        )}
        
        {activeTab === 'weekly' && (
          <WeeklyAnalyticsTab />
        )}
        
        {activeTab === 'sync' && (
          <MealPlanSyncTab />
        )}
      </div>
    </div>
  );
}
```

---

### Phase 4: Intelligent Features

#### 4.1 Smart Food Recommendations

```typescript
// lib/ai/food-recommendations.ts

export interface FoodRecommendation {
  food: string;
  systems: DefenseSystem[];
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Analyze user's daily progress and recommend foods
 * to complete their 5x5x5 goal
 */
export async function generateSmartRecommendations(
  userId: string,
  date: Date
): Promise<FoodRecommendation[]> {
  // Get current progress for the day
  const dailySummary = await getDailySummary(userId, date);
  
  // Identify gaps
  const systemsNeedingFoods = Object.entries(dailySummary.systemProgress)
    .filter(([_, data]) => data.foodCount < 5)
    .sort((a, b) => a[1].foodCount - b[1].foodCount); // Prioritize systems with fewer foods
  
  const recommendations: FoodRecommendation[] = [];
  
  // Get foods already consumed today to avoid repetition
  const consumedToday = new Set(
    Object.values(dailySummary.systemProgress)
      .flatMap(s => s.uniqueFoods)
  );
  
  for (const [system, data] of systemsNeedingFoods) {
    const systemEnum = system as DefenseSystem;
    const needed = 5 - data.foodCount;
    
    // Get foods that benefit this system AND other incomplete systems (multi-system foods)
    const multiSystemFoods = await findMultiSystemFoods(
      systemEnum,
      systemsNeedingFoods.map(([s]) => s as DefenseSystem)
    );
    
    const availableFoods = multiSystemFoods.filter(
      food => !consumedToday.has(food.name)
    );
    
    // Prioritize multi-system foods
    const topFoods = availableFoods
      .slice(0, needed)
      .map(food => ({
        food: food.name,
        systems: food.systems,
        reason: `Supports ${food.systems.length} systems including ${getSystemName(systemEnum)}`,
        priority: food.systems.length >= 3 ? 'HIGH' : 'MEDIUM' as const,
      }));
    
    recommendations.push(...topFoods);
  }
  
  return recommendations;
}

/**
 * Find foods that benefit multiple target systems
 */
async function findMultiSystemFoods(
  primarySystem: DefenseSystem,
  otherSystems: DefenseSystem[]
): Promise<Array<{ name: string; systems: DefenseSystem[] }>> {
  const foodDb = await getFoodDatabase();
  
  return foodDb
    .filter(food => {
      const foodSystems = Object.keys(food.systemBenefits) as DefenseSystem[];
      return foodSystems.includes(primarySystem);
    })
    .map(food => ({
      name: food.name,
      systems: Object.keys(food.systemBenefits) as DefenseSystem[],
    }))
    .sort((a, b) => {
      // Sort by how many target systems each food supports
      const aScore = a.systems.filter(s => otherSystems.includes(s)).length;
      const bScore = b.systems.filter(s => otherSystems.includes(s)).length;
      return bScore - aScore;
    });
}
```

#### 4.2 Auto-Categorization from Recipes

```typescript
// lib/ai/ingredient-categorizer.ts

/**
 * Use AI to automatically categorize recipe ingredients
 * into defense systems when user creates/edits a recipe
 */
export async function autoCategorizIngredients(
  ingredients: Array<{ name: string; quantity: number; unit: string }>
): Promise<Record<string, FoodSystemBenefit[]>> {
  const foodDb = await getFoodDatabase();
  const mapping: Record<string, FoodSystemBenefit[]> = {};
  
  for (const ingredient of ingredients) {
    // Try exact match first
    const exactMatch = foodDb.find(
      food => food.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    
    if (exactMatch) {
      mapping[ingredient.name] = Object.entries(exactMatch.systemBenefits).map(
        ([system, strength]) => ({
          system: system as DefenseSystem,
          strength: strength as BenefitStrength,
        })
      );
      continue;
    }
    
    // Try fuzzy match
    const fuzzyMatch = foodDb.find(food =>
      ingredient.name.toLowerCase().includes(food.name.toLowerCase()) ||
      food.name.toLowerCase().includes(ingredient.name.toLowerCase())
    );
    
    if (fuzzyMatch) {
      mapping[ingredient.name] = Object.entries(fuzzyMatch.systemBenefits).map(
        ([system, strength]) => ({
          system: system as DefenseSystem,
          strength: strength as BenefitStrength,
        })
      );
      continue;
    }
    
    // If no match, use AI (optional - can use OpenAI API)
    // For now, mark as unknown
    mapping[ingredient.name] = [];
  }
  
  return mapping;
}
```

---

### Phase 5: Migration Strategy

#### 5.1 Data Migration

```typescript
// scripts/migrate-progress-data.ts

/**
 * Migrate existing Progress entries to new FoodConsumption model
 */
export async function migrateProgressData() {
  const oldProgressEntries = await prisma.progress.findMany({
    where: { deprecated: false },
    orderBy: { date: 'desc' },
  });
  
  console.log(`Found ${oldProgressEntries.length} progress entries to migrate`);
  
  for (const entry of oldProgressEntries) {
    try {
      // Parse foods consumed
      const foods = entry.foodsConsumed as string[];
      
      // Create new FoodConsumption entry
      const newEntry = await prisma.foodConsumption.create({
        data: {
          userId: entry.userId,
          date: entry.date,
          mealTime: MealTime.CUSTOM, // Unknown - mark as custom
          sourceType: ConsumptionSource.MANUAL,
          notes: entry.notes,
          
          foodItems: {
            create: foods.map(foodName => ({
              name: foodName,
              defenseSystems: {
                create: {
                  defenseSystem: entry.defenseSystem,
                  strength: BenefitStrength.MEDIUM,
                },
              },
            })),
          },
        },
      });
      
      // Mark old entry as deprecated and link to new one
      await prisma.progress.update({
        where: { id: entry.id },
        data: {
          deprecated: true,
          migratedTo: newEntry.id,
        },
      });
      
      console.log(`✅ Migrated progress entry ${entry.id}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${entry.id}:`, error);
    }
  }
  
  console.log('Migration complete!');
}
```

#### 5.2 Backward Compatibility

- Keep old `Progress` model for 3 months
- Display deprecation warning in UI
- Gradually redirect users to new system
- Provide "Import Old Data" button

---

## UI/UX Recommendations

### Design Improvements

#### 1. **5x5x5 Score Visualization**

Create a unique visual identity for the 5x5x5 concept:

```
┌─────────────────────────────────────────┐
│         5×5×5 Daily Score: 87%          │
│                                         │
│   ★ ★ ★ ★ ★   Defense Systems           │
│   ● ● ● ● ○   (4/5 Complete)            │
│                                         │
│   🍎 🥗 🫐 🥜   Food Variety              │
│   ● ● ● ● ○   (4.2/5 Avg per System)    │
│                                         │
│   🍳 ☕ 🥙 🍵   Meal Frequency            │
│   ● ● ● ● ○   (4/5 Times Today)         │
│                                         │
│          🏆 ADVANCED LEVEL              │
└─────────────────────────────────────────┘
```

#### 2. **Meal Time Timeline**

Horizontal timeline showing 5 meal times:

```
Breakfast   Morning Snack   Lunch   Afternoon Snack   Dinner
   ✅           ❌            ✅          ❌             ⏰
 8:00 AM                  12:30 PM                  (Upcoming)

Click to log food →
```

#### 3. **Multi-System Food Badges**

When displaying foods, show which systems they support:

```
┌─────────────────────────┐
│  🫐 Blueberries         │
│  ┌─┐ ┌─┐               │
│  │A│ │R│  Angiogenesis  │
│  └─┘ └─┘  Regeneration  │
└─────────────────────────┘
```

Legend: A=Angiogenesis, R=Regeneration, M=Microbiome, D=DNA, I=Immunity

#### 4. **Quick Add from Recipes**

In Progress page, show:

```
┌────────────────────────────────────┐
│  Recently Consumed Recipes         │
│                                    │
│  [Quinoa Buddha Bowl] ────────┐   │
│   Last eaten: 2 days ago       │   │
│   Systems: A, R, M             │   │
│   [Quick Add to Today] ────────┘   │
│                                    │
│  [Mediterranean Salmon]            │
│   Last eaten: 4 days ago           │
│   [Quick Add to Today]             │
└────────────────────────────────────┘
```

#### 5. **Progress Heatmap Calendar**

Monthly view showing daily 5x5x5 scores:

```
      Mon  Tue  Wed  Thu  Fri  Sat  Sun
W1     🟢   🟢   🟡   🟢   🔴   🟢   🟡
W2     🟢   🟢   🟢   🟡   🟢   🟢   🟢
W3     🔴   🟢   🟡   🟢   🟢   ⚪   ⚪

🟢 90-100%  🟡 70-89%  🔴 50-69%  ⚪ No data
```

#### 6. **Meal Plan Integration Button**

On meal plan page:

```
┌──────────────────────────────────────────┐
│  Week 1 Meal Plan                        │
│  Mediterranean Diet - Feb 5-11           │
│                                          │
│  [📊 Sync to Progress Tracker]           │
│  └─ Mark all meals as consumed for:     │
│     ○ Today only                         │
│     ○ This week                          │
│     ○ Entire plan                        │
└──────────────────────────────────────────┘
```

---

## Additional Features & Enhancements

### 1. Gamification

- **Streaks**: Track consecutive days achieving 5x5x5 goal
- **Badges**: 
  - "Perfect Week" - 7 days of 100% completion
  - "Multi-System Master" - Log 50 foods that benefit 3+ systems
  - "Early Bird" - Log breakfast before 9 AM for 7 days
- **Leaderboard**: Compare with friends (optional, privacy-aware)

### 2. Notifications & Reminders

- Meal time reminders based on user's schedule
- "You're close!" notifications when at 4/5 meals
- "Recommended foods" push notifications for incomplete systems
- End-of-day summary

### 3. Export & Sharing

- Download monthly progress report (PDF)
- Share achievements to social media
- Export data for nutritionist review

### 4. Insights & Analytics

- **Trends**: "Your Microbiome support has improved 23% this month!"
- **Patterns**: "You tend to skip afternoon snacks on Mondays"
- **Recommendations**: "Based on your history, try adding more fish for Regeneration"

### 5. Integration with Wearables

- Sync meal times with Apple Health / Google Fit
- Activity data context (e.g., "You worked out today, consider adding more Regeneration foods")

---

## Implementation Timeline

### Week 1-2: Foundation
- ✅ Database schema design & review
- ✅ Create new Prisma models
- ✅ Migration scripts
- ✅ Food database seeding

### Week 3-4: Backend APIs
- ✅ New progress API endpoints
- ✅ Recipe consumption logic
- ✅ Meal plan sync logic
- ✅ Multi-system calculation utilities

### Week 5-6: Core UI Components
- ✅ MealTimeTracker component
- ✅ Enhanced DefenseSystemGrid
- ✅ FoodSelector with autocomplete
- ✅ RecipeConsumptionModal

### Week 7-8: Integration Features
- ✅ Recipe page "Mark as Consumed" button
- ✅ Meal plan sync interface
- ✅ Updated progress dashboard
- ✅ Migration from old system

### Week 9-10: Smart Features
- ✅ Food recommendations AI
- ✅ Auto-categorization for recipes
- ✅ Analytics & insights
- ✅ Notifications

### Week 11-12: Polish & Testing
- ✅ UI/UX refinements
- ✅ Performance optimization
- ✅ User testing & feedback
- ✅ Bug fixes
- ✅ Documentation

---

## Technical Considerations

### Performance

1. **Caching**: Cache food database, user's recent foods, system mappings
2. **Pagination**: For weekly/monthly views with lots of data
3. **Debouncing**: Food search autocomplete
4. **Lazy Loading**: Load meal plan sync data on demand

### Data Privacy

1. **User Control**: Allow users to mark progress as private
2. **Anonymized Leaderboards**: Don't expose actual food choices
3. **Export/Delete**: GDPR compliance - users can export or delete all data

### Accessibility

1. **Keyboard Navigation**: Full keyboard support for food selection
2. **Screen Readers**: ARIA labels for progress visualizations
3. **Color Blind Mode**: Use patterns in addition to colors for system indicators
4. **High Contrast**: Ensure readability in dark mode

---

## Open Questions & Decisions Needed

### 1. Multi-System Food Counting

**Question**: If a user logs "Blueberries" which supports both Angiogenesis AND Regeneration, should it count as:
- **Option A**: 1 food for Angiogenesis AND 1 food for Regeneration (counts toward both systems)
- **Option B**: 0.5 food for each (split the credit)
- **Option C**: Full credit to primary system, partial to secondary

**Recommendation**: Option A - full credit to all systems. This encourages choosing nutrient-dense multi-system foods.

### 2. Meal Time Flexibility

**Question**: Should we enforce the exact 5 meal times or allow custom times?
- **Option A**: Strict 5 times (Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner)
- **Option B**: Flexible - user defines their meal times
- **Option C**: Hybrid - suggest 5 but allow "Custom"

**Recommendation**: Option C - default to standard 5 but allow "Add Custom Meal Time"

### 3. Progress Source Priority

**Question**: If a user both logs foods manually AND syncs from meal plan for the same day, which takes precedence?
- **Option A**: Merge - combine manual + meal plan
- **Option B**: Override - meal plan replaces manual
- **Option C**: User chooses per-sync

**Recommendation**: Option A - merge all sources, show breakdown by source type

### 4. Food Database Scope

**Question**: How comprehensive should the initial food database be?
- **Option A**: Minimal - just the keyFoods from existing DEFENSE_SYSTEMS (~ 300 foods)
- **Option B**: Moderate - add common variations and preparations (~ 1000 foods)
- **Option C**: Comprehensive - partner with nutrition database (~ 10,000+ foods)

**Recommendation**: Start with Option A, expand to Option B based on user feedback

---

## Success Metrics

### User Engagement
- % of users who log progress ≥ 3 times/week
- Average 5x5x5 score across user base
- Recipe consumption rate (% of recipes marked as consumed)

### System Performance
- Progress calculation speed (< 200ms for daily summary)
- Food search latency (< 100ms)
- API response times

### Health Outcomes (Long-term)
- User retention rate
- Correlation between 5x5x5 scores and user-reported health improvements
- Most underutilized defense systems (areas for education)

---

## Conclusion

This redesign transforms the progress tracking system from a simple food logger into a comprehensive 5x5x5 health management platform. By integrating recipes, meal plans, multi-system food tracking, and meal frequency, users get a complete picture of their defense system optimization.

**Key Innovations:**
1. ✅ Multi-system food categorization - one food counts toward multiple systems
2. ✅ Meal frequency tracking - complete the "5 times per day" dimension
3. ✅ Recipe-based progress - seamlessly log from consumed recipes
4. ✅ Meal plan synchronization - connect planning with tracking
5. ✅ Intelligent recommendations - AI-powered food suggestions
6. ✅ Holistic 5x5x5 scoring - single metric for overall health progress

**Next Steps:**
1. Review and approve this plan
2. Finalize open questions/decisions
3. Begin Phase 1: Database schema implementation
4. Set up development timeline and milestones
