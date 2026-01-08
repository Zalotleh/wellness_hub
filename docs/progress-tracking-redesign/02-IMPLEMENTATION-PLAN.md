# Progress Tracking Redesign - Implementation Plan

**Project:** 5x5x5 Wellness Hub Progress & Tracking System Redesign  
**Date:** January 8, 2026  
**Status:** Planning Phase  
**Version:** 1.1  
**Last Updated:** January 8, 2026 (Incorporated answered questions)

---

## Overview

This document provides a detailed, phase-by-phase implementation plan for the Progress Tracking Redesign project. Each phase is designed to deliver incremental value while maintaining system stability.

**Key Decisions Incorporated:**
- Scoring weights: 50% systems, 30% meal times, 20% variety
- Notification strategy: Max 3/day, learned timing, all optional
- Premium tiers: Free (basic tracking), Premium ($9.99), Family ($19.99)
- GDPR compliance: Full data export, deletion, portability

---

## Implementation Strategy

### Approach

- **Iterative Development:** Each phase delivers working features
- **Backward Compatibility:** No breaking changes to existing functionality
- **Feature Flags:** New features can be toggled for testing
- **Database Migrations:** Carefully managed with rollback plans
- **Testing:** Comprehensive testing at each phase
- **Documentation:** Updated as features are implemented

### Timeline

- **Total Duration:** 5-6 weeks
- **Phase 1:** Week 1 (Foundation)
- **Phase 2:** Week 2 (Scoring System)
- **Phase 3:** Week 3 (Progress Dashboard)
- **Phase 4:** Week 4 (Smart Recommendations)
- **Phase 5:** Week 5 (Polish & Integration)
- **Buffer:** Week 6 (Testing, refinement, deployment)

---

## Phase 1: Foundation (Week 1)

### Objectives
- Establish database schema for new features
- Create user preferences system
- Implement country selection
- Build preference APIs

### 1.1 Database Schema Updates

**Priority:** Critical  
**Estimated Time:** 2 days

#### Tasks

1. **Create Migration File**
   ```bash
   npx prisma migrate dev --name add_user_preferences_and_scoring
   ```

2. **Add User Preferences Fields**
   ```prisma
   model User {
     // Existing fields...
     
     // Default preferences for generators
     defaultDietaryRestrictions String[]  @default([])
     defaultFocusSystems        String[]  @default([])
     defaultServings            Int       @default(2)
     
     // Location for ingredient adaptation
     country                    String?   // ISO country code
     timezone                   String    @default("America/New_York")
     
     // Notification settings
     notificationPreferences    Json?
     
     // New relations
     dailyScores                DailyProgressScore[]
     workflowState              UserWorkflowState?
   }
   ```

3. **Create DailyProgressScore Model**
   ```prisma
   model DailyProgressScore {
     id                   String   @id @default(cuid())
     userId               String
     date                 DateTime @db.Date
     
     // Overall 5x5x5 Score
     overallScore         Float    @default(0) // 0-100
     
     // System-specific metrics
     systemScores         Json     // { ANGIOGENESIS: 60, ... }
     foodsPerSystem       Json     // { ANGIOGENESIS: 3, ... }
     
     // Meal time coverage
     mealTimesCovered     Int      @default(0) // 0-5
     mealTimesCompleted   Json     // { BREAKFAST: true, ... }
     
     // Food variety
     uniqueFoodsTotal     Int      @default(0)
     
     // Metadata
     calculatedAt         DateTime @default(now())
     
     user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@unique([userId, date])
     @@index([userId, date])
   }
   ```

4. **Create UserWorkflowState Model**
   ```prisma
   model UserWorkflowState {
     id                      String    @id @default(cuid())
     userId                  String    @unique
     
     // Workflow tracking
     lastProgressCheck       DateTime  @default(now())
     lastRecommendationDate  DateTime?
     
     // Pending actions
     recommendedAction       String?
     recommendedSystems      String[]  @default([])
     
     // Action completion timestamps
     lastRecipeCreated       DateTime?
     lastPlanCreated         DateTime?
     lastShoppingList        DateTime?
     lastFoodLogged          DateTime?
     
     // Notification preferences
     notificationsEnabled    Boolean   @default(true)
     notificationTimes       Json?
     
     user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@index([userId])
   }
   ```

5. **Run Migration**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Test Migration**
   - Verify schema in database
   - Test rollback if needed
   - Check existing data integrity

#### Deliverables
- ✅ Database migration completed
- ✅ Schema updated in Prisma
- ✅ All existing features working

---

### 1.2 User Preferences API

**Priority:** Critical  
**Estimated Time:** 1.5 days

#### Create API Endpoints

1. **GET /api/user/preferences**
   ```typescript
   // File: /app/api/user/preferences/route.ts
   
   export async function GET(request: NextRequest) {
     const session = await getServerSession(authOptions);
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const user = await prisma.user.findUnique({
       where: { id: session.user.id },
       select: {
         defaultDietaryRestrictions: true,
         defaultFocusSystems: true,
         defaultServings: true,
         country: true,
         timezone: true,
         notificationPreferences: true,
       },
     });
     
     return NextResponse.json({ preferences: user });
   }
   ```

2. **PUT /api/user/preferences**
   ```typescript
   export async function PUT(request: NextRequest) {
     const session = await getServerSession(authOptions);
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const body = await request.json();
     const {
       defaultDietaryRestrictions,
       defaultFocusSystems,
       defaultServings,
       country,
       timezone,
       notificationPreferences,
     } = body;
     
     const updatedUser = await prisma.user.update({
       where: { id: session.user.id },
       data: {
         defaultDietaryRestrictions: defaultDietaryRestrictions || undefined,
         defaultFocusSystems: defaultFocusSystems || undefined,
         defaultServings: defaultServings || undefined,
         country: country || undefined,
         timezone: timezone || undefined,
         notificationPreferences: notificationPreferences || undefined,
       },
     });
     
     return NextResponse.json({ success: true, preferences: updatedUser });
   }
   ```

3. **Testing**
   - Unit tests for API endpoints
   - Integration tests with database
   - Error handling validation

#### Deliverables
- ✅ Preferences API endpoints created
- ✅ API tests passing
- ✅ Documentation updated

---

### 1.3 Country Selection Feature

**Priority:** High  
**Estimated Time:** 1 day

#### Tasks

