#!/usr/bin/env ts-node

/**
 * Generate Historical Scores Script
 * 
 * This script calculates and caches 5x5x5 scores for all existing progress data.
 * Useful for:
 * - Initial deployment (generate scores for all past data)
 * - Data migration scenarios
 * - Fixing missing score cache entries
 * 
 * Usage:
 *   npx ts-node scripts/generate-historical-scores.ts
 *   
 * Options:
 *   --user-id=<id>  Only process specific user
 *   --from=<date>   Only process dates from this date forward (YYYY-MM-DD)
 *   --to=<date>     Only process dates up to this date (YYYY-MM-DD)
 *   --dry-run       Show what would be processed without actually calculating
 */

import { PrismaClient } from '@prisma/client';
import { calculate5x5x5Score } from '../lib/tracking/5x5x5-score';
import { cacheDailyScore } from '../lib/tracking/score-cache';
import { startOfDay } from 'date-fns';

const prisma = new PrismaClient();

interface Options {
  userId?: string;
  from?: Date;
  to?: Date;
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    dryRun: false,
  };

  args.forEach(arg => {
    if (arg.startsWith('--user-id=')) {
      options.userId = arg.split('=')[1];
    } else if (arg.startsWith('--from=')) {
      options.from = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--to=')) {
      options.to = new Date(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
}

/**
 * Generate scores for all existing progress data
 */
async function generateHistoricalScores(options: Options = { dryRun: false }) {
  console.log('🚀 Starting historical score generation...\n');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No scores will be calculated\n');
  }

  try {
    // Build user query
    const userWhere = options.userId ? { id: options.userId } : {};
    
    // Get all users (or specific user)
    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, email: true },
    });

    console.log(`📊 Found ${users.length} user(s) to process\n`);

    let totalScoresGenerated = 0;
    let totalErrors = 0;

    // Process each user
    for (const user of users) {
      console.log(`👤 Processing user: ${user.email || user.id}`);

      // Build date filter
      const dateFilter: any = { userId: user.id };
      if (options.from || options.to) {
        dateFilter.date = {};
        if (options.from) {
          dateFilter.date.gte = startOfDay(options.from);
        }
        if (options.to) {
          dateFilter.date.lte = startOfDay(options.to);
        }
      }

      // Find all unique dates with progress entries
      const progressEntries = await prisma.progress.findMany({
        where: dateFilter,
        select: { date: true },
        distinct: ['date'],
        orderBy: { date: 'asc' },
      });

      const uniqueDates = progressEntries.map(p => p.date);

      if (uniqueDates.length === 0) {
        console.log(`  ℹ️  No progress data found\n`);
        continue;
      }

      console.log(`  📅 Found ${uniqueDates.length} unique date(s) with progress data`);

      if (options.dryRun) {
        console.log(`  📋 Dates: ${uniqueDates.map(d => d.toISOString().split('T')[0]).join(', ')}\n`);
        continue;
      }

      // Process each date
      for (const date of uniqueDates) {
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          // Check if score already exists
          const existing = await prisma.dailyProgressScore.findUnique({
            where: {
              userId_date: {
                userId: user.id,
                date: startOfDay(date),
              },
            },
          });

          if (existing) {
            console.log(`  ✅ ${dateStr} - Score already exists (skipping)`);
            continue;
          }

          // Calculate and cache score
          console.log(`  ⏳ ${dateStr} - Calculating score...`);
          const score = await calculate5x5x5Score(user.id, date);
          await cacheDailyScore(user.id, date, score);
          
          console.log(`  ✅ ${dateStr} - Score: ${score.overallScore}/100`);
          totalScoresGenerated++;

          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`  ❌ ${dateStr} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          totalErrors++;
        }
      }

      console.log(''); // Blank line between users
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Historical score generation complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Users processed: ${users.length}`);
    console.log(`   Scores generated: ${totalScoresGenerated}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (totalErrors > 0) {
      console.log('⚠️  Some scores failed to generate. Check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Historical Score Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (options.userId) {
    console.log(`🎯 Target: User ${options.userId}`);
  } else {
    console.log(`🎯 Target: All users`);
  }

  if (options.from) {
    console.log(`📅 From: ${options.from.toISOString().split('T')[0]}`);
  }

  if (options.to) {
    console.log(`📅 To: ${options.to.toISOString().split('T')[0]}`);
  }

  console.log('');

  await generateHistoricalScores(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { generateHistoricalScores };
