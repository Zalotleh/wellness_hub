# 🎯 Recommendation System Documentation

## Overview

The recommendation system is an intelligent engine that analyzes your daily 5x5x5 progress and generates personalized action items to help you optimize your health. It combines **gap analysis**, **user behavior patterns**, and **smart prioritization** to suggest the most impactful next steps.

---

## 🔍 How It Works

### 1. **Data Collection & Analysis**

The system analyzes multiple data sources:

#### **Current Day Progress (5x5x5 Score)**
- **Defense Systems**: Which systems have foods logged (0-5 foods each)
- **Meal Times**: Which meals you've tracked (Breakfast, Lunch, Dinner, Snacks)
- **Food Variety**: Unique foods vs repeated foods
- **Overall Score**: Weighted combination (0-100)

#### **User Behavior (Last 30 Days)**
- **Preferred Meal Times**: When you typically log meals
- **Favorite Foods**: Foods you consume most frequently
- **Dietary Restrictions**: Your dietary preferences
- **Average Daily Score**: Your typical performance
- **Consistency**: How many days you've tracked (%)
- **Acceptance Rate**: % of recommendations you've acted on
- **Dismissed Types**: Recommendation types you've recently ignored

---

### 2. **Gap Analysis**

The system identifies 3 types of gaps in your progress:

#### **Missing Systems** (CRITICAL Priority)
- **Definition**: Defense systems with 0-1 foods logged
- **Example**: "You haven't logged any ANGIOGENESIS foods yet"
- **Priority Score**: 95 (if overall score < 40) or 80 (normal)
- **Action**: Recommend recipe for that specific system

#### **Weak Systems** (HIGH Priority)
- **Definition**: Defense systems with 2-3 foods logged (not optimized)
- **Example**: "Your MICROBIOME intake is low (only 2 foods)"
- **Priority Score**: 70-80
- **Action**: Suggest recipe or meal plan

#### **Missed Meals** (MEDIUM Priority)
- **Definition**: Meal times with no foods logged
- **Example**: "You haven't logged any foods for breakfast yet"
- **Priority Score**: 70 (main meals) or 60 (snacks)
- **Action**: Suggest logging food for that meal

#### **Low Variety** (LOW Priority)
- **Definition**: Eating the same foods repeatedly (variety score < 60)
- **Example**: "You've eaten blueberries 3 times today"
- **Priority Score**: 40-55
- **Action**: Suggest new foods or recipes with variety

---

### 3. **Recommendation Generation Rules**

#### **When Recommendations Are Generated:**

✅ **ALWAYS Generate If:**
- Overall score is 0 (new user or no activity)
- All 5 defense systems are missing
- User has critical gaps (score < 40)

❌ **DON'T Generate If:**
- User already has 3+ pending recommendations
- Last recommendation was less than 4 hours ago
- User's acceptance rate < 20% (keeps dismissing)

#### **Priority Hierarchy:**

1. **CRITICAL** (Red) - Missing systems when overall score < 50
2. **HIGH** (Orange) - Missing systems or multiple weak systems
3. **MEDIUM** (Blue) - Weak systems, missed meals, variety
4. **LOW** (Gray) - Minor optimizations

---

### 4. **Recommendation Types**

#### **🍳 Recipe Recommendation**
```typescript
Title: "Add ANGIOGENESIS to Your Diet"
Description: "You haven't logged any angiogenesis foods yet. These are crucial for your wellness."
Action: "Generate Recipe"
Target: /recipes/ai-generate?targetSystem=ANGIOGENESIS
Expires: 3 days
```

**Generated When:**
- Single defense system is missing or weak
- User hasn't dismissed recipe recommendations recently

#### **📅 Meal Plan Recommendation**
```typescript
Title: "Create a Meal Plan"
Description: "Boost multiple defense systems (MICROBIOME, IMMUNITY, REGENERATION) with a custom meal plan."
Action: "Plan My Week"
Target: /meal-planner?targetSystems=[...]
Expires: 7 days
```

**Generated When:**
- 2+ defense systems are weak
- User hasn't dismissed meal plan recommendations recently

#### **🥗 Food Suggestion**
```typescript
Title: "Try New Foods"
Description: "You've been eating the same foods. Let's add variety!"
Action: "View Suggestions"
Target: /progress?tab=suggestions
Expires: 3 days
```