1. **Create Country Selector Component**
   ```tsx
   // File: /components/settings/CountrySelector.tsx
   
   import { useState } from 'react';
   import { Globe } from 'lucide-react';
   
   const COUNTRIES = [
     { code: 'US', name: 'United States', flag: '🇺🇸' },
     { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
     { code: 'CA', name: 'Canada', flag: '🇨🇦' },
     { code: 'AU', name: 'Australia', flag: '🇦🇺' },
     { code: 'FR', name: 'France', flag: '🇫🇷' },
     { code: 'DE', name: 'Germany', flag: '🇩🇪' },
     { code: 'IT', name: 'Italy', flag: '🇮🇹' },
     { code: 'ES', name: 'Spain', flag: '🇪🇸' },
     { code: 'JP', name: 'Japan', flag: '🇯🇵' },
     { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
     // Add more countries...
   ];
   
   export default function CountrySelector({ 
     value, 
     onChange 
   }: { 
     value?: string; 
     onChange: (code: string) => void; 
   }) {
     return (
       <div>
         <label className="block text-sm font-medium mb-2">
           <Globe className="w-4 h-4 inline mr-2" />
           Country/Region
         </label>
         <select
           value={value || ''}
           onChange={(e) => onChange(e.target.value)}
           className="w-full px-4 py-2 border rounded-lg"
         >
           <option value="">Select your country...</option>
           {COUNTRIES.map((country) => (
             <option key={country.code} value={country.code}>
               {country.flag} {country.name}
             </option>
           ))}
         </select>
         <p className="text-xs text-gray-500 mt-1">
           Helps us suggest locally available ingredients
         </p>
       </div>
     );
   }
   ```

2. **Add to Settings Page**
   - Integrate CountrySelector into `/app/(dashboard)/settings/page.tsx`
   - Add to onboarding flow for new users

3. **Update AI Prompts**
   - Modify recipe generator to include country context
   - Modify meal planner to prioritize local ingredients

#### Deliverables
- ✅ Country selector component created
- ✅ Integrated into settings
- ✅ AI prompts updated

---

### 1.4 Preferences Manager Component

**Priority:** High  
**Estimated Time:** 1.5 days

#### Create Unified Preferences Interface

1. **PreferenceManager Component**
   ```tsx
   // File: /components/preferences/PreferenceManager.tsx
   
   export default function PreferenceManager() {
     const [preferences, setPreferences] = useState({
       dietaryRestrictions: [],
       focusSystems: [],
       servings: 2,
       country: null,
       timezone: 'America/New_York',
     });
     
     const [isSaving, setIsSaving] = useState(false);
     
     // Load preferences on mount
     useEffect(() => {
       loadPreferences();
     }, []);
     
     const loadPreferences = async () => {
       const res = await fetch('/api/user/preferences');
       const data = await res.json();
       setPreferences(data.preferences);
     };
     
     const savePreferences = async () => {
       setIsSaving(true);
       await fetch('/api/user/preferences', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(preferences),
       });
       setIsSaving(false);
     };
     
     return (
       <div className="space-y-6">
         {/* Dietary Restrictions */}
         <DietaryRestrictionsSelector
           value={preferences.dietaryRestrictions}
           onChange={(value) => setPreferences({ ...preferences, dietaryRestrictions: value })}
         />
         
         {/* Default Focus Systems */}
         <DefenseSystemSelector
           value={preferences.focusSystems}
           onChange={(value) => setPreferences({ ...preferences, focusSystems: value })}
         />
         
         {/* Default Servings */}
         <ServingsSelector
           value={preferences.servings}
           onChange={(value) => setPreferences({ ...preferences, servings: value })}
         />
         
         {/* Country */}
         <CountrySelector
           value={preferences.country}
           onChange={(value) => setPreferences({ ...preferences, country: value })}
         />
         
         <button
           onClick={savePreferences}
           disabled={isSaving}
           className="px-6 py-3 bg-green-600 text-white rounded-lg"
         >
           {isSaving ? 'Saving...' : 'Save Preferences'}
         </button>
       </div>
     );
   }
   ```

2. **Integration Points**
   - Settings page
   - Profile page
   - Onboarding flow
   - First-time user modal

#### Deliverables
- ✅ Preference manager component
- ✅ Integrated into settings
- ✅ User can save and load preferences

---

### Phase 1 Testing & Validation

**Checklist:**
- [ ] Database migrations successful
- [ ] Existing features unaffected
- [ ] API endpoints functional
- [ ] User preferences saved correctly
- [ ] Country selection working
- [ ] No performance degradation

**Phase 1 Complete When:**
- All tasks completed
- All tests passing
- Documentation updated
- Code reviewed and merged

---

## Phase 2: Scoring System (Week 2)

### Objectives
- Build 5x5x5 scoring algorithm
- Create score calculation APIs
- Implement caching strategy
- Generate historical scores

### 2.1 5x5x5 Scoring Algorithm

**Priority:** Critical  
**Estimated Time:** 3 days

#### Create Core Scoring Library

1. **File Structure**
   ```
   lib/tracking/
   ├── 5x5x5-score.ts          # Main scoring logic
   ├── score-calculator.ts     # Calculation utilities
   ├── score-cache.ts          # Caching layer
   └── types.ts                # Type definitions
   ```

