# Timezone Quick Reference

## 🚀 Quick Start

### Import Utilities
```typescript
import {
  normalizeToNoonUTC,
  getUserLocalDateNoonUTC,
  getUserDayRangeUTC,
  formatDateInUserTimezone,
} from '@/lib/utils/timezone';
```

## 📖 Common Patterns

### 1. Storing a Date (API Endpoints)
```typescript
// ✅ DO THIS
const user = await prisma.user.findUnique({ where: { id: userId } });
const userTimezone = user.timezone || 'UTC';
const dateToStore = getUserLocalDateNoonUTC(userTimezone, new Date(inputDate));

await prisma.foodConsumption.create({
  data: {
    date: dateToStore, // Always noon UTC
    // ...
  }
});
```

```typescript
// ❌ DON'T DO THIS
const dateToStore = new Date(inputDate); // Timezone shifting!
```

### 2. Querying by Date
```typescript
// ✅ DO THIS
const user = await prisma.user.findUnique({ where: { id: userId } });
const userTimezone = user.timezone || 'UTC';
const { start, end } = getUserDayRangeUTC(userTimezone, targetDate);

const foods = await prisma.foodConsumption.findMany({
  where: {
    userId,
    date: { gte: start, lt: end } // Captures user's full day
  }
});
```

```typescript
// ❌ DON'T DO THIS
const foods = await prisma.foodConsumption.findMany({
  where: {
    userId,
    date: targetDate // Only matches exact timestamp!
  }
});
```

### 3. Displaying Dates
```typescript
// ✅ DO THIS
const user = await prisma.user.findUnique({ where: { id: userId } });
const displayDate = formatDateInUserTimezone(
  dbDate,
  user.timezone || 'UTC'
);
```

```typescript
// ❌ DON'T DO THIS
const displayDate = dbDate.toLocaleDateString(); // Uses server timezone!
```

### 4. Cache Keys
```typescript
// ✅ DO THIS
const normalizedDate = normalizeToNoonUTC(date);
const cacheKey = `${userId}:${normalizedDate.toISOString()}`;
```

```typescript
// ❌ DON'T DO THIS
const cacheKey = `${userId}:${date.toISOString()}`; // Inconsistent!
```

## 🎯 Function Reference

### `normalizeToNoonUTC(date: Date): Date`
**Purpose**: Normalize any date to noon UTC, preserving date component

```typescript
const input = new Date('2026-01-13T23:59:59-08:00'); // 11:59 PM PST
const output = normalizeToNoonUTC(input);
// → 2026-01-13T12:00:00.000Z ✓
```

**Use when**: Storing dates, creating cache keys

---

### `getUserLocalDateNoonUTC(timezone: string, date?: Date): Date`
**Purpose**: Convert user's local date to noon UTC

```typescript
const userDate = new Date('2026-01-13'); // User selected Jan 13
const stored = getUserLocalDateNoonUTC('America/New_York', userDate);
// → 2026-01-13T12:00:00.000Z ✓
```

**Use when**: User selects a date (date picker, calendar)

---

### `getUserDayRangeUTC(timezone: string, date?: Date): { start: Date, end: Date }`
**Purpose**: Get UTC boundaries for a user's day

```typescript
const { start, end } = getUserDayRangeUTC('Europe/Paris', jan13);
// start: 2026-01-13T00:00:00.000Z
// end:   2026-01-14T00:00:00.000Z
```

**Use when**: Querying database for a specific day

---

### `formatDateInUserTimezone(date: Date, timezone: string, options?): string`
**Purpose**: Display date in user's timezone

```typescript
const display = formatDateInUserTimezone(
  new Date('2026-01-13T12:00:00.000Z'),
  'America/Los_Angeles',
  { dateStyle: 'medium' }
); // → "Jan 13, 2026"
```

**Use when**: Showing dates to users

---

### `getDateStringInUserTimezone(date: Date, timezone: string): string`
**Purpose**: Get YYYY-MM-DD string in user's timezone

```typescript
const dateStr = getDateStringInUserTimezone(
  new Date('2026-01-13T12:00:00.000Z'),
  'Asia/Tokyo'
); // → "2026-01-13"
```

**Use when**: Setting value of date input fields

---

### `detectUserTimezone(): string`
**Purpose**: Auto-detect browser timezone

```typescript
const tz = detectUserTimezone(); // → "America/New_York"
```

**Use when**: Signup, first-time setup

## 🎨 Client vs Server

### Client Components
```typescript
'use client';
import { detectUserTimezone, formatDateInUserTimezone } from '@/lib/utils/timezone';

// Detect timezone
useEffect(() => {
  const tz = detectUserTimezone();
  setUserTimezone(tz);
}, []);

// Display dates
<p>{formatDateInUserTimezone(score.date, userTimezone)}</p>
```

### Server Components / API Routes
```typescript
import { getUserLocalDateNoonUTC, getUserDayRangeUTC } from '@/lib/utils/timezone';

// Get user timezone from database
const user = await prisma.user.findUnique({ where: { id } });
const tz = user.timezone || 'UTC';

// Use in queries
const { start, end } = getUserDayRangeUTC(tz, targetDate);
```

## ⚠️ Common Mistakes

### ❌ Using Date Constructor with String
```typescript
// Wrong - timezone depends on server/browser
const date = new Date('2026-01-13');
```

### ✅ Use Utilities Instead
```typescript
// Right - explicit timezone handling
const date = getUserLocalDateNoonUTC(userTimezone, new Date('2026-01-13'));
```

---

### ❌ Comparing Dates Directly
```typescript
// Wrong - time components may differ
if (date1 === date2) { ... }
```

### ✅ Normalize First
```typescript
// Right - compare normalized dates
if (normalizeToNoonUTC(date1).getTime() === normalizeToNoonUTC(date2).getTime()) { ... }
```

---

### ❌ Server Timezone for Display
```typescript
// Wrong - shows in server timezone
<p>{date.toLocaleDateString()}</p>
```

### ✅ User Timezone for Display
```typescript
// Right - shows in user's timezone
<p>{formatDateInUserTimezone(date, user.timezone)}</p>
```

## 🧪 Testing

### Test in Multiple Timezones
```bash
# Test utilities
npx tsx scripts/test-timezone-handling.ts

# Test specific user's data
npx tsx scripts/check-john-meals.ts
```

### Manual Testing
1. Change system timezone
2. Log food
3. Check database (should be noon UTC)
4. Check UI (should show in system timezone)

## 📚 Resources

- [IANA Timezone Database](https://www.iana.org/time-zones)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Complete Implementation Guide](./TIMEZONE_IMPLEMENTATION.md)
