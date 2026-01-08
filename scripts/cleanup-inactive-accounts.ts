/**
 * Inactive Account Cleanup Script
 * 
 * GDPR Compliance: Article 5 (Storage Limitation)
 * 
 * Purpose:
 * - Identify accounts inactive for 18+ months
 * - Send reminder email to inactive users
 * - Anonymize accounts after 30-day grace period
 * 
 * Usage:
 * - Run manually: npx tsx scripts/cleanup-inactive-accounts.ts
 * - Run as cron job: Set up monthly execution
 * 
 * Schedule Recommendation: 1st of every month at 2 AM
 */

import { PrismaClient } from '@prisma/client';
import { subMonths, addDays, isPast } from 'date-fns';

const prisma = new PrismaClient();

interface InactiveAccount {
  id: string;
  name: string | null;
  email: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  notificationPreferences: any;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔍 Starting inactive account cleanup process...\n');
  
  const stats = {
    checked: 0,
    remindersScheduled: 0,
    anonymized: 0,
    errors: 0,
  };

  try {
    // Step 1: Find accounts inactive for 18+ months
    const eighteenMonthsAgo = subMonths(new Date(), 18);
    
    const inactiveAccounts = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { lastLoginAt: { lt: eighteenMonthsAgo } },
              { lastLoginAt: null, createdAt: { lt: eighteenMonthsAgo } },
            ],
          },
          { anonymized: false },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
        notificationPreferences: true,
      },
    });

    stats.checked = inactiveAccounts.length;
    console.log(`Found ${stats.checked} inactive accounts\n`);

    // Step 2: Process each inactive account
    for (const account of inactiveAccounts) {
      try {
        await processInactiveAccount(account, stats);
      } catch (error) {
        console.error(`❌ Error processing account ${account.id}:`, error);
        stats.errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Accounts checked: ${stats.checked}`);
    console.log(`Reminders scheduled: ${stats.remindersScheduled}`);
    console.log(`Accounts anonymized: ${stats.anonymized}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error in cleanup process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Process a single inactive account
 */
async function processInactiveAccount(
  account: InactiveAccount,
  stats: { remindersScheduled: number; anonymized: number }
) {
  const prefs = account.notificationPreferences as any || {};
  const inactivityReminderSent = prefs.inactivityReminderSent;
  const inactivityReminderDate = prefs.inactivityReminderDate 
    ? new Date(prefs.inactivityReminderDate) 
    : null;

  // Check if reminder was already sent
  if (inactivityReminderSent && inactivityReminderDate) {
    // Check if 30 days have passed since reminder
    const gracePeriodEnd = addDays(inactivityReminderDate, 30);
    
    if (isPast(gracePeriodEnd)) {
      // Grace period expired - anonymize account
      console.log(`🗑️  Anonymizing account: ${account.email} (reminder sent ${inactivityReminderDate.toLocaleDateString()})`);
      await anonymizeAccount(account.id);
      stats.anonymized++;
    } else {
      // Still in grace period
      console.log(`⏳ Account ${account.email} in grace period (ends ${gracePeriodEnd.toLocaleDateString()})`);
    }
  } else {
    // Send reminder email
    console.log(`📧 Scheduling reminder for: ${account.email}`);
    await scheduleInactivityReminder(account);
    stats.remindersScheduled++;
  }
}

/**
 * Schedule inactivity reminder email
 */
async function scheduleInactivityReminder(account: InactiveAccount) {
  const reminderDate = new Date();
  
  // Update notification preferences to mark reminder as sent
  const updatedPrefs = {
    ...(account.notificationPreferences as any || {}),
    inactivityReminderSent: true,
    inactivityReminderDate: reminderDate.toISOString(),
  };

  await prisma.user.update({
    where: { id: account.id },
    data: {
      notificationPreferences: updatedPrefs,
    },
  });

  // TODO: Send actual email
  // For now, just log it
  console.log(`   ✉️  Reminder email would be sent to: ${account.email}`);
  console.log(`   ⏰ Grace period ends: ${addDays(reminderDate, 30).toLocaleDateString()}`);
  
  // In production, call email service:
  // await sendInactivityReminderEmail(account.email, account.name);
}

/**
 * Anonymize an inactive account
 */
async function anonymizeAccount(userId: string) {
  const timestamp = new Date().getTime();
  
  // Create deletion log for audit trail
  await prisma.deletionLog.create({
    data: {
      userId,
      email: '***@anonymized', // Don't store actual email
      reason: 'Inactive account cleanup (18+ months)',
      deletedAt: new Date(),
    },
  });

  // Anonymize user data
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Anonymous User',
      email: `deleted-${userId.slice(0, 8)}-${timestamp}@anonymized.local`,
      password: null,
      image: null,
      bio: null,
      anonymized: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      notificationPreferences: {
        anonymized: true,
        anonymizedAt: new Date().toISOString(),
      },
    },
  });

  // Delete personal food consumption data
  await prisma.foodConsumption.deleteMany({
    where: { userId },
  });

  // Keep aggregated scores for research (no PII)
  // DailyProgressScore records remain for statistics
  
  // Delete user-created content (recipes, meal plans, etc.)
  await prisma.recipe.deleteMany({
    where: { userId },
  });

  await prisma.mealPlan.deleteMany({
    where: { userId },
  });

  await prisma.shoppingList.deleteMany({
    where: { userId },
  });

  await prisma.pantryItem.deleteMany({
    where: { userId },
  });

  console.log(`   ✅ Account anonymized successfully`);
}