2. **Score Calculation Logic**
   ```typescript
   // File: /lib/tracking/5x5x5-score.ts
   
   import { DefenseSystem } from '@/types';
   
   export interface Score5x5x5 {
     overallScore: number; // 0-100
     defenseSystems: SystemScore[];
     mealTimes: MealTimeScore[];
     foodVariety: FoodVarietyScore;
     insights: ScoreInsights;
   }
   
   interface SystemScore {
     system: DefenseSystem;
     foodsConsumed: number; // 0-5
     uniqueFoods: string[];
     coveragePercent: number; // 0-100
     score: number; // 0-100
   }
   
   interface MealTimeScore {
     mealTime: 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';
     hasFood: boolean;
     foodCount: number;
     systemsCovered: DefenseSystem[];
   }
   
   interface FoodVarietyScore {
     totalUniqueFoods: number;
     varietyScore: number; // 0-100
     repeatedFoods: string[];
   }
   
   interface ScoreInsights {
     strongestSystem: DefenseSystem;
     weakestSystem: DefenseSystem;
     missedMealTimes: string[];
     systemBalance: number; // 0-100 (how evenly distributed)
     recommendation: string;
   }
   
   /**
    * Calculate comprehensive 5x5x5 score for a given date
    */
   export async function calculate5x5x5Score(
     userId: string,
     date: Date
   ): Promise<Score5x5x5> {
     // 1. Fetch all food consumptions for the date
     const foodConsumptions = await prisma.foodConsumption.findMany({
       where: {
         userId,
         consumedAt: {
           gte: startOfDay(date),
           lte: endOfDay(date),
         },
       },
       include: {
         foodItem: {
           include: {
             defenseSystems: true,
           },
         },
       },
     });
     
     // 2. Calculate defense system scores
     const systemScores = calculateSystemScores(foodConsumptions);
     
     // 3. Calculate meal time coverage
     const mealTimeScores = calculateMealTimeScores(foodConsumptions);
     
     // 4. Calculate food variety
     const foodVariety = calculateFoodVariety(foodConsumptions);
     
     // 5. Calculate overall score (weighted)
     const overallScore = calculateOverallScore(
       systemScores,
       mealTimeScores,
       foodVariety
     );
     
     // 6. Generate insights
     const insights = generateInsights(systemScores, mealTimeScores, foodVariety);
     
     return {
       overallScore,
       defenseSystems: systemScores,
       mealTimes: mealTimeScores,
       foodVariety,
       insights,
     };
   }
   
   /**
    * Calculate scores for each defense system
    */
   function calculateSystemScores(foodConsumptions: any[]): SystemScore[] {
     const systemMap = new Map<DefenseSystem, Set<string>>();
     
     // Group foods by defense system
     foodConsumptions.forEach((consumption) => {
       consumption.foodItem.defenseSystems.forEach((ds: any) => {
         const system = ds.system as DefenseSystem;
         if (!systemMap.has(system)) {
           systemMap.set(system, new Set());
         }
         systemMap.get(system)!.add(consumption.foodItem.name);
       });
     });
     
     // Calculate scores for each system
     const allSystems = Object.values(DefenseSystem);
     return allSystems.map((system) => {
       const uniqueFoods = Array.from(systemMap.get(system) || new Set());
       const foodsConsumed = uniqueFoods.length;
       const coveragePercent = Math.min((foodsConsumed / 5) * 100, 100);
       
       // Score calculation:
       // - 5 foods = 100 points
       // - 4 foods = 85 points
       // - 3 foods = 70 points
       // - 2 foods = 50 points
       // - 1 food = 30 points
       // - 0 foods = 0 points
       const score = foodsConsumed >= 5 ? 100 :
                     foodsConsumed === 4 ? 85 :
                     foodsConsumed === 3 ? 70 :
                     foodsConsumed === 2 ? 50 :
                     foodsConsumed === 1 ? 30 : 0;
       
       return {
         system,
         foodsConsumed,
         uniqueFoods,
         coveragePercent,
         score,
       };
     });
   }
   
   /**
    * Calculate meal time coverage scores
    */
   function calculateMealTimeScores(foodConsumptions: any[]): MealTimeScore[] {
     const mealTimeMap = new Map<string, any[]>();
     
     // Group by meal time
     foodConsumptions.forEach((consumption) => {
       const mealTime = consumption.mealTime;
       if (!mealTimeMap.has(mealTime)) {
         mealTimeMap.set(mealTime, []);
       }
       mealTimeMap.get(mealTime)!.push(consumption);
     });
     
     const allMealTimes = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];
     
     return allMealTimes.map((mealTime) => {
       const consumptions = mealTimeMap.get(mealTime) || [];
       const hasFood = consumptions.length > 0;
       const foodCount = consumptions.length;
       
       // Get unique defense systems covered in this meal time
       const systemsSet = new Set<DefenseSystem>();
       consumptions.forEach((c) => {
         c.foodItem.defenseSystems.forEach((ds: any) => {
           systemsSet.add(ds.system);
         });
       });
       
       return {
         mealTime: mealTime as any,
         hasFood,
         foodCount,
         systemsCovered: Array.from(systemsSet),
       };
     });
   }
   
   /**
    * Calculate food variety score
    */
   function calculateFoodVariety(foodConsumptions: any[]): FoodVarietyScore {
     const foodCounts = new Map<string, number>();
     
     // Count each food
     foodConsumptions.forEach((consumption) => {
       const foodName = consumption.foodItem.name;
       foodCounts.set(foodName, (foodCounts.get(foodName) || 0) + 1);
     });
     
     const totalUniqueFoods = foodCounts.size;
     const repeatedFoods = Array.from(foodCounts.entries())
       .filter(([_, count]) => count > 1)
       .map(([food, _]) => food);
     
     // Variety score: rewards diverse food choices
     // 25+ unique foods = 100 points
     // Linear scale below that
     const varietyScore = Math.min((totalUniqueFoods / 25) * 100, 100);
     
     return {
       totalUniqueFoods,
       varietyScore,
       repeatedFoods,
     };
   }
   
   /**
    * Calculate overall 5x5x5 score (weighted)
    */
   function calculateOverallScore(
     systemScores: SystemScore[],
     mealTimeScores: MealTimeScore[],
     foodVariety: FoodVarietyScore
   ): number {
     // Weight distribution:
     // - Defense Systems: 50%
     // - Meal Time Coverage: 30%
     // - Food Variety: 20%
     
     // System score (average of all 5 systems)
     const avgSystemScore = systemScores.reduce((sum, s) => sum + s.score, 0) / systemScores.length;
     
     // Meal time score (percentage of 5 meal times covered)
     const mealTimesCovered = mealTimeScores.filter(m => m.hasFood).length;
     const mealTimeScore = (mealTimesCovered / 5) * 100;
     
     // Weighted overall score
     const overallScore = (
       avgSystemScore * 0.5 +
       mealTimeScore * 0.3 +
       foodVariety.varietyScore * 0.2
     );
     
     return Math.round(overallScore);
   }
   
   /**
    * Generate actionable insights
    */
   function generateInsights(
     systemScores: SystemScore[],
     mealTimeScores: MealTimeScore[],
     foodVariety: FoodVarietyScore
   ): ScoreInsights {
     // Find strongest and weakest systems
     const sortedSystems = [...systemScores].sort((a, b) => b.score - a.score);
     const strongestSystem = sortedSystems[0].system;
     const weakestSystem = sortedSystems[sortedSystems.length - 1].system;
     
     // Find missed meal times
     const missedMealTimes = mealTimeScores
       .filter(m => !m.hasFood)
       .map(m => m.mealTime);
     
     // Calculate system balance (how evenly distributed)
     const scores = systemScores.map(s => s.score);
     const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
     const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
     const systemBalance = Math.max(0, 100 - Math.sqrt(variance));
     
     // Generate recommendation
     let recommendation = '';
     if (systemScores.every(s => s.score >= 85)) {
       recommendation = "Excellent! You're hitting all defense systems with good variety.";
     } else if (weakestSystem) {
       recommendation = `Focus on ${weakestSystem} foods to improve balance.`;
     } else if (missedMealTimes.length > 0) {
       recommendation = `Try adding foods during ${missedMealTimes[0].toLowerCase().replace('_', ' ')}.`;
     } else {
       recommendation = "Keep up the good work! Aim for more variety.";
     }
     
     return {
       strongestSystem,
       weakestSystem,
       missedMealTimes,
       systemBalance: Math.round(systemBalance),
       recommendation,
     };
   }
   ```