**Generated When:**
- Variety score < 60
- User has logged at least 3 unique foods (to avoid suggesting variety when they haven't logged much)

#### **📝 Workflow Step**
```typescript
Title: "Log Your Breakfast"
Description: "You haven't logged any foods for breakfast yet"
Action: "Log Food"
Target: /progress?meal=BREAKFAST
Expires: 1 day
```

**Generated When:**
- Meal times are missing
- User has some progress but incomplete coverage

---

### 5. **Smart Filtering & Deduplication**

#### **Prevent Duplicates:**
- ✅ Only 1 recommendation per defense system per session
- ✅ Track which systems are already recommended (usedSystems Set)
- ✅ Skip systems that already have active recommendations

#### **User Respect:**
- ❌ Don't recommend recipe types user recently dismissed
- ❌ Limit to max 3 recommendations per day
- ❌ Space recommendations 4+ hours apart
- ❌ Reduce recommendations if acceptance rate < 20%

---

### 6. **Recommendation Lifecycle**

```
PENDING → (User clicks) → ACTED_ON → (Completes action) → COMPLETED
   ↓
   └──→ (User dismisses) → DISMISSED
   └──→ (Time expires) → EXPIRED
```

#### **Status Meanings:**
- **PENDING**: Shown to user, waiting for action
- **ACTED_ON**: User clicked "Generate Recipe" or "Plan Week" (in progress)
- **SHOPPED**: User created shopping list (optional intermediate step)
- **COMPLETED**: User finished the recommended workflow
- **DISMISSED**: User clicked "Dismiss" or "Not Now"
- **EXPIRED**: Recommendation passed expiration date

---

## 🎯 Example Scenarios

### **Scenario 1: New User (John Davis)**
**Current State:**
- Overall Score: 0
- Systems: 0/5
- Meals: 0/5
- Foods: 0

**Gaps Detected:**
- Missing: ALL 5 defense systems
- Missed: ALL 5 meal times
- Variety: N/A (no data)

**Recommendations Generated:**
1. 🔴 CRITICAL: "Add ANGIOGENESIS to Your Diet" (Generate Recipe)
2. 🟠 HIGH: "Add REGENERATION to Your Diet" (Generate Recipe)
3. 🟠 HIGH: "Add MICROBIOME to Your Diet" (Generate Recipe)

---

### **Scenario 2: User After Logging Lunch Recipe**
**Current State:**
- Overall Score: 32
- Systems: 1/5 (DNA_PROTECTION: 18 foods ✅)
- Meals: 1/5 (Lunch)
- Foods: 18

**Gaps Detected:**
- Missing: ANGIOGENESIS, REGENERATION, MICROBIOME, IMMUNITY (4 systems)
- Weak: None
- Missed: BREAKFAST, DINNER, MORNING_SNACK, AFTERNOON_SNACK
- Variety: Good (18 unique foods)

**Recommendations Generated:**
1. 🟠 HIGH: "Add ANGIOGENESIS to Your Diet" (Generate Recipe)
2. 🟠 HIGH: "Add REGENERATION to Your Diet" (Generate Recipe)
3. 🔵 MEDIUM: "Create a Meal Plan" (boost multiple systems)

**Why These:**
- ANGIOGENESIS & REGENERATION are completely missing
- Multiple missing systems → suggest meal plan as alternative
- Variety is already good, so no variety recommendation

---

### **Scenario 3: User After Adding Breakfast**
**Current State:**
- Overall Score: 45
- Systems: 4/5 covered (ANGIOGENESIS: 3, MICROBIOME: 1, IMMUNITY: 2, DNA_PROTECTION: 18)
- Meals: 2/5 (Lunch, Breakfast)
- Foods: 21

**Gaps Detected:**
- Missing: REGENERATION (1 system)
- Weak: ANGIOGENESIS (3 foods), MICROBIOME (1 food), IMMUNITY (2 foods)
- Missed: DINNER, MORNING_SNACK, AFTERNOON_SNACK
- Variety: Good

**Recommendations Generated:**
1. 🟠 HIGH: "Add REGENERATION to Your Diet" (still missing)
2. 🟠 HIGH: "Strengthen Your MICROBIOME" (only 1 food)
3. 🟠 HIGH: "Strengthen Your IMMUNITY" (only 2 foods)

**Why Not ANGIOGENESIS:**
- Already has 3 foods (weak but not critical)
- REGENERATION (missing) and MICROBIOME/IMMUNITY (very weak) are higher priority

---

## 🔧 Current Issues & Redundancy

### **Problem: Duplicate Recommendations**

You mentioned seeing:
```
Recommendation Card:
"Add ANGIOGENESIS to Your Diet - CRITICAL"

Action Items:
"Add ANGIOGENESIS to Your Diet - CRITICAL"
```

**Root Cause:**
There are TWO separate recommendation systems:

1. **RecommendationEngine** (`/lib/recommendations/engine.ts`)
   - Used by `/api/recommendations/next-action`
   - Generates smart recommendations based on gaps & behavior
   - Saves to database

2. **Progress Recommendations** (`/app/api/progress/recommendations/route.ts`)
   - Used by "Food Suggestions" section
   - Simple gap-based suggestions (no behavior analysis)
   - NOT saved to database

**They both analyze the same gaps and generate similar recommendations!**

### **Solution:**

The system should use ONLY ONE recommendation source. The RecommendationEngine is more sophisticated (considers user behavior, prevents spam, tracks lifecycle), so:

**Option 1: Unify Systems**
- Make both components fetch from `/api/recommendations`
- Remove `/api/progress/recommendations` endpoint
- All recommendations flow through RecommendationEngine

**Option 2: Differentiate Clearly**
- **Recommendation Cards** = Actionable workflows (recipes, meal plans)
- **Food Suggestions** = Quick tips, specific foods to try (no workflows)
- Update Food Suggestions to ONLY show food lists, not action items

---

## 📊 Metrics & Tracking

### **Recommendation Analytics:**
- **View Count**: How many times user saw recommendation
- **Dismiss Count**: How many times dismissed (if high, stop showing)
- **Acceptance Rate**: % of recommendations user acted on
- **Time to Action**: How long until user clicked

### **Used For:**
- Adjusting frequency (users with low acceptance get fewer recs)
- Learning preferences (don't show dismissed types)
- Measuring engagement (high acceptance = happy user)

---

## 🎨 Display Logic

### **RecommendationCards Component:**

Shows recommendations with status-based UI:
- **PENDING**: Show action button ("Generate Recipe")
- **ACTED_ON**: Show "In Progress" badge + continue button
- **SHOPPED**: Show "Shopped" badge + complete button
- **COMPLETED**: Show green checkmark
- **DISMISSED**: Don't show

### **Priority Colors:**
- 🔴 CRITICAL: Red gradient (red-500 → orange-500)
- 🟠 HIGH: Orange gradient (orange-500 → yellow-500)
- 🔵 MEDIUM: Blue gradient (blue-500 → indigo-500)
- ⚪ LOW: Gray gradient (gray-500 → gray-600)

---

## 🚀 Improvement Suggestions

### **1. Fix Redundancy**
Unify the two recommendation systems to eliminate duplicate suggestions.

### **2. Better Prioritization**
Consider:
- **Time of Day**: Suggest breakfast recipes in the morning
- **Upcoming Meals**: "You haven't planned dinner yet - generate a recipe?"
- **Recent Patterns**: "You usually log lunch at 12pm, want suggestions?"

### **3. Smarter Thresholds**
Instead of fixed "0-1 foods = missing", use percentage:
- **0% coverage** = Missing (CRITICAL)
- **1-40% coverage** = Weak (HIGH)
- **41-79% coverage** = In Progress (MEDIUM)
- **80-100% coverage** = Complete (none)

### **4. Progressive Disclosure**
Don't show 3 system recommendations at once. Show 1, then when acted on, show the next.

### **5. Celebration & Encouragement**
When user completes a system:
- **Show Achievement**: "🎉 DNA Protection Complete!"
- **Next Challenge**: "Ready to tackle ANGIOGENESIS?"

---

## 📝 Summary

**The recommendation system:**
1. ✅ Analyzes your 5x5x5 score to find gaps
2. ✅ Learns from your behavior (favorite foods, meal times, engagement)
3. ✅ Prioritizes most impactful actions (missing > weak > variety)
4. ✅ Respects your preferences (doesn't spam dismissed types)
5. ✅ Generates max 3 recommendations per day
6. ❌ **Issue**: Has redundancy between two systems

**Current Flow:**
```
User Progress → Gap Analysis → Behavior Analysis → Priority Calculation → 
Generate Recommendations → Save to DB → Display in UI → User Acts → 
Update Status → Track Analytics
```

**Recommendation Cards show** actionable workflows (recipes, meal plans)
**Food Suggestions show** specific foods to try based on gaps

Both are analyzing the same data, causing redundancy! 🔄
