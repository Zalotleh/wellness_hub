# Meal Planning Feature Migration Guide

## 📋 Overview
This guide explains the database schema changes for integrating the new meal planning features.

## 🔄 What's Changed

### ✅ **Modified Models**

#### **User Model**
**Added Fields:**
- `subscriptionTier` - FREE | PREMIUM | FAMILY (default: FREE)
- `subscriptionStatus` - Subscription state (active, canceled, past_due)
- `stripeCustomerId` - Unique Stripe customer ID
- `stripeSubscriptionId` - Unique Stripe subscription ID
- `subscriptionEndsAt` - When subscription expires
- `trialEndsAt` - When trial period expires
- `mealPlansThisMonth` - Usage tracking for meal plans
- `aiQuestionsThisMonth` - Usage tracking for AI queries
- `lastResetDate` - Last time usage counters were reset
- `password` - Changed from `required` to `optional` (supports OAuth)

**Added Relations:**
- `mealPlans` - User's meal plans
- `generatedRecipes` - AI-generated recipes
- `pantryItems` - User's pantry inventory
- `shoppingLists` - Shopping lists
- `savedPlans` - Saved meal plans from community
- `planLikes` - Liked meal plans
- `planComments` - Comments on meal plans
- `planReports` - Reported meal plans

### ✅ **New Models Added**

1. **MealPlan** - Weekly meal planning
2. **DailyMenu** - Daily meals within a plan
3. **Meal** - Individual meals (breakfast/lunch/dinner)
4. **GeneratedRecipe** - AI-generated recipes for meals
5. **ShoppingList** - Auto-generated shopping lists
6. **PantryItem** - User's pantry inventory
7. **SavedMealPlan** - Community-saved plans
8. **MealPlanLike** - Likes on meal plans
9. **MealPlanComment** - Comments on meal plans
10. **MealPlanReport** - Report inappropriate plans
11. **FeatureFlag** - Feature toggles and tier restrictions

### ✅ **New Enums**

- `SubscriptionTier` - FREE, PREMIUM, FAMILY
- `MealPlanVisibility` - PRIVATE, PUBLIC, FRIENDS
- `MealPlanStatus` - DRAFT, ACTIVE, ARCHIVED

## 🚨 Important Notes

### **Recipe Model Clarification**
- **Existing `Recipe` model** = User-created community recipes (unchanged)
- **New `GeneratedRecipe` model** = AI-generated recipes tied to specific meals
- These are separate entities serving different purposes
- No conflict - both can coexist

### **Data Safety**
- ✅ All existing data is preserved
- ✅ No breaking changes to existing models
- ✅ New fields have defaults or are optional
- ✅ Existing relations remain intact

## 📦 Migration Steps

### Step 1: Review the Schema
```bash
# View the formatted schema
cat prisma/schema.prisma
```

### Step 2: Create Migration
```bash
# Create a new migration
npx prisma migrate dev --name add_meal_planning_features
```

This will:
- Create SQL migration file
- Apply changes to database
- Generate new Prisma Client

### Step 3: Verify Migration
```bash
# Check migration status
npx prisma migrate status

# View the database
npx prisma studio
```

### Step 4: Update TypeScript Types
The Prisma Client will be regenerated automatically, but you can force it:
```bash
npx prisma generate
```

### Step 5: Restart TypeScript Server
In VS Code:
- Press `Cmd/Ctrl + Shift + P`
- Type "TypeScript: Restart TS Server"
- Press Enter

## 🔍 Potential Issues & Solutions

### Issue 1: `password` Field Conflict
**Problem:** Current schema has `password String` (required), new schema has `password String?` (optional)

**Solution:** Migration will allow NULL values for password field to support OAuth users.

**SQL that will be generated:**
```sql
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
```

**Impact:** ✅ No data loss - existing passwords remain, new OAuth users can have NULL

### Issue 2: New Subscription Fields
**Problem:** Adding new required fields with defaults

**Solution:** All subscription fields have safe defaults or are nullable:
- `subscriptionTier` → defaults to `FREE`
- `mealPlansThisMonth` → defaults to `0`
- `aiQuestionsThisMonth` → defaults to `0`
- `lastResetDate` → defaults to `now()`

**Impact:** ✅ All existing users automatically get FREE tier

### Issue 3: Index Creation
**Problem:** New indexes will be created

**Solution:** Migration will create indexes in background (non-blocking in PostgreSQL 11+)

**Indexes to be created:**
- MealPlan: `userId`, `weekStart/weekEnd`, `visibility/status`
- DailyMenu: `mealPlanId/date`
- Meal: `dailyMenuId/mealType`
- GeneratedRecipe: `userId`, `isPublic`
- And more...

**Impact:** ✅ May take a few seconds on large datasets

## 🧪 Testing Checklist

After migration, test:

- [ ] Existing users can still log in
- [ ] Existing recipes display correctly
- [ ] Creating new recipes works
- [ ] User profiles load
- [ ] Progress tracking works
- [ ] New subscription fields are present
- [ ] Can query new models (MealPlan, etc.)

## 🔄 Rollback Plan

If something goes wrong:

```bash
# View migration history
npx prisma migrate status

# Rollback last migration (if needed)
npx prisma migrate resolve --rolled-back <migration_name>

# Or restore from database backup
psql $DATABASE_URL < backup.sql
```

## 📊 Database Size Impact

**Estimated new tables:**
- 11 new tables
- 3 new enums
- ~15 new indexes
- New fields on User model

**Storage:** Minimal until features are used

## 🎯 Next Steps After Migration

1. **Update API Routes** - Add endpoints for meal planning
2. **Update TypeScript Types** - Import new Prisma types
3. **Create UI Components** - Build meal planner interface
4. **Add Subscription Logic** - Implement tier restrictions
5. **Test Feature Flags** - Set up feature toggles

## 💡 Tips

- Run migration during low-traffic period
- Have database backup before migrating
- Test on development database first
- Monitor migration progress
- Check application logs after deployment

## 🆘 Support

If you encounter issues:
1. Check Prisma logs: `npx prisma migrate status`
2. Validate schema: `npx prisma validate`
3. Check database connection: `npx prisma db pull`
4. Regenerate client: `npx prisma generate`

---

**Status:** ✅ Ready to migrate
**Risk Level:** 🟢 Low (additive changes only)
**Estimated Time:** ~1-2 minutes
**Downtime Required:** ❌ None (hot migration)
