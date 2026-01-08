# Notification System Documentation

## Overview

The notification system provides optional, user-controlled notifications to enhance engagement and help users stay on track with their wellness goals. All notifications respect rate limits and Do Not Disturb preferences.

## Features

### 1. Notification Types

**Workflow Reminders:**
- **Recipe to Shopping List**: Prompts to add ingredients when saving a recipe
- **Shopping List Reminders**: Reminds users to go shopping
- **Meal Logging Reminders**: Gentle reminders to log meals at learned optimal times

**Progress Updates:**
- **Daily Summary**: Daily wellness score and insights (sent at user-chosen time)
- **Streak Reminders**: Alerts when user hasn't logged to protect streak
- **Weekly Planning**: Weekly prompt to plan meals (sent on chosen day/time)

**Achievements:**
- **Achievement Notifications**: Celebrations for milestones (always enabled)

### 2. Rate Limiting

To prevent notification fatigue:
- **Maximum 3 notifications per day** (hardcoded limit)
- **Minimum 2-hour gap** between notifications
- Oldest notifications are dropped when limit is reached

### 3. Do Not Disturb Mode

- Default quiet hours: **10 PM - 7 AM**
- Fully customizable start/end times
- Supports overnight spans (e.g., 22:00 - 07:00)
- No notifications sent during DND hours

### 4. Behavioral Learning

The system learns optimal notification times from user behavior:
- Analyzes last 30 days of food logs
- Finds most common time for each meal (mode)
- Sets reminders 15-30 minutes before typical eating time
- Updates automatically as patterns change

## User Interface

### Notification Settings

Located at `/settings` (NotificationSettings component):

**Master Toggle:**
- Single switch to enable/disable all notifications
- When off, all other settings are disabled

**Workflow Reminders:**
- Individual toggles for recipe-to-shopping, shopping reminders, meal logging

**Progress Updates:**
- Daily summary with time picker
- Streak reminders toggle
- Weekly planning with day and time selectors

**Meal Reminders:**
- Master toggle for meal reminders
- Individual toggles for breakfast/lunch/dinner
- "Learn Times" button to analyze user patterns
- Displays learned optimal times (read-only)

**Do Not Disturb:**
- Toggle to enable DND mode
- Start time picker (default 22:00)
- End time picker (default 07:00)

**Rate Limits Info:**
- Read-only display of limits (3/day, 2hr gap, DND respect)

## API Endpoints

### Get Preferences

```typescript
GET /api/user/notification-preferences

Response:
{
  "success": true,
  "preferences": {
    "enabled": true,
    "workflow": { ... },
    "progress": { ... },
    "mealReminders": { ... },
    "achievements": { ... },
    "doNotDisturb": { ... }
  },
  "learnedTimes": {
    "breakfast": "07:15",
    "lunch": "11:30",
    "dinner": "18:00"
  }
}
```

### Update Preferences

```typescript
PUT /api/user/notification-preferences

Body:
{
  "preferences": {
    "enabled": true,
    "workflow": {
      "recipeToShoppingList": true,
      "shoppingListReminder": false,
      "mealLoggingReminder": true
    },
    // ... other preferences
  }
}

Response:
{
  "success": true,
  "preferences": { ... }
}
```

### Learn Optimal Times

```typescript
POST /api/user/notification-preferences/learn-times

Response:
{
  "success": true,
  "learnedTimes": {
    "breakfast": "07:15",
    "lunch": "11:30",
    "dinner": "18:00"
  }
}
```

## Implementation Details

### NotificationService

Core service class (singleton) located at `/lib/notifications/notification-service.ts`:

**Key Methods:**

```typescript
// Check if notification can be sent
canSendNotification(userId: string, type: NotificationType): Promise<{
  allowed: boolean;
  reason?: string;
}>

// Send notification
sendNotification(userId: string, type: NotificationType, data: any): Promise<NotificationResult>

// Learn optimal times from behavior
learnOptimalTimes(userId: string): Promise<NotificationTimes>

// Update user preferences
updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>

// Get user preferences
getPreferences(userId: string): Promise<NotificationPreferences>
```

**Eligibility Checks:**

1. Master toggle enabled?
2. Specific notification type enabled?
3. Not in Do Not Disturb hours?
4. Under daily limit (3 max)?
5. Minimum gap met (2 hours)?

### Email Templates

HTML email templates located at `/lib/notifications/email-templates.ts`:

**Template Functions:**
- `dailySummaryEmail(data)`: Daily score and insights
- `recipeToShoppingListEmail(data)`: Add ingredients prompt
- `weeklyPlanningEmail(data)`: Weekly planning reminder
- `streakReminderEmail(data)`: Streak protection alert
- `shoppingListReminderEmail(data)`: Shopping reminder
- `mealLoggingReminderEmail(data)`: Meal logging prompt
- `achievementEmail(data)`: Achievement celebration

**Template Features:**
- Mobile-responsive design
- Wellness-themed colors (green gradient)
- Clear CTAs with links to app
- Unsubscribe/settings links in footer
- Inline CSS for email client compatibility

