/**
 * Email Templates for Notifications
 * 
 * HTML email templates for all notification types:
 * - Daily Summary
 * - Recipe to Shopping List
 * - Weekly Planning
 * - Streak Reminder
 * - Shopping List Reminder
 * - Meal Logging Reminder
 * - Achievement
 */

import { 
  DailySummaryData,
  RecipeToShoppingListData,
  WeeklyPlanningData,
  StreakReminderData,
  ShoppingListReminderData,
  MealLoggingReminderData,
  AchievementData,
} from './types';

// Base template wrapper
function emailWrapper(content: string, preheader: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Wellness Hub</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #059669;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    .score-badge {
      display: inline-block;
      padding: 8px 16px;
      background-color: #d1fae5;
      color: #065f46;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 18px;
      margin: 8px 0;
    }
    .insight-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 16px 0;
    }
    .streak-emoji {
      font-size: 48px;
      margin: 16px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}
  <div class="email-container">
    ${content}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Daily Summary Email
 */
export function dailySummaryEmail(data: DailySummaryData): { subject: string; html: string } {
  const { date, score, insights, nextSteps } = data;
  
  const scoreColor = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444';
  
  const content = `
    <div class="header">
      <h1>Your Daily Wellness Update</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 24px;">
        Here's how you did on <strong>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <div class="score-badge" style="background-color: ${scoreColor}20; color: ${scoreColor};">
          ${score.toFixed(1)} / 5.0
        </div>
        <p style="color: #6b7280; margin-top: 8px;">Overall Wellness Score</p>
      </div>

      ${insights ? `
        <div class="insight-box">
          <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">💡 Key Insights</h3>
          <p style="margin: 0;">${insights}</p>
        </div>
      ` : ''}

      ${nextSteps.length > 0 ? `
        <div style="margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">🎯 Tomorrow's Focus</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${nextSteps.map(step => `<li style="margin: 4px 0;">${step}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress" class="button">
          View Full Progress
        </a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you enabled daily summaries.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `Your Wellness Update: ${score.toFixed(1)}/5.0`,
    html: emailWrapper(content, `Your daily score is ${score.toFixed(1)}/5.0`),
  };
}

/**
 * Recipe to Shopping List Email
 */
export function recipeToShoppingListEmail(data: RecipeToShoppingListData): { subject: string; html: string } {
  const { recipeName, recipeId, ingredientCount } = data;
  
  const content = `
    <div class="header">
      <h1>🛒 Ready to Cook?</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">
        You saved <strong>${recipeName}</strong>!
      </p>
      
      <p style="color: #6b7280;">
        Would you like to add its <strong>${ingredientCount} ingredients</strong> to your shopping list?
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/recipes/${recipeId}?action=add-to-shopping" class="button">
          Add to Shopping List
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center;">
        This makes meal planning easier and ensures you have everything you need.
      </p>
    </div>
    <div class="footer">
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `Add ${recipeName} to your shopping list?`,
    html: emailWrapper(content, `Add ${ingredientCount} ingredients to your shopping list`),
  };
}

/**
 * Weekly Planning Email
 */
export function weeklyPlanningEmail(data: WeeklyPlanningData): { subject: string; html: string } {
  const { weekNumber, lastWeekScore } = data;
  
  const content = `
    <div class="header">
      <h1>📅 Time to Plan Your Week</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">
        Good morning! It's time to plan your meals for week ${weekNumber}.
      </p>

      ${lastWeekScore ? `
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Last week's average score</p>
          <div class="score-badge" style="margin: 12px 0;">
            ${lastWeekScore.toFixed(1)} / 5.0
          </div>
          <p style="margin: 0; color: #059669; font-weight: 600;">
            ${lastWeekScore >= 4 ? "Great work! Keep it up! 🌟" : lastWeekScore >= 3 ? "You're doing well! Let's aim higher! 💪" : "This week is a fresh start! 🚀"}
          </p>
        </div>
      ` : ''}

      <p style="color: #374151;">
        Planning ahead helps you:
      </p>
      <ul style="color: #6b7280;">
        <li>Make healthier choices</li>
        <li>Save time during busy weekdays</li>
        <li>Reduce food waste</li>
        <li>Stay on track with your goals</li>
      </ul>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/meal-planner" class="button">
          Plan This Week
        </a>
      </div>
    </div>
    <div class="footer">
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: "Time to plan your week! 📅",
    html: emailWrapper(content, "Plan your meals for the week ahead"),
  };
}

/**
 * Streak Reminder Email
 */