#### Deliverables
- ✅ Scoring algorithm implemented
- ✅ Unit tests for all calculation functions
- ✅ Documentation of scoring methodology

---

### 2.2 Score Calculation API

**Priority:** Critical  
**Estimated Time:** 1.5 days

#### Create API Endpoints

1. **GET /api/progress/score**
   ```typescript
   // File: /app/api/progress/score/route.ts
   
   import { calculate5x5x5Score } from '@/lib/tracking/5x5x5-score';
   
   export async function GET(request: NextRequest) {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const { searchParams } = new URL(request.url);
     const dateStr = searchParams.get('date');
     const view = searchParams.get('view') || 'daily';
     
     const date = dateStr ? new Date(dateStr) : new Date();
     
     if (view === 'daily') {
       // Calculate score for single day
       const score = await calculate5x5x5Score(session.user.id, date);
       
       // Cache the result
       await cacheDailyScore(session.user.id, date, score);
       
       return NextResponse.json({ score });
     } else if (view === 'weekly') {
       // Calculate scores for past 7 days
       const scores = await calculateWeeklyScores(session.user.id, date);
       return NextResponse.json({ scores });
     } else if (view === 'monthly') {
       // Calculate scores for past 30 days
       const scores = await calculateMonthlyScores(session.user.id, date);
       return NextResponse.json({ scores });
     }
   }
   ```

2. **Background Score Calculation**
   ```typescript
   // File: /lib/tracking/score-calculator.ts
   
   /**
    * Recalculate score after food logging
    * Called by food logging API
    */
   export async function recalculateScoreAfterFoodLog(
     userId: string,
     date: Date
   ) {
     const score = await calculate5x5x5Score(userId, date);
     await cacheDailyScore(userId, date, score);
     return score;
   }
   ```

#### Deliverables
- ✅ Score API endpoints created
- ✅ Integration with food logging
- ✅ API tests passing

---

### 2.3 Score Caching & Storage

**Priority:** High  
**Estimated Time:** 1.5 days

#### Implement Caching Strategy

1. **Cache Daily Scores**
   ```typescript
   // File: /lib/tracking/score-cache.ts
   
   /**
    * Save calculated score to database for caching
    */
   export async function cacheDailyScore(
     userId: string,
     date: Date,
     score: Score5x5x5
   ) {
     await prisma.dailyProgressScore.upsert({
       where: {
         userId_date: {
           userId,
           date: startOfDay(date),
         },
       },
       create: {
         userId,
         date: startOfDay(date),
         overallScore: score.overallScore,
         systemScores: score.defenseSystems,
         foodsPerSystem: score.defenseSystems.reduce((acc, s) => {
           acc[s.system] = s.foodsConsumed;
           return acc;
         }, {} as any),
         mealTimesCovered: score.mealTimes.filter(m => m.hasFood).length,
         mealTimesCompleted: score.mealTimes.reduce((acc, m) => {
           acc[m.mealTime] = m.hasFood;
           return acc;
         }, {} as any),
         uniqueFoodsTotal: score.foodVariety.totalUniqueFoods,
       },
       update: {
         overallScore: score.overallScore,
         systemScores: score.defenseSystems,
         foodsPerSystem: score.defenseSystems.reduce((acc, s) => {
           acc[s.system] = s.foodsConsumed;
           return acc;
         }, {} as any),
         mealTimesCovered: score.mealTimes.filter(m => m.hasFood).length,
         mealTimesCompleted: score.mealTimes.reduce((acc, m) => {
           acc[m.mealTime] = m.hasFood;
           return acc;
         }, {} as any),
         uniqueFoodsTotal: score.foodVariety.totalUniqueFoods,
         calculatedAt: new Date(),
       },
     });
   }
   
   /**
    * Get cached score or calculate if not cached
    */
   export async function getCachedOrCalculateScore(
     userId: string,
     date: Date
   ): Promise<Score5x5x5> {
     // Try to get cached score
     const cached = await prisma.dailyProgressScore.findUnique({
       where: {
         userId_date: {
           userId,
           date: startOfDay(date),
         },
       },
     });
     
     // If cached and recent (calculated within last hour), use it
     if (cached && differenceInMinutes(new Date(), cached.calculatedAt) < 60) {
       return {
         overallScore: cached.overallScore,
         defenseSystems: cached.systemScores as any,
         mealTimes: [], // Reconstruct from cached data
         foodVariety: {
           totalUniqueFoods: cached.uniqueFoodsTotal,
           varietyScore: 0, // Calculate from cached data
           repeatedFoods: [],
         },
         insights: {} as any,
       };
     }
     
     // Otherwise, calculate fresh
     const score = await calculate5x5x5Score(userId, date);
     await cacheDailyScore(userId, date, score);
     return score;
   }
   ```

#### Deliverables
- ✅ Caching system implemented
- ✅ Performance optimized
- ✅ Stale cache handling

---

### 2.4 Historical Score Generation

**Priority:** Medium  
**Estimated Time:** 1 day

#### Generate Scores for Existing Data

1. **Migration Script**
   ```typescript
   // File: /scripts/generate-historical-scores.ts
   
   /**
    * Generate scores for all existing progress data
    */
   async function generateHistoricalScores() {
     const users = await prisma.user.findMany({
       select: { id: true },
     });
     
     for (const user of users) {
       // Find all unique dates with food consumption
       const dates = await prisma.foodConsumption.findMany({
         where: { userId: user.id },
         select: { consumedAt: true },
         distinct: ['consumedAt'],
       });
       
       for (const { consumedAt } of dates) {
         const date = startOfDay(consumedAt);
         console.log(`Calculating score for ${user.id} on ${date}`);
         
         const score = await calculate5x5x5Score(user.id, date);
         await cacheDailyScore(user.id, date, score);
       }
     }
     
     console.log('Historical scores generated!');
   }
   ```

2. **Run Migration**
   ```bash
   npx ts-node scripts/generate-historical-scores.ts
   ```

#### Deliverables
- ✅ Historical scores generated
- ✅ All users have score data