## Data Storage

Notification preferences are stored in `User.notificationPreferences` JSON field:

```typescript
interface NotificationPreferences {
  enabled: boolean;
  workflow: {
    recipeToShoppingList: boolean;
    shoppingListReminder: boolean;
    mealLoggingReminder: boolean;
  };
  progress: {
    dailySummary: boolean;
    dailySummaryTime?: string; // "HH:mm"
    streakReminders: boolean;
    weeklyPlanning: boolean;
    weeklyPlanningDay?: DayOfWeek;
    weeklyPlanningTime?: string; // "HH:mm"
  };
  mealReminders: {
    enabled: boolean;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  achievements: {
    enabled: boolean;
  };
  doNotDisturb: {
    enabled: boolean;
    startTime?: string; // "HH:mm"
    endTime?: string; // "HH:mm"
  };
  maxPerDay: number; // 3
  minGapMinutes: number; // 120
  notificationLog?: NotificationLog[]; // Last 100 notifications
}
```

## Testing

Test suite located at `/lib/notifications/__tests__/notification-service.test.ts`:

**Test Coverage:**
- ✅ Rate limiting (3/day, 2-hour gap)
- ✅ Do Not Disturb mode (overnight spans)
- ✅ Preference checking (master toggle, type-specific)
- ✅ Time learning (meal pattern analysis)
- ✅ Email template generation
- ✅ Integration tests (full flow)

**Manual Testing:**

```typescript
import { testUtils } from '@/lib/notifications/__tests__/notification-service.test';

// Create test user
const userId = await testUtils.createTestUser({
  enabled: true,
  progress: { dailySummary: true }
});

// Test notification at specific time
await testUtils.testNotificationAtTime(userId, 20, 0); // 8 PM

// Clear notification log
await testUtils.clearNotificationLog(userId);
```

## Integration Points

### Trigger Points

**Recipe Created:**
```typescript
// In recipe creation API
if (recipe.saved) {
  await notificationService.sendNotification(userId, 'RECIPE_TO_SHOPPING_LIST', {
    recipeName: recipe.name,
    recipeId: recipe.id,
    ingredientCount: recipe.ingredients.length,
  });
}
```

**Daily Summary (Scheduled):**
```typescript
// Cron job or scheduled task
// Runs hourly, checks users with dailySummary enabled at current hour
const users = await getUsersWithSummaryAt(currentHour);
for (const user of users) {
  const score = await calculateDailyScore(user.id);
  await notificationService.sendNotification(user.id, 'DAILY_SUMMARY', {
    date: new Date().toISOString(),
    score,
    insights: generateInsights(score),
    nextSteps: generateNextSteps(score),
  });
}
```

**Achievement Unlocked:**
```typescript
// In achievement tracking system
if (achievementUnlocked) {
  await notificationService.sendNotification(userId, 'ACHIEVEMENT', {
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
  });
}
```

### Email Service Integration

Currently, email sending is stubbed out. To integrate with a service like Resend:

```typescript
// In notification-service.ts
import { Resend } from 'resend';
import { getEmailTemplate } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

private async sendEmail(userId: string, type: NotificationType, data: any): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const template = getEmailTemplate(type, data);
  if (!template) {
    throw new Error('No template for notification type');
  }

  await resend.emails.send({
    from: 'Wellness Hub <notifications@wellness-hub.com>',
    to: user.email,
    subject: template.subject,
    html: template.html,
  });
}
```

## Best Practices

1. **Always respect user preferences**: Check eligibility before every notification
2. **Provide clear opt-outs**: Every email has settings link in footer
3. **Use rate limits**: Never exceed 3/day or send within 2-hour gap
4. **Respect DND**: No notifications during quiet hours
5. **Make notifications valuable**: Only send when truly helpful
6. **Learn from behavior**: Use actual user patterns for timing
7. **Test thoroughly**: Verify all edge cases (timezone handling, overnight DND, etc.)

## Future Enhancements

- [ ] SMS/push notification support
- [ ] A/B testing for notification content
- [ ] Machine learning for send time optimization
- [ ] Notification engagement analytics
- [ ] Custom notification templates per user
- [ ] Notification preference import/export
- [ ] Bulk notification management for admins
- [ ] Notification preview before saving preferences

## Troubleshooting

**Notifications not sending:**
1. Check master toggle is enabled
2. Verify specific notification type is enabled
3. Check if in DND hours
4. Verify daily limit not reached (3 max)
5. Check minimum gap (2 hours) is met
6. Review server logs for errors

**Learned times not accurate:**
1. Ensure user has at least 30 days of food logs
2. Check food logs have consistent mealTime values
3. Verify timezone is set correctly
4. Try clicking "Learn Times" button again

**Email not received:**
1. Check spam folder
2. Verify email service is configured (Resend API key)
3. Check email service logs for delivery status
4. Verify user email is correct in database

## Support

For issues or questions, contact the development team or file an issue in the project repository.
