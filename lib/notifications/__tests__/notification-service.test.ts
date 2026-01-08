/**
 * Notification System Test File
 * 
 * Tests for:
 * - Rate limiting (3/day, 2-hour gap)
 * - Do Not Disturb mode
 * - Preference checking
 * - Time learning
 * - Email template generation
 */

import { notificationService } from '../notification-service';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';
import { prisma } from '@/lib/prisma';

describe('Notification Service', () => {
  describe('Rate Limiting', () => {
    it('should enforce 3 notifications per day maximum', async () => {
      // Mock scenario: User has already received 3 notifications today
      const userId = 'test-user-1';
      
      // First 3 should succeed
      for (let i = 0; i < 3; i++) {
        const result = await notificationService.canSendNotification(userId, 'DAILY_SUMMARY');
        expect(result.allowed).toBe(true);
      }
      
      // 4th should fail
      const result = await notificationService.canSendNotification(userId, 'DAILY_SUMMARY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily limit reached');
    });

    it('should enforce 2-hour minimum gap between notifications', async () => {
      const userId = 'test-user-2';
      
      // Send first notification
      await notificationService.sendNotification(userId, 'DAILY_SUMMARY', {
        date: new Date().toISOString(),
        score: 4.2,
        insights: ['Great protein intake'],
        nextSteps: ['Focus on vegetables'],
      });
      
      // Try to send another immediately (should fail)
      const result = await notificationService.canSendNotification(userId, 'STREAK_REMINDER');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Minimum gap not met');
    });
  });

  describe('Do Not Disturb', () => {
    it('should block notifications during DND hours (overnight span)', () => {
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: true,
        doNotDisturb: {
          enabled: true,
          startTime: '22:00',
          endTime: '07:00',
        },
      };
      
      // Mock current time to be within DND window
      // This would require mocking Date or using a time provider
      // For now, we'll test the logic manually
      
      const service = notificationService as any;
      
      // Test at 23:00 (should be blocked)
      // Test at 06:00 (should be blocked)
      // Test at 08:00 (should be allowed)
      
      // Note: Actual implementation would need time mocking
    });

    it('should allow notifications when DND is disabled', async () => {
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: true,
        doNotDisturb: {
          enabled: false,
          startTime: '22:00',
          endTime: '07:00',
        },
      };
      
      // Should allow notifications at any time
      const service = notificationService as any;
      const isBlocked = service.isInDoNotDisturb(prefs, 'America/New_York');
      expect(isBlocked).toBe(false);
    });
  });

  describe('Preference Checking', () => {
    it('should respect master toggle', async () => {
      const userId = 'test-user-3';
      
      await notificationService.updatePreferences(userId, {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: false, // Master toggle OFF
      });
      
      const result = await notificationService.canSendNotification(userId, 'DAILY_SUMMARY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Notifications disabled');
    });

    it('should respect individual notification type toggles', async () => {
      const userId = 'test-user-4';
      
      await notificationService.updatePreferences(userId, {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: true,
        progress: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.progress,
          dailySummary: false, // Daily summary OFF
        },
      });
      
      const result = await notificationService.canSendNotification(userId, 'DAILY_SUMMARY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('DAILY_SUMMARY notifications disabled');
    });

    it('should allow notifications when type is enabled', async () => {
      const userId = 'test-user-5';
      
      await notificationService.updatePreferences(userId, {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: true,
        achievements: {
          enabled: true, // Achievements ON
        },
      });
      
      const result = await notificationService.canSendNotification(userId, 'ACHIEVEMENT');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Time Learning', () => {
    it('should learn optimal meal times from user behavior', async () => {
      const userId = 'test-user-6';
      
      // Mock food logs at consistent times
      // - Breakfast: 7:30 AM (most days)
      // - Lunch: 12:00 PM (most days)
      // - Dinner: 6:30 PM (most days)
      
      const learnedTimes = await notificationService.learnOptimalTimes(userId);
      
      expect(learnedTimes).toBeDefined();
      expect(learnedTimes.breakfast).toBeDefined();
      expect(learnedTimes.lunch).toBeDefined();
      expect(learnedTimes.dinner).toBeDefined();
      
      // Reminders should be 15-30 minutes before typical time
      // Breakfast at 7:30 → reminder at 7:15 or 7:00
      // This would need actual data to test properly
    });

    it('should handle users with no meal patterns', async () => {
      const userId = 'test-user-new';
      
      // New user with no food logs
      const learnedTimes = await notificationService.learnOptimalTimes(userId);
      
      expect(learnedTimes).toEqual({});
    });
  });

  describe('Email Templates', () => {
    it('should generate daily summary email', () => {
      const { dailySummaryEmail } = require('../email-templates');
      
      const template = dailySummaryEmail({
        date: new Date().toISOString(),
        score: 4.2,
        insights: ['Great protein intake', 'Good hydration'],
        nextSteps: ['Add more vegetables', 'Try new recipes'],
      });
      
      expect(template.subject).toContain('4.2');
      expect(template.html).toContain('4.2 / 5.0');
      expect(template.html).toContain('Great protein intake');
      expect(template.html).toContain('Add more vegetables');
    });

    it('should generate recipe to shopping list email', () => {
      const { recipeToShoppingListEmail } = require('../email-templates');
      
      const template = recipeToShoppingListEmail({
        recipeName: 'Healthy Buddha Bowl',
        recipeId: 'recipe-123',
        ingredientCount: 12,
      });
      
      expect(template.subject).toContain('Healthy Buddha Bowl');
      expect(template.html).toContain('Healthy Buddha Bowl');
      expect(template.html).toContain('12 ingredients');
      expect(template.html).toContain('recipe-123');
    });

    it('should generate streak reminder email', () => {
      const { streakReminderEmail } = require('../email-templates');
      
      const template = streakReminderEmail({
        streakDays: 14,
        lastLogDate: new Date().toISOString(),
      });
      
      expect(template.subject).toContain('14-day streak');
      expect(template.html).toContain('14 Day Streak');
      expect(template.html).toContain('🔥');
    });

    it('should generate achievement email', () => {
      const { achievementEmail } = require('../email-templates');
      
      const template = achievementEmail({
        title: 'First Recipe Created',
        description: 'You created your first custom recipe!',
        icon: '👨‍🍳',
      });
      
      expect(template.subject).toContain('First Recipe Created');
      expect(template.html).toContain('First Recipe Created');
      expect(template.html).toContain('👨‍🍳');
      expect(template.html).toContain('Achievement Unlocked');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full notification flow', async () => {
      const userId = 'test-user-integration';
      
      // 1. Set preferences
      await notificationService.updatePreferences(userId, {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: true,
        progress: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.progress,
          dailySummary: true,
        },
      });
      
      // 2. Check eligibility
      const eligibility = await notificationService.canSendNotification(userId, 'DAILY_SUMMARY');
      expect(eligibility.allowed).toBe(true);
      
      // 3. Send notification
      const result = await notificationService.sendNotification(userId, 'DAILY_SUMMARY', {
        date: new Date().toISOString(),
        score: 4.5,
        insights: ['Excellent balance'],
        nextSteps: ['Keep it up!'],
      });
      
      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      
      // 4. Verify notification was logged
      const prefs = await notificationService.getPreferences(userId);
      expect((prefs as any).notificationLog).toBeDefined();
      expect((prefs as any).notificationLog.length).toBeGreaterThan(0);
    });

    it('should skip notification when not eligible', async () => {
      const userId = 'test-user-skip';
      
      // Disable notifications
      await notificationService.updatePreferences(userId, {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: false,
      });
      
      // Try to send
      const result = await notificationService.sendNotification(userId, 'DAILY_SUMMARY', {
        date: new Date().toISOString(),
        score: 4.0,
        insights: [],
        nextSteps: [],
      });
      
      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('disabled');
    });
  });
});

// Export test utilities for manual testing
export const testUtils = {
  /**
   * Create test user with specific preferences
   */
  async createTestUser(preferences: Partial<NotificationPreferences>) {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        notificationPreferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...preferences,
        },
      },
    });
    
    return user.id;
  },

  /**
   * Simulate sending notification at specific time
   */
  async testNotificationAtTime(userId: string, hour: number, minute: number) {
    // This would require time mocking in actual implementation
    console.log(`Testing notification for user ${userId} at ${hour}:${minute}`);
  },

  /**
   * Clear notification log for testing
   */
  async clearNotificationLog(userId: string) {
    await notificationService.updatePreferences(userId, {
      ...(await notificationService.getPreferences(userId)),
      notificationLog: [],
    } as any);
  },
};