---

### Phase 2 Testing & Validation

**Checklist:**
- [ ] Scoring algorithm accurate
- [ ] API endpoints functional
- [ ] Caching working correctly
- [ ] Performance acceptable (<500ms for score calculation)
- [ ] Historical data processed

**Phase 2 Complete When:**
- All tasks completed
- Score calculations validated against manual calculations
- Performance benchmarks met
- Documentation complete

---

## Phase 3: Progress Dashboard (Week 3)

### Objectives
- Redesign Progress page as main dashboard
- Create new visualization components
- Implement time-based filtering
- Add overall score display

### 3.1 Overall Score Card Component

**Priority:** Critical  
**Estimated Time:** 1.5 days

#### Create Component

```tsx
// File: /components/progress/OverallScoreCard.tsx

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface OverallScoreCardProps {
  date: Date;
  onRefresh?: () => void;
}

export default function OverallScoreCard({ date, onRefresh }: OverallScoreCardProps) {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  
  useEffect(() => {
    fetchScore();
  }, [date]);
  
  const fetchScore = async () => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const res = await fetch(`/api/progress/score?date=${dateStr}&view=daily`);
    const data = await res.json();
    setScore(data.score);
    setLoading(false);
  };
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 60) return 'Good Progress';
    if (score >= 40) return 'Keep Going';
    return 'Let\'s Improve';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your 5x5x5 Score</h2>
          <p className="text-sm text-gray-500">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Info Panel */}
      {showInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Why This Matters</h3>
          <p className="text-gray-700 mb-2">
            Your 5x5x5 score reflects how well you're following Dr. William Li's framework:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li><strong>5 Defense Systems:</strong> Coverage of all health defense mechanisms</li>
            <li><strong>5 Foods per System:</strong> Variety within each defense system</li>
            <li><strong>5 Meal Times:</strong> Spreading nutrition throughout the day</li>
          </ul>
          <p className="mt-2 text-gray-700">
            Aim for 80+ for optimal health benefits!
          </p>
        </div>
      )}
      
      {/* Score Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-48 h-48">
          <CircularProgressbar
            value={score.overallScore}
            text={`${score.overallScore}`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: getScoreColor(score.overallScore),
              textColor: getScoreColor(score.overallScore),
              trailColor: '#e5e7eb',
            })}
          />
        </div>
      </div>
      
      {/* Score Label */}
      <div className="text-center mb-6">
        <p className="text-2xl font-bold" style={{ color: getScoreColor(score.overallScore) }}>
          {getScoreLabel(score.overallScore)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {score.insights.recommendation}
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {score.defenseSystems.filter((s: any) => s.foodsConsumed > 0).length}/5
          </p>
          <p className="text-xs text-gray-500">Systems Covered</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {score.mealTimes.filter((m: any) => m.hasFood).length}/5
          </p>
          <p className="text-xs text-gray-500">Meals Logged</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {score.foodVariety.totalUniqueFoods}
          </p>
          <p className="text-xs text-gray-500">Unique Foods</p>
        </div>
      </div>
    </div>
  );
}
```

#### Install Dependencies

```bash
npm install react-circular-progressbar
```

#### Deliverables
- ✅ Overall score card component created
- ✅ Integration with score API
- ✅ Responsive design
- ✅ Info modal explaining 5x5x5

---

### 3.2 Defense Systems Radar Chart

**Priority:** High  
**Estimated Time:** 2 days

#### Create Component