/**
 * Send inactivity reminder email
 * 
 * TODO: Implement with your email service (Resend, SendGrid, etc.)
 */
async function sendInactivityReminderEmail(email: string, name: string | null) {
  const emailContent = {
    to: email,
    subject: 'Your Wellness Hub account has been inactive',
    html: `
      <h2>Hello ${name || 'there'}!</h2>
      
      <p>
        We noticed you haven't logged into your Wellness Hub account in over 18 months.
      </p>
      
      <p>
        To protect your privacy and comply with data protection regulations (GDPR), 
        we will anonymize your account in <strong>30 days</strong> unless you log in again.
      </p>
      
      <h3>What happens if you don't log in?</h3>
      <ul>
        <li>Your personal information will be deleted</li>
        <li>Your progress data will be removed</li>
        <li>Your recipes and meal plans will be deleted</li>
        <li>Anonymous statistics may be retained for research</li>
      </ul>
      
      <h3>Want to keep your account?</h3>
      <p>
        Simply log in to your account within the next 30 days to prevent anonymization:
      </p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
         style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Log In to Wellness Hub
      </a>
      
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        If you no longer wish to use Wellness Hub, you don't need to do anything. 
        Your account will be automatically anonymized after 30 days.
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Questions? Contact us at privacy@wellness-hub.com
      </p>
    `,
  };

  // Implement with your email service
  // Example with Resend:
  // await resend.emails.send(emailContent);
  
  console.log('Email content prepared:', emailContent.subject);
}

/**
 * Dry run mode - preview what would happen without making changes
 */
async function dryRun() {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  
  const eighteenMonthsAgo = subMonths(new Date(), 18);
  
  const inactiveAccounts = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { lastLoginAt: { lt: eighteenMonthsAgo } },
            { lastLoginAt: null, createdAt: { lt: eighteenMonthsAgo } },
          ],
        },
        { anonymized: false },
      ],
    },
    select: {
      id: true,
      email: true,
      lastLoginAt: true,
      createdAt: true,
      notificationPreferences: true,
    },
  });

  console.log(`Would process ${inactiveAccounts.length} inactive accounts:\n`);

  for (const account of inactiveAccounts) {
    const prefs = account.notificationPreferences as any || {};
    const reminderSent = prefs.inactivityReminderSent;
    
    if (reminderSent) {
      const reminderDate = new Date(prefs.inactivityReminderDate);
      const gracePeriodEnd = addDays(reminderDate, 30);
      
      if (isPast(gracePeriodEnd)) {
        console.log(`🗑️  Would anonymize: ${account.email}`);
      } else {
        console.log(`⏳ In grace period: ${account.email} (ends ${gracePeriodEnd.toLocaleDateString()})`);
      }
    } else {
      console.log(`📧 Would send reminder: ${account.email}`);
    }
  }

  await prisma.$disconnect();
}

// Run script
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  dryRun().catch(console.error);
} else {
  main().catch(console.error);
}
