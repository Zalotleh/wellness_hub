/**
 * Notification Service
 * 
 * Manages notification sending with:
 * - Rate limiting (max 3/day, 2-hour gap)
 * - Do Not Disturb mode (10 PM - 7 AM default)
 * - User behavior learning for optimal timing
 * - Preference checking
 */

import { prisma } from '@/lib/prisma';
import { 
  NotificationType, 
  NotificationPreferences, 
  NotificationData,
  NotificationTimes,
  NotificationResult,
  DEFAULT_NOTIFICATION_PREFERENCES,
  MealTime
} from './types';
import { format, differenceInMinutes, isAfter, isBefore, parse, startOfDay, endOfDay, subDays } from 'date-fns';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if notification can be sent based on all rules
   */
  async canSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get user with preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          notificationPreferences: true,
          timezone: true,
        },
      });

      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      const prefs = (user.notificationPreferences as unknown as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;

      // 1. Check master toggle
      if (!prefs.enabled) {
        return { allowed: false, reason: 'Notifications disabled' };
      }

      // 2. Check specific notification type
      if (!this.isTypeEnabled(type, prefs)) {
        return { allowed: false, reason: `${type} notifications disabled` };
      }

      // 3. Check Do Not Disturb
      if (this.isInDoNotDisturb(prefs, user.timezone)) {
        return { allowed: false, reason: 'In Do Not Disturb hours' };
      }

      // 4. Check daily limit (3 max)
      const todayCount = await this.getNotificationCountToday(userId);
      if (todayCount >= (prefs.maxPerDay || 3)) {
        return { allowed: false, reason: 'Daily limit reached (3 max)' };
      }

      // 5. Check minimum gap (2 hours)
      const lastNotification = await this.getLastNotificationTime(userId);
      if (lastNotification) {
        const minutesSince = differenceInMinutes(new Date(), lastNotification);
        if (minutesSince < (prefs.minGapMinutes || 120)) {
          return { 
            allowed: false, 
            reason: `Minimum gap not met (${minutesSince}/${prefs.minGapMinutes || 120} min)` 
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking notification eligibility:', error);
      return { allowed: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Check if specific notification type is enabled
   */
  private isTypeEnabled(type: NotificationType, prefs: NotificationPreferences): boolean {
    switch (type) {
      case 'RECIPE_TO_SHOPPING_LIST':
        return prefs.workflow.recipeToShoppingList;
      case 'SHOPPING_LIST_REMINDER':
        return prefs.workflow.shoppingListReminder;
      case 'MEAL_LOGGING_REMINDER':
        return prefs.workflow.mealLoggingReminder;
      case 'DAILY_SUMMARY':
        return prefs.progress.dailySummary;
      case 'STREAK_REMINDER':
        return prefs.progress.streakReminders;
      case 'WEEKLY_PLANNING':
        return prefs.progress.weeklyPlanning;
      case 'ACHIEVEMENT':
        return prefs.achievements.enabled;
      default:
        return false;
    }
  }

  /**
   * Check if current time is within Do Not Disturb hours
   */
  private isInDoNotDisturb(prefs: NotificationPreferences, userTimezone?: string | null): boolean {
    if (!prefs.doNotDisturb.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    const startTime = prefs.doNotDisturb.startTime || '22:00';
    const endTime = prefs.doNotDisturb.endTime || '07:00';

    // Parse times
    const current = parse(currentTime, 'HH:mm', now);
    const start = parse(startTime, 'HH:mm', now);
    const end = parse(endTime, 'HH:mm', now);

    // Handle overnight DND (e.g., 22:00 - 07:00)
    if (isAfter(start, end)) {
      // DND spans midnight
      return isAfter(current, start) || isBefore(current, end);
    } else {
      // DND within same day
      return isAfter(current, start) && isBefore(current, end);
    }
  }

  /**
   * Get notification count for today
   */
  private async getNotificationCountToday(userId: string): Promise<number> {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    // Get from notificationPreferences JSON field (we'll track there)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const prefs = user?.notificationPreferences as any;
    const notifications = prefs?.notificationLog || [];

    // Filter notifications sent today
    const todayNotifications = notifications.filter((n: any) => {
      const sentAt = new Date(n.sentAt);
      return sentAt >= today && sentAt <= tomorrow;
    });

    return todayNotifications.length;
  }

  /**
   * Get last notification sent time
   */
  private async getLastNotificationTime(userId: string): Promise<Date | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const prefs = user?.notificationPreferences as any;
    const notifications = prefs?.notificationLog || [];

    if (notifications.length === 0) {
      return null;
    }

    // Get most recent notification
    const sorted = notifications.sort((a: any, b: any) => {
      return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    });

    return new Date(sorted[0].sentAt);
  }

  /**
   * Log notification as sent
   */
  private async logNotification(userId: string, type: NotificationType, metadata?: any): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const prefs = (user?.notificationPreferences as any) || {};
    const notifications = prefs.notificationLog || [];

    // Add new notification
    notifications.push({
      id: `notif_${Date.now()}`,
      type,
      sentAt: new Date().toISOString(),
      metadata,
    });

    // Keep only last 100 notifications
    const recentNotifications = notifications.slice(-100);

    // Update preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: {
          ...prefs,
          notificationLog: recentNotifications,
        },
      },
    });
  }

  /**
   * Learn optimal notification times from user behavior
   */
  async learnOptimalTimes(userId: string): Promise<NotificationTimes> {
    try {
      // Get food logs from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);

      const foodLogs = await prisma.foodConsumption.findMany({
        where: {
          userId,
          timeConsumed: { gte: thirtyDaysAgo },
        },
        select: {
          mealTime: true,
          timeConsumed: true,
        },
        orderBy: { timeConsumed: 'desc' },
      });

      // Group by meal time
      const breakfastTimes: string[] = [];
      const lunchTimes: string[] = [];
      const dinnerTimes: string[] = [];

      for (const log of foodLogs) {
        if (!log.timeConsumed) continue;
        const time = format(log.timeConsumed, 'HH:mm');
        
        switch (log.mealTime) {
          case 'BREAKFAST':
            breakfastTimes.push(time);
            break;
          case 'LUNCH':
            lunchTimes.push(time);
            break;
          case 'DINNER':
            dinnerTimes.push(time);
            break;
        }
      }

      // Find most common time for each meal (mode)
      const optimalBreakfast = this.findMostCommonTime(breakfastTimes);
      const optimalLunch = this.findMostCommonTime(lunchTimes);
      const optimalDinner = this.findMostCommonTime(dinnerTimes);

      // Set reminder 15-30 minutes before typical time
      return {
        breakfast: optimalBreakfast ? this.subtractMinutes(optimalBreakfast, 15) : undefined,
        lunch: optimalLunch ? this.subtractMinutes(optimalLunch, 30) : undefined,
        dinner: optimalDinner ? this.subtractMinutes(optimalDinner, 30) : undefined,
      };
    } catch (error) {
      console.error('Error learning optimal times:', error);
      return {};
    }
  }

  /**
   * Find most common time in array
   */
  private findMostCommonTime(times: string[]): string | undefined {
    if (times.length === 0) return undefined;

    const frequency: Record<string, number> = {};
    
    for (const time of times) {
      frequency[time] = (frequency[time] || 0) + 1;
    }

    // Find time with highest frequency
    let maxCount = 0;
    let mostCommon = times[0];

    for (const [time, count] of Object.entries(frequency)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = time;
      }
    }

    return mostCommon;
  }

  /**
   * Subtract minutes from time string
   */
  private subtractMinutes(timeStr: string, minutes: number): string {
    const now = new Date();
    const time = parse(timeStr, 'HH:mm', now);
    const adjusted = new Date(time.getTime() - minutes * 60000);
    return format(adjusted, 'HH:mm');
  }

  /**
   * Send notification (main entry point)
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: any
  ): Promise<NotificationResult> {
    try {
      // Check if notification can be sent
      const eligibility = await this.canSendNotification(userId, type);
      
      if (!eligibility.allowed) {
        console.log(`[Notification] Skipped for user ${userId}: ${eligibility.reason}`);
        return {
          success: false,
          skipped: true,
          reason: eligibility.reason,
        };
      }

      // Log notification
      await this.logNotification(userId, type, data);

      // Send via appropriate channel (email only for now)
      const result = await this.sendEmail(userId, type, data);

      console.log(`[Notification] Sent ${type} to user ${userId}`);

      return {
        success: true,
        notificationId: `notif_${Date.now()}`,
      };
    } catch (error) {
      console.error(`[Notification] Error sending ${type}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(userId: string, type: NotificationType, data: any): Promise<void> {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, just log what would be sent
    console.log(`[Email] Would send ${type} to ${user.email}`, data);

    // Example integration:
    // const emailTemplate = getEmailTemplate(type, data);
    // await resend.emails.send({
    //   from: 'Wellness Hub <notifications@wellness-hub.com>',
    //   to: user.email,
    //   subject: emailTemplate.subject,
    //   html: emailTemplate.html,
    // });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const currentPrefs = (user?.notificationPreferences as unknown as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: updatedPrefs,
      },
    });

    console.log(`[Notification] Updated preferences for user ${userId}`);
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    return (user?.notificationPreferences as unknown as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