export function streakReminderEmail(data: StreakReminderData): { subject: string; html: string } {
  const { streakDays, lastLogDate } = data;
  
  const content = `
    <div class="header">
      <h1>Don't Break Your Streak!</h1>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <div class="streak-emoji">🔥</div>
        <p style="font-size: 24px; font-weight: 700; color: #ef4444; margin: 0;">
          ${streakDays} Day Streak
        </p>
        <p style="color: #6b7280; margin-top: 8px;">
          Last logged on ${new Date(lastLogDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #991b1b;">
          <strong>You haven't logged today!</strong> Don't let your ${streakDays}-day streak end.
        </p>
      </div>

      <p style="color: #374151;">
        Logging your meals helps you stay accountable and makes tracking your wellness journey easier.
      </p>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress" class="button">
          Log Your Meals Now
        </a>
      </div>
    </div>
    <div class="footer">
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `🔥 Don't break your ${streakDays}-day streak!`,
    html: emailWrapper(content, `You haven't logged today - keep your ${streakDays}-day streak alive!`),
  };
}

/**
 * Shopping List Reminder Email
 */
export function shoppingListReminderEmail(data: ShoppingListReminderData): { subject: string; html: string } {
  const { listName, itemCount, listId } = data;
  
  const content = `
    <div class="header">
      <h1>🛍️ Time to Go Shopping!</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">
        Your shopping list <strong>"${listName}"</strong> is ready with <strong>${itemCount} items</strong>.
      </p>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #1e40af; text-align: center;">
          💡 <strong>Tip:</strong> Shopping with a list helps you avoid impulse buys and stick to your nutrition goals!
        </p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/shopping-lists/${listId}" class="button">
          View Shopping List
        </a>
      </div>
    </div>
    <div class="footer">
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `Time to shop: ${listName} (${itemCount} items)`,
    html: emailWrapper(content, `Your shopping list has ${itemCount} items`),
  };
}

/**
 * Meal Logging Reminder Email
 */
export function mealLoggingReminderEmail(data: MealLoggingReminderData): { subject: string; html: string } {
  const { mealTime } = data;
  
  const mealEmoji = {
    BREAKFAST: '🍳',
    LUNCH: '🥗',
    DINNER: '🍽️',
    SNACK: '🍎',
  }[mealTime] || '🍽️';

  const mealName = mealTime.toLowerCase();
  
  const content = `
    <div class="header">
      <h1>${mealEmoji} Time to Log Your ${mealName}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px;">
        Hi! It's around your usual ${mealName} time.
      </p>

      <p style="color: #6b7280;">
        Logging your meals helps you stay on track with your wellness goals and provides valuable insights into your habits.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress" class="button">
          Log ${mealName} Now
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center; font-style: italic;">
        This reminder is based on your usual eating patterns. You can adjust timing in settings.
      </p>
    </div>
    <div class="footer">
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `${mealEmoji} Don't forget to log your ${mealName}`,
    html: emailWrapper(content, `Time to log your ${mealName}`),
  };
}

/**
 * Achievement Email
 */
export function achievementEmail(data: AchievementData): { subject: string; html: string } {
  const { title, description, icon } = data;
  
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>🎉 Achievement Unlocked!</h1>
    </div>
    <div class="content">
      <div style="text-align: center; margin: 32px 0;">
        <div style="font-size: 72px; margin-bottom: 16px;">${icon}</div>
        <h2 style="margin: 0; color: #374151; font-size: 24px;">${title}</h2>
        <p style="color: #6b7280; margin-top: 8px;">${description}</p>
      </div>

      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">
          Congratulations on this milestone! 🌟
        </p>
        <p style="margin: 8px 0 0 0; color: #92400e;">
          Keep up the amazing work!
        </p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress" class="button" style="background-color: #f59e0b;">
          View Your Progress
        </a>
      </div>
    </div>
    <div class="footer">
      <p>You earned this achievement through your dedication to wellness!</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification settings</a></p>
    </div>
  `;

  return {
    subject: `🎉 Achievement Unlocked: ${title}`,
    html: emailWrapper(content, `You unlocked: ${title}`),
  };
}

/**
 * Get email template for notification type
 */
export function getEmailTemplate(
  type: string,
  data: any
): { subject: string; html: string } | null {
  switch (type) {
    case 'DAILY_SUMMARY':
      return dailySummaryEmail(data);
    case 'RECIPE_TO_SHOPPING_LIST':
      return recipeToShoppingListEmail(data);
    case 'WEEKLY_PLANNING':
      return weeklyPlanningEmail(data);
    case 'STREAK_REMINDER':
      return streakReminderEmail(data);
    case 'SHOPPING_LIST_REMINDER':
      return shoppingListReminderEmail(data);
    case 'MEAL_LOGGING_REMINDER':
      return mealLoggingReminderEmail(data);
    case 'ACHIEVEMENT':
      return achievementEmail(data);
    default:
      return null;
  }
}
