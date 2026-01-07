# Phase 2 API Documentation

## Overview
Complete API reference for the new 5x5x5 Progress Tracking System. All endpoints require authentication via NextAuth session.

---

## Endpoints

### 1. Log Food Consumption (Manual Entry)
**Endpoint**: `POST /api/progress/consumption`

**Purpose**: Manually log food consumption with automatic multi-system benefit tracking

**Request Body**:
```typescript
{
  date?: string;           // ISO date string (defaults to today)
  mealTime: MealTime;      // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, DINNER, CUSTOM
  notes?: string;          // Optional notes
  foodItems: Array<{
    name: string;          // Food name (will be matched to database)
    quantity?: number;     // Amount consumed
    unit?: string;         // Unit of measurement
  }>;
}
```

**Response**:
```typescript
{
  consumption: {
    id: string;
    date: Date;
    mealTime: MealTime;
    sourceType: "MANUAL";
    foodItems: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      defenseSystems: Array<{
        defenseSystem: DefenseSystem;
        strength: "HIGH" | "MEDIUM" | "LOW";
      }>;
    }>;
  };
  dailyProgress: {
    overallScore: number;    // 0-100
    systemScore: number;     // 0-5
    foodScore: number;       // 0-5
    frequencyScore: number;  // 0-5
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/progress/consumption \
  -H "Content-Type: application/json" \
  -d '{
    "mealTime": "BREAKFAST",
    "foodItems": [
      {"name": "Blueberries", "quantity": 1, "unit": "cup"},
      {"name": "Almonds", "quantity": 0.25, "unit": "cup"}
    ]
  }'
```

---

### 2. Mark Recipe as Consumed
**Endpoint**: `POST /api/progress/mark-recipe-consumed`

**Purpose**: Mark an entire recipe as consumed, automatically tracking all ingredients and their defense system benefits

**Request Body**:
```typescript
{
  recipeId: string;
  date?: string;              // ISO date string (defaults to today)
  mealTime: MealTime;
  servingsConsumed?: number;  // Defaults to recipe's serving size
  notes?: string;
}
```

**Response**:
```typescript
{
  message: string;
  consumption: {
    id: string;
    date: Date;
    mealTime: MealTime;
    sourceType: "RECIPE";
    recipeId: string;
    foodItems: FoodItem[];
  };
  impact: {
    totalFoods: number;
    systemsImpacted: DefenseSystem[];
    systemFoodCounts: Record<DefenseSystem, number>;
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/progress/mark-recipe-consumed \
  -H "Content-Type: application/json" \
  -d '{
    "recipeId": "abc123",
    "mealTime": "LUNCH",
    "servingsConsumed": 2
  }'
```

---

### 3. Get Daily Summary
**Endpoint**: `GET /api/progress/daily-summary`

**Purpose**: Get enhanced daily progress summary with 5x5x5 scoring breakdown

**Query Parameters**:
- `date` (optional): ISO date string (defaults to today)

**Response**:
```typescript
{
  date: Date;
  score: {
    overallScore: number;     // 0-100
    systemScore: number;      // 0-5 systems complete
    foodScore: number;        // 0-5 average foods per system
    frequencyScore: number;   // 0-5 meal times completed
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MASTER";
  };
  systems: Array<{
    system: DefenseSystem;
    foodsConsumed: number;
    target: 5;
    percentage: number;
    topFoods: Array<{
      name: string;
      count: number;
    }>;
  }>;
  mealTimes: {
    completed: MealTime[];
    missed: MealTime[];
    totalMeals: number;
    consumptions: Array<{
      id: string;
      mealTime: MealTime;
      time: Date;
      sourceType: ConsumptionSource;
      foodCount: number;
      recipe?: Recipe;
    }>;
  };
  stats: {
    totalFoods: number;
    totalConsumptions: number;
    systemsComplete: number;
    uniqueFoods: number;
  };
}
```

**Example**:
```bash
curl http://localhost:3000/api/progress/daily-summary?date=2026-01-07
```

---

### 4. Search Food Database
**Endpoint**: `GET /api/progress/food-database`

**Purpose**: Search the food database with filtering options

**Query Parameters**:
- `search` (optional): Text search in food name
- `category` (optional): Filter by category (Fruits, Vegetables, etc.)
- `defenseSystem` (optional): Filter by defense system
- `multiSystem` (optional): true/false - only foods with 3+ systems

**Response**:
```typescript
{
  foods: Array<{
    id: string;
    name: string;
    category: string;
    defenseSystems: DefenseSystem[];
    systemBenefits: Record<DefenseSystem, "HIGH" | "MEDIUM" | "LOW">;
    nutrients: string[];
    description?: string;
    isMultiSystem: boolean;  // 3+ systems
  }>;
  total: number;
}
```

**Example**:
```bash
# Search for berries
curl http://localhost:3000/api/progress/food-database?search=berry

# Get all multi-system superfoods
curl http://localhost:3000/api/progress/food-database?multiSystem=true

# Get foods for a specific system
curl http://localhost:3000/api/progress/food-database?defenseSystem=ANGIOGENESIS
```

---

### 5. Get Weekly Summary
**Endpoint**: `GET /api/progress/weekly-summary`

**Purpose**: Get weekly progress summary with trends and analytics

**Query Parameters**:
- `startDate` (optional): ISO date string (defaults to 7 days ago)
- `endDate` (optional): ISO date string (defaults to today)