```tsx
// File: /components/progress/DefenseSystemsRadar.tsx

'use client';

import { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface DefenseSystemsRadarProps {
  date: Date;
  onClick?: (system: DefenseSystem) => void;
}

export default function DefenseSystemsRadar({ date, onClick }: DefenseSystemsRadarProps) {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<DefenseSystem | null>(null);
  
  useEffect(() => {
    fetchScore();
  }, [date]);
  
  const fetchScore = async () => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const res = await fetch(`/api/progress/score?date=${dateStr}&view=daily`);
    const data = await res.json();
    setScore(data.score);
    setLoading(false);
  };
  
  if (loading || !score) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />;
  }
  
  const chartData = {
    labels: score.defenseSystems.map((s: any) => 
      DEFENSE_SYSTEMS[s.system as DefenseSystem].displayName
    ),
    datasets: [
      {
        label: 'Your Coverage',
        data: score.defenseSystems.map((s: any) => s.score),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
      },
      {
        label: 'Target (5 foods)',
        data: [100, 100, 100, 100, 100],
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };
  
  const chartOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const systemIndex = context.dataIndex;
            const systemData = score.defenseSystems[systemIndex];
            return [
              `${context.dataset.label}: ${context.parsed.r}`,
              `Foods: ${systemData.foodsConsumed}/5`,
              `Variety: ${systemData.uniqueFoods.join(', ')}`,
            ];
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const system = score.defenseSystems[index].system;
        setSelectedSystem(system);
        onClick?.(system);
      },
    },
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Defense System Coverage</h3>
      
      <div className="mb-4">
        <Radar data={chartData} options={chartOptions} />
      </div>
      
      {/* System Details */}
      {selectedSystem && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold mb-2">
            {DEFENSE_SYSTEMS[selectedSystem].displayName}
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            {DEFENSE_SYSTEMS[selectedSystem].description}
          </p>
          
          {/* Foods consumed */}
          <div>
            <p className="text-sm font-medium mb-1">Foods Today:</p>
            <div className="flex flex-wrap gap-2">
              {score.defenseSystems
                .find((s: any) => s.system === selectedSystem)
                ?.uniqueFoods.map((food: string) => (
                  <span
                    key={food}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                  >
                    {food}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Install Dependencies

```bash
npm install react-chartjs-2 chart.js
```

#### Deliverables
- ✅ Radar chart component created
- ✅ Interactive system selection
- ✅ Food details display
- ✅ Responsive design

---

*[To be expanded with 3.3 Time Filter Implementation, 3.4 Dashboard Page Redesign, Phase 4 details, etc.]*

---

## Phase 4: Smart Recommendations (Week 4)

*Phase 4 implementation details to be added - see status tracker for task breakdown*

**Key Implementation Notes:**
- Recommendation frequency: 1-3 per day based on user behavior
- Persistence: 24 hours or until gap filled
- Adapt after 3 consecutive ignores (try different system/approach)
- Track acceptance rate in recommendation history API

---

## Phase 5: Polish & Integration (Week 5)

### 5.3 Notification System ⚠️

**Priority:** High  
**Estimated Time:** 3 days (increased from 2 days)

#### Based on Approved Notification Strategy

**Key Requirements:**
- All notifications OPTIONAL and user-controllable
- Max 3 notifications per day
- 2-hour minimum gap between notifications
- Smart timing based on learned user behavior
- Do Not Disturb mode (10 PM - 7 AM default)

#### Tasks

1. **Create Notification Preference Schema**
   ```typescript
   // Notification preferences stored in User.notificationPreferences JSON field
   interface NotificationPreferences {
     enabled: boolean; // Master toggle
     workflow: {
       recipeToShoppingList: boolean;
       shoppingListReminder: boolean;
       mealLoggingReminder: boolean;
     };
     progress: {
       dailySummary: boolean;
       dailySummaryTime: string; // "20:00"
       streakReminders: boolean;
       weeklyPlanning: boolean;
       weeklyPlanningDay: string; // "SUNDAY"
       weeklyPlanningTime: string; // "19:00"
     };
     mealReminders: {
       enabled: boolean;
       breakfast: boolean;
       lunch: boolean;
       dinner: boolean;
       // Times learned from user behavior
     };
     achievements: {
       enabled: boolean; // Always on by default
     };
     doNotDisturb: {
       enabled: boolean;
       startTime: string; // "22:00"
       endTime: string; // "07:00"
     };
     maxPerDay: number; // 3 (hardcoded limit)
     minGapMinutes: number; // 120 (2 hours)
   }
   ```

2. **Create Notification Service**
   ```typescript
   // File: /lib/notifications/notification-service.ts
   
   export class NotificationService {
     /**
      * Check if notification can be sent based on preferences and limits
      */
     async canSendNotification(
       userId: string,
       type: NotificationType
     ): Promise<boolean> {
       const user = await getUserWithPreferences(userId);
       const prefs = user.notificationPreferences as NotificationPreferences;
       
       // Check master toggle
       if (!prefs.enabled) return false;
       
       // Check specific notification type
       if (!this.isTypeEnabled(type, prefs)) return false;
       
       // Check DND
       if (this.isInDoNotDisturb(prefs)) return false;
       
       // Check daily limit (3 max)
       const todayCount = await this.getNotificationCountToday(userId);
       if (todayCount >= prefs.maxPerDay) return false;
       
       // Check minimum gap (2 hours)
       const lastNotification = await this.getLastNotificationTime(userId);
       if (lastNotification) {
         const minutesSince = differenceInMinutes(new Date(), lastNotification);
         if (minutesSince < prefs.minGapMinutes) return false;
       }
       
       return true;
     }
     
     /**
      * Learn optimal notification times from user behavior
      */
     async learnOptimalTimes(userId: string): Promise<NotificationTimes> {
       const foodLogs = await getFoodLogHistory(userId, 30); // Last 30 days
       
       // Analyze typical meal times
       const breakfastTimes = foodLogs
         .filter(log => log.mealTime === 'BREAKFAST')
         .map(log => format(log.consumedAt, 'HH:mm'));
       
       const lunchTimes = foodLogs
         .filter(log => log.mealTime === 'LUNCH')
         .map(log => format(log.consumedAt, 'HH:mm'));
       
       const dinnerTimes = foodLogs
         .filter(log => log.mealTime === 'DINNER')
         .map(log => format(log.consumedAt, 'HH:mm'));
       
       // Calculate mode (most common time)
       const optimalBreakfast = findMostCommon(breakfastTimes);
       const optimalLunch = findMostCommon(lunchTimes);
       const optimalDinner = findMostCommon(dinnerTimes);
       
       // Set reminder 15 minutes before typical time
       return {
         breakfast: subtractMinutes(optimalBreakfast, 15),
         lunch: subtractMinutes(optimalLunch, 30),
         dinner: subtractMinutes(optimalDinner, 30),
       };
     }
     
     /**
      * Send notification with adaptive frequency
      */
     async sendNotification(
       userId: string,
       type: NotificationType,
       data: NotificationData
     ) {
       if (!await this.canSendNotification(userId, type)) {
         console.log(`Notification skipped for user ${userId}: limits/preferences`);
         return;
       }
       
       // Log notification
       await this.logNotification(userId, type);
       
       // Send via appropriate channel (email only for now)
       await this.sendEmail(userId, type, data);
     }
   }
   ```

3. **Create Notification Settings UI**
   ```tsx
   // File: /components/settings/NotificationSettings.tsx
   
   export default function NotificationSettings() {
     const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPrefs);
     
     return (
       <div className="space-y-6">
         {/* Master Toggle */}
         <div className="flex items-center justify-between">
           <div>
             <h3 className="font-semibold">Enable Notifications</h3>
             <p className="text-sm text-gray-600">Master control for all notifications</p>
           </div>
           <Toggle
             checked={preferences.enabled}
             onChange={(enabled) => setPreferences({ ...preferences, enabled })}
           />
         </div>
         
         {/* Workflow Notifications */}
         <div className="border-t pt-4">
           <h4 className="font-medium mb-3">Workflow Reminders (Optional)</h4>
           <div className="space-y-3">
             <Toggle
               label="Recipe → Shopping List"
               description="Remind me to add recipe ingredients to shopping list"
               checked={preferences.workflow.recipeToShoppingList}
               onChange={(checked) => updateWorkflowPref('recipeToShoppingList', checked)}
             />
             <Toggle
               label="Shopping List Reminder"
               description="Remind me when it's time to shop"
               checked={preferences.workflow.shoppingListReminder}
               onChange={(checked) => updateWorkflowPref('shoppingListReminder', checked)}
             />
             <Toggle
               label="Meal Logging Reminder"
               description="Remind me to log my meals"
               checked={preferences.workflow.mealLoggingReminder}
               onChange={(checked) => updateWorkflowPref('mealLoggingReminder', checked)}
             />
           </div>
         </div>
         
         {/* Progress Notifications */}
         <div className="border-t pt-4">
           <h4 className="font-medium mb-3">Progress Updates (Optional)</h4>
           <div className="space-y-3">
             <div>
               <Toggle
                 label="Daily Summary"
                 description="Daily progress recap"
                 checked={preferences.progress.dailySummary}
                 onChange={(checked) => updateProgressPref('dailySummary', checked)}
               />
               {preferences.progress.dailySummary && (
                 <TimeSelector
                   value={preferences.progress.dailySummaryTime}
                   onChange={(time) => updateProgressPref('dailySummaryTime', time)}
                   label="Summary Time"
                 />
               )}
             </div>
             <Toggle
               label="Streak Reminders"
               description="Alert if my streak is at risk"
               checked={preferences.progress.streakReminders}
               onChange={(checked) => updateProgressPref('streakReminders', checked)}
             />
             <div>
               <Toggle
                 label="Weekly Planning Prompt"
                 description="Remind me to plan my week"
                 checked={preferences.progress.weeklyPlanning}
                 onChange={(checked) => updateProgressPref('weeklyPlanning', checked)}
               />
               {preferences.progress.weeklyPlanning && (
                 <>
                   <DaySelector
                     value={preferences.progress.weeklyPlanningDay}
                     onChange={(day) => updateProgressPref('weeklyPlanningDay', day)}
                   />
                   <TimeSelector
                     value={preferences.progress.weeklyPlanningTime}
                     onChange={(time) => updateProgressPref('weeklyPlanningTime', time)}
                   />
                 </>
               )}
             </div>
           </div>
         </div>
         
         {/* Do Not Disturb */}
         <div className="border-t pt-4">
           <h4 className="font-medium mb-3">Do Not Disturb</h4>
           <Toggle
             label="Quiet Hours"
             description="No notifications during these times"
             checked={preferences.doNotDisturb.enabled}
             onChange={(checked) => updateDNDPref('enabled', checked)}
           />
           {preferences.doNotDisturb.enabled && (
             <div className="mt-3 grid grid-cols-2 gap-4">
               <TimeSelector
                 label="Start"
                 value={preferences.doNotDisturb.startTime}
                 onChange={(time) => updateDNDPref('startTime', time)}
               />
               <TimeSelector
                 label="End"
                 value={preferences.doNotDisturb.endTime}
                 onChange={(time) => updateDNDPref('endTime', time)}
               />
             </div>
           )}
         </div>
         
         {/* Limits Info */}
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
           <p className="font-medium text-blue-900">Notification Limits:</p>
           <ul className="mt-2 space-y-1 text-blue-800">
             <li>• Maximum 3 notifications per day</li>
             <li>• Minimum 2 hours between notifications</li>
             <li>• No notifications during quiet hours</li>
           </ul>
         </div>
       </div>
     );
   }
   ```

4. **Create Email Templates**
   ```typescript
   // File: /lib/notifications/email-templates.ts
   
   export const emailTemplates = {
     dailySummary: (data: { score: number; insights: string }) => ({
       subject: 'Your Wellness Update',
       html: `
         <h2>Today's 5x5x5 Score: ${data.score}/100</h2>
         <p>${data.insights}</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress">View Full Progress</a>
       `,
     }),
     
     recipeToShoppingList: (data: { recipeName: string; recipeId: string }) => ({
       subject: 'Add ingredients to your shopping list?',
       html: `
         <p>You created "${data.recipeName}"</p>
         <p>Would you like to add the ingredients to your shopping list?</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL}/recipes/${data.recipeId}">Add to Shopping List</a>
       `,
     }),
     
     weeklyPlanning: (data: { weeklyAverage: number }) => ({
       subject: 'Time to plan your week!',
       html: `
         <h2>Last Week's Average: ${data.weeklyAverage}/100</h2>
         <p>Plan this week's meals for even better results!</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL}/meal-planner">Create Meal Plan</a>
       `,
     }),
     
     streakReminder: (data: { streakDays: number }) => ({
       subject: 'Don\'t break your streak!',
       html: `
         <h2>${data.streakDays}-Day Streak 🔥</h2>
         <p>You haven't logged food today. Keep your streak going!</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress">Log Food Now</a>
       `,
     }),
   };
   ```

5. **Testing**
   - Test notification frequency limits
   - Test DND mode
   - Test learned timing
   - Test opt-out functionality
   - Test email delivery

#### Deliverables
- ✅ Notification service implemented
- ✅ Notification settings UI created
- ✅ Email templates configured
- ✅ Frequency limits enforced
- ✅ User behavior learning implemented
- ✅ All tests passing

---

### 5.6 GDPR Compliance Implementation 🔒

**Priority:** Critical  
**Estimated Time:** 3 days  
**New Phase Addition**

#### Based on Approved Privacy Strategy

**Key Requirements:**
- Full data export (JSON, CSV formats)
- 30-day account deletion process
- Data portability
- Clear consent management
- 18-month retention for inactive accounts

#### Tasks

1. **Data Export API**
   ```typescript
   // File: /app/api/user/data-export/route.ts
   
   export async function GET(request: NextRequest) {
     const session = await getServerSession(authOptions);
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const { searchParams } = new URL(request.url);
     const format = searchParams.get('format') || 'json'; // json, csv, pdf
     
     // Fetch all user data
     const userData = await prisma.user.findUnique({
       where: { id: session.user.id },
       include: {
         foodConsumptions: {
           include: {
             foodItem: true,
           },
         },
         dailyScores: true,
         progress: true,
         recipes: true,
         mealPlans: true,
         shoppingLists: true,
         pantryItems: true,
         favorites: true,
         ratings: true,
         comments: true,
       },
     });
     
     if (format === 'json') {
       return NextResponse.json({
         profile: {
           name: userData.name,
           email: userData.email,
           bio: userData.bio,
           createdAt: userData.createdAt,
         },
         preferences: {
           dietaryRestrictions: userData.defaultDietaryRestrictions,
           focusSystems: userData.defaultFocusSystems,
           country: userData.country,
         },
         progressData: {
           foodLogs: userData.foodConsumptions,
           dailyScores: userData.dailyScores,
           progress: userData.progress,
         },
         content: {
           recipes: userData.recipes,
           mealPlans: userData.mealPlans,
           shoppingLists: userData.shoppingLists,
         },
         interactions: {
           favorites: userData.favorites,
           ratings: userData.ratings,
           comments: userData.comments,
         },
         exportDate: new Date().toISOString(),
       });
     }
     
     if (format === 'csv') {
       // Convert to CSV format
       const csv = convertToCSV(userData);
       return new Response(csv, {
         headers: {
           'Content-Type': 'text/csv',
           'Content-Disposition': `attachment; filename="wellness-hub-data-${Date.now()}.csv"`,
         },
       });
     }
     
     // PDF format would use similar approach
   }
   ```

2. **Account Deletion API**
   ```typescript
   // File: /app/api/user/delete-account/route.ts
   
   export async function POST(request: NextRequest) {
     const session = await getServerSession(authOptions);
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const body = await request.json();
     const { confirmEmail, reason } = body;
     
     // Verify email confirmation
     if (confirmEmail !== session.user.email) {
       return NextResponse.json(
         { error: 'Email confirmation does not match' },
         { status: 400 }
       );
     }
     
     // Option 1: Immediate deletion
     if (body.immediate === true) {
       await hardDeleteUser(session.user.id, reason);
       await signOut();
       return NextResponse.json({ success: true, message: 'Account deleted' });
     }
     
     // Option 2: 30-day grace period (default)
     await scheduleUserDeletion(session.user.id, reason);
     return NextResponse.json({
       success: true,
       message: 'Account scheduled for deletion in 30 days. You can cancel anytime.',
       deletionDate: addDays(new Date(), 30),
     });
   }
   
   async function hardDeleteUser(userId: string, reason?: string) {
     // Log deletion for compliance
     await prisma.deletionLog.create({
       data: {
         userId,
         email: '***@***', // Anonymized
         reason: reason || 'User requested deletion',
         deletedAt: new Date(),
       },
     });
     
     // Cascade delete all user data
     await prisma.user.delete({
       where: { id: userId },
     });
     // Note: Prisma cascade will handle all related records
   }
   ```

3. **Consent Management**
   ```typescript
   // File: /app/api/user/consent/route.ts
   
   export async function PUT(request: NextRequest) {
     const session = await getServerSession(authOptions);
     
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const body = await request.json();
     const { consentType, granted } = body;
     
     const consents = await prisma.userConsent.upsert({
       where: { userId: session.user.id },
       create: {
         userId: session.user.id,
         analytics: consentType === 'analytics' ? granted : false,
         marketing: consentType === 'marketing' ? granted : false,
         necessary: true, // Always true
         updatedAt: new Date(),
       },
       update: {
         [consentType]: granted,
         updatedAt: new Date(),
       },
     });
     
     return NextResponse.json({ success: true, consents });
   }
   ```

4. **Privacy Settings UI**
   ```tsx
   // File: /components/settings/PrivacySettings.tsx
   
   export default function PrivacySettings() {
     return (
       <div className="space-y-6">
         {/* Data Export */}
         <div className="border-b pb-6">
           <h3 className="text-lg font-semibold mb-3">Your Data</h3>
           <p className="text-sm text-gray-600 mb-4">
             Download all your data in machine-readable format
           </p>
           <div className="flex gap-3">
             <button
               onClick={() => downloadData('json')}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
             >
               Download as JSON
             </button>
             <button
               onClick={() => downloadData('csv')}
               className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
             >
               Download as CSV
             </button>
           </div>
         </div>
         
         {/* Consent Management */}
         <div className="border-b pb-6">
           <h3 className="text-lg font-semibold mb-3">Data Usage Consent</h3>
           <div className="space-y-3">
             <Toggle
               label="Necessary (Required)"
               description="Essential for app functionality"
               checked={true}
               disabled={true}
             />
             <Toggle
               label="Analytics"
               description="Help us improve the app with usage statistics"
               checked={consents.analytics}
               onChange={(checked) => updateConsent('analytics', checked)}
             />
             <Toggle
               label="Marketing"
               description="Receive product updates and wellness tips"
               checked={consents.marketing}
               onChange={(checked) => updateConsent('marketing', checked)}
             />
           </div>
         </div>
         
         {/* Data Retention */}
         <div className="border-b pb-6">
           <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
           <div className="text-sm text-gray-700 space-y-2">
             <p>• <strong>Active accounts:</strong> Data retained indefinitely</p>
             <p>• <strong>Inactive accounts (1+ year):</strong> Reminder sent, then anonymized after 18 months</p>
             <p>• <strong>Deleted accounts:</strong> Permanent deletion within 30 days</p>
           </div>
         </div>
         
         {/* Delete Account */}
         <div className="bg-red-50 border border-red-200 rounded-lg p-6">
           <h3 className="text-lg font-semibold text-red-900 mb-3">Delete Account</h3>
           <p className="text-sm text-red-800 mb-4">
             This action cannot be undone. All your data will be permanently deleted.
           </p>
           <button
             onClick={() => setShowDeleteModal(true)}
             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
           >
             Delete My Account
           </button>
         </div>
       </div>
     );
   }
   ```

5. **Inactive Account Cleanup Job**
   ```typescript
   // File: /scripts/cleanup-inactive-accounts.ts
   
   /**
    * Run monthly to anonymize inactive accounts
    */
   export async function cleanupInactiveAccounts() {
     const eighteenMonthsAgo = subMonths(new Date(), 18);
     
     // Find users inactive for 18+ months
     const inactiveUsers = await prisma.user.findMany({
       where: {
         AND: [
           { lastLoginAt: { lt: eighteenMonthsAgo } },
           { anonymized: false },
         ],
       },
     });
     
     for (const user of inactiveUsers) {
       // Send final reminder
       await sendInactiveAccountEmail(user.email);
       
       // Wait 30 days, then anonymize
       setTimeout(async () => {
         await anonymizeUser(user.id);
       }, 30 * 24 * 60 * 60 * 1000); // 30 days
     }
   }
   
   async function anonymizeUser(userId: string) {
     await prisma.user.update({
       where: { id: userId },
       data: {
         name: 'Anonymous User',
         email: `deleted-${userId}@anonymized.local`,
         password: null,
         image: null,
         bio: null,
         anonymized: true,
       },
     });
     
     // Keep aggregated scores for research (no PII)
     // Delete personal food logs
     await prisma.foodConsumption.deleteMany({
       where: { userId },
     });
   }
   ```

6. **GDPR Documentation**
   - Update privacy policy page
   - Add data processing agreement
   - Document data flows
   - Create cookie policy

#### Deliverables
- ✅ Data export API (JSON, CSV formats)
- ✅ Account deletion with 30-day grace period
- ✅ Consent management system
- ✅ Privacy settings UI
- ✅ Inactive account cleanup job
- ✅ Privacy policy updated
- ✅ GDPR compliance verified

---

## Summary Timeline

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | Database schema, user preferences, country selection |
| 2 | Scoring System | 5x5x5 algorithm, APIs, caching |
| 3 | Progress Dashboard | New components, time filters, visualizations |
| 4 | Smart Recommendations | Recommendation engine, workflow integration |
| 5 | Polish & Integration | Navigation, notifications, GDPR compliance |
| 6 | Buffer | Final testing, deployment, documentation |

---

*Document maintained by: Development Team*  
*Last updated: January 8, 2026*  
*Related documents: 01-COMPREHENSIVE-ANALYSIS.md, 03-STATUS-TRACKER.md, 04-IMPROVEMENT-SUGGESTIONS.md*
