# Timezone Handling Strategy

## Problem
Users in different timezones experience issues:
- Jan 13 at midnight CET becomes Jan 12 in UTC
- Food logged "today" may appear as "yesterday" in database
- Metrics calculated incorrectly due to date shifting
- Queries using local dates don't match UTC stored dates

## Solution

### 1. **Store Dates Consistently**
All dates stored at **noon UTC (12:00:00.000Z)** to prevent timezone shifting:
- `2026-01-13` in any timezone → `2026-01-13T12:00:00.000Z` in database
- Date component stays the same regardless of timezone

### 2. **User Timezone Preference**
Already in schema: `User.timezone` (IANA timezone string)
- Detect on signup: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Allow user to change in settings
- Use for all date calculations

### 3. **Utility Functions**
Created `/lib/utils/timezone.ts` with:

```typescript
// Get today's date for queries
const today = getTodayNoonUTC();

// Get user's local date
const userToday = getUserLocalDateNoonUTC(user.timezone);

// Query range for a day
const { start, end } = getUserDayRangeUTC(user.timezone);

// Format for display
formatDateInUserTimezone(date, user.timezone)
```

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)

**File: `/app/api/progress/consumption/route.ts`**
```typescript
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';

// When logging food
const targetDate = getUserLocalDateNoonUTC(user.timezone, dateFromRequest);
```

**File: `/app/api/recipes/[id]/log-meal/route.ts`**
```typescript
import { getUserLocalDateNoonUTC } from '@/lib/utils/timezone';

// Instead of manual UTC parsing
const targetDate = getUserLocalDateNoonUTC(user.timezone, date ? new Date(date) : undefined);
```

**File: `/lib/tracking/5x5x5-score.ts`**
```typescript
import { getUserDayRangeUTC } from '@/lib/utils/timezone';

// When querying food consumption
const { start, end } = getUserDayRangeUTC(user.timezone, date);

const consumptions = await prisma.foodConsumption.findMany({
  where: {
    userId,
    date: { gte: start, lte: end }
  }
});
```

### Phase 2: Display Updates

**Components using dates:**
```typescript
import { formatDateInUserTimezone, getDateStringInUserTimezone } from '@/lib/utils/timezone';

// For display
<p>{formatDateInUserTimezone(score.date, user.timezone)}</p>

// For date inputs
<input 
  type="date" 
  value={getDateStringInUserTimezone(currentDate, user.timezone)} 
/>
```

### Phase 3: Client-Side Detection

**File: `/app/(auth)/signup/page.tsx`**
```typescript
import { detectUserTimezone } from '@/lib/utils/timezone';

const handleSignup = async () => {
  const timezone = detectUserTimezone();
  
  await fetch('/api/auth/signup', {
    body: JSON.stringify({
      ...formData,
      timezone // Include in signup
    })
  });
};
```

**File: `/components/settings/ProfileSettings.tsx`**
Add timezone selector:
```typescript
<select value={timezone} onChange={handleTimezoneChange}>
  <option value="America/New_York">Eastern Time</option>
  <option value="America/Chicago">Central Time</option>
  <option value="America/Denver">Mountain Time</option>
  <option value="America/Los_Angeles">Pacific Time</option>
  <option value="Europe/London">London</option>
  <option value="Europe/Paris">Paris</option>
  {/* etc */}
</select>
```

## Testing Strategy

### Test Cases

1. **User in PST (UTC-8) logs food at 11 PM**
   - Date: Jan 13, 2026 11:00 PM PST
   - Stored: 2026-01-13T12:00:00.000Z ✓
   - Query for Jan 13: Returns this food ✓

2. **User in CET (UTC+1) logs food at 1 AM**
   - Date: Jan 13, 2026 1:00 AM CET
   - Stored: 2026-01-13T12:00:00.000Z ✓
   - Query for Jan 13: Returns this food ✓

3. **User in Tokyo (UTC+9) views progress**
   - Current time: Jan 14, 2026 3:00 AM JST
   - User's "today": Jan 14
   - Query: `getUserDayRangeUTC('Asia/Tokyo')` → Jan 14 range ✓

### Test Script
```typescript
// scripts/test-timezone.ts
import { getUserLocalDateNoonUTC, getUserDayRangeUTC } from '../lib/utils/timezone';

console.log('PST user on Jan 13:');
const pstDate = getUserLocalDateNoonUTC('America/Los_Angeles', new Date('2026-01-13T23:00:00-08:00'));
console.log('Stored as:', pstDate.toISOString()); // 2026-01-13T12:00:00.000Z ✓

console.log('\\nCET user on Jan 13:');
const cetDate = getUserLocalDateNoonUTC('Europe/Paris', new Date('2026-01-13T01:00:00+01:00'));
console.log('Stored as:', cetDate.toISOString()); // 2026-01-13T12:00:00.000Z ✓
```

## Migration for Existing Data

For users without timezone set:
```sql
-- Set default timezone based on last known location or UTC
UPDATE "User" 
SET timezone = 'UTC' 
WHERE timezone IS NULL;
```

For existing FoodConsumption records:
```sql
-- Update dates to noon UTC (if needed)
UPDATE "FoodConsumption"
SET date = DATE_TRUNC('day', date) + INTERVAL '12 hours'
WHERE EXTRACT(HOUR FROM date) != 12;
```

## Benefits

✅ **Consistency**: All dates stored the same way  
✅ **Accuracy**: Queries match user's perception of "today"  
✅ **Simplicity**: One set of utilities for all date operations  
✅ **Flexibility**: Easy to support new timezones  
✅ **UX**: Users see data in their local timezone  

## Files to Update

### High Priority (Data Integrity)
- [ ] `/app/api/progress/consumption/route.ts`
- [ ] `/app/api/recipes/[id]/log-meal/route.ts`
- [ ] `/lib/tracking/5x5x5-score.ts`
- [ ] `/lib/tracking/score-cache.ts`

### Medium Priority (User Experience)
- [ ] `/app/(dashboard)/progress/page.tsx`
- [ ] `/components/progress/DailyMealTimeline.tsx`
- [ ] `/components/progress/OverallScoreCard.tsx`

### Low Priority (Enhancement)
- [ ] `/app/(auth)/signup/page.tsx` (detect timezone)
- [ ] `/components/settings/ProfileSettings.tsx` (timezone selector)
- [ ] `/app/api/user/preferences/route.ts` (save timezone)