**Response**:
```typescript
{
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  dailyScores: Array<{
    date: Date;
    score: number;
    overallScore: number;
    systemScore: number;
    foodScore: number;
    frequencyScore: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MASTER";
    totalMeals: number;
    totalFoods: number;
  }>;
  systemBreakdown: Array<{
    system: DefenseSystem;
    uniqueFoods: number;
    totalConsumptions: number;
    averagePerDay: number;
  }>;
  trends: {
    overall: "IMPROVING" | "STABLE" | "DECLINING";
    systems: "IMPROVING" | "STABLE" | "DECLINING";
    foods: "IMPROVING" | "STABLE" | "DECLINING";
    frequency: "IMPROVING" | "STABLE" | "DECLINING";
  };
  streak: number;  // Consecutive days achieving 80%+
  topFoods: Array<{
    name: string;
    count: number;
  }>;
  averages: {
    dailyScore: number;
    systemScore: number;
    foodScore: number;
    frequencyScore: number;
  };
}
```

**Example**:
```bash
curl http://localhost:3000/api/progress/weekly-summary
```

---

### 6. Sync Meal Plan to Progress
**Endpoint**: `POST /api/progress/sync-meal-plan`

**Purpose**: Automatically sync meal plan meals to progress tracking

**Request Body**:
```typescript
{
  mealPlanId: string;
  dateRange?: {
    startDate?: string;  // ISO date string
    endDate?: string;    // ISO date string
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  synced: number;
  totalFoodItems: number;
  results: Array<{
    mealId: string;
    mealName: string;
    date: Date;
    mealTime: MealTime;
    systemsCovered: number;
  }>;
  message: string;
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/progress/sync-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "mealPlanId": "xyz789",
    "dateRange": {
      "startDate": "2026-01-07",
      "endDate": "2026-01-13"
    }
  }'
```

---

### 7. Get Personalized Recommendations
**Endpoint**: `GET /api/progress/recommendations`

**Purpose**: Get personalized food recommendations based on gaps in current day's progress

**Query Parameters**:
- `date` (optional): ISO date string (defaults to today)

**Response**:
```typescript
{
  date: Date;
  currentProgress: {
    overall: number;
    systemsCovered: number;
    totalSystems: 5;
    mealTimesCovered: number;
    totalMealTimes: 5;
    foodsConsumed: number;
  };
  gaps: {
    systems: DefenseSystem[];      // Missing systems
    mealTimes: MealTime[];         // Missing meal times
  };
  recommendations: {
    bySystem: Array<{
      system: DefenseSystem;
      reason: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
      suggestedFoods: Array<{
        id: string;
        name: string;
        category: string;
        benefits: number;
        isMultiSystem: boolean;
      }>;
    }>;
    byMealTime: Array<{
      mealTime: MealTime;
      reason: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
      suggestion: string;
    }>;
    multiSystemFoods: Array<{
      id: string;
      name: string;
      category: string;
      systemsCovered: number;
      systems: Array<{
        system: DefenseSystem;
        strength: "HIGH" | "MEDIUM" | "LOW";
      }>;
    }>;
  };
  insights: {
    favoriteFoods: Array<{
      name: string;
      timesConsumed: number;
    }>;
    consistency: {
      daysTracked: number;
      totalDays: 7;
    };
  };
}
```

**Example**:
```bash
curl http://localhost:3000/api/progress/recommendations?date=2026-01-07
```

---

## TypeScript Types

All types are exported from `@/types/index.ts`:

```typescript
// Enums
export enum MealTime {
  BREAKFAST = "BREAKFAST",
  MORNING_SNACK = "MORNING_SNACK",
  LUNCH = "LUNCH",
  AFTERNOON_SNACK = "AFTERNOON_SNACK",
  DINNER = "DINNER",
  CUSTOM = "CUSTOM"
}

export enum ConsumptionSource {
  MANUAL = "MANUAL",
  RECIPE = "RECIPE",
  MEAL_PLAN = "MEAL_PLAN"
}

export enum DefenseSystem {
  ANGIOGENESIS = "ANGIOGENESIS",
  REGENERATION = "REGENERATION",
  MICROBIOME = "MICROBIOME",
  DNA_PROTECTION = "DNA_PROTECTION",
  IMMUNITY = "IMMUNITY"
}

export enum BenefitStrength {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}
```

---

## Error Handling

All endpoints return standard error responses:

```typescript
{
  error: string;  // Error message
}
```

**Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `404`: Not Found
- `500`: Internal Server Error

---

## Authentication

All endpoints require authentication. Include the session cookie or use NextAuth's `getSession()` on the client side:

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  
  if (!session) {
    return <LoginPrompt />;
  }
  
  // Make API calls...
}
```

---

## Best Practices

1. **Always specify mealTime** when logging consumption
2. **Use recipe consumption** when available for better accuracy
3. **Check recommendations** to fill gaps in defense systems
4. **Sync meal plans** weekly for automatic tracking
5. **Monitor weekly trends** to ensure consistent progress
6. **Target 80%+ daily score** for optimal health benefits

---

## Testing

```bash
# Test database connection
npm run test:apis

# Test TypeScript types
npm run test:types

# Start dev server
npm run dev

# View database
npm run db:studio
```

---

## Database Schema Reference

See [prisma/schema.prisma](../prisma/schema.prisma) for complete schema.

**Key Models**:
- `FoodConsumption` - Main consumption record
- `FoodItem` - Individual food entries
- `DefenseSystemBenefit` - Multi-system relationships
- `FoodDatabase` - Master food reference (37 foods)

**Key Relations**:
- User → FoodConsumption (one-to-many)
- FoodConsumption → FoodItem (one-to-many)
- FoodItem → DefenseSystemBenefit (one-to-many)
- FoodConsumption → Recipe (optional)
- FoodConsumption → Meal (optional)

---

**Last Updated**: January 7, 2026  
**Status**: ✅ All endpoints functional  
**TypeScript**: ✅ 0 compilation errors  
**Database**: ✅ 37 foods seeded  
