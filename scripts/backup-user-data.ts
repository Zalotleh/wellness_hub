import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const USER_ID = 'cmk8sltuv00026lmf3ui32pge';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `user-${USER_ID}-backup.json`);

async function backupUserData() {
  try {
    console.log(`🔄 Backing up data for user: ${USER_ID}`);

    // Fetch all relevant user data
    const userData = {
      timestamp: new Date().toISOString(),
      userId: USER_ID,
      
      // Food consumptions
      foodConsumptions: await prisma.foodConsumption.findMany({
        where: { userId: USER_ID },
        include: {
          foodItems: {
            include: {
              defenseSystems: true,
            },
          },
        },
      }),

      // Meal plans with all nested data
      mealPlans: await prisma.mealPlan.findMany({
        where: { userId: USER_ID },
        include: {
          dailyMenus: {
            include: {
              meals: {
                include: {
                  generatedRecipe: true,
                },
              },
            },
          },
        },
      }),

      // Daily progress scores
      dailyProgressScores: await prisma.dailyProgressScore.findMany({
        where: { userId: USER_ID },
      }),

      // Pantry items
      pantryItems: await prisma.pantryItem.findMany({
        where: { userId: USER_ID },
      }),

      // Shopping lists
      shoppingLists: await prisma.shoppingList.findMany({
        where: { userId: USER_ID },
      }),

      // Recommendations
      recommendations: await prisma.recommendation.findMany({
        where: { userId: USER_ID },
      }),

      // Progress records
      progress: await prisma.progress.findMany({
        where: { userId: USER_ID },
      }),

      // AI generation logs
      aiGenerationLogs: await prisma.aIGenerationLog.findMany({
        where: { userId: USER_ID },
      }),
    };

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(userData, null, 2));

    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup saved to: ${BACKUP_FILE}`);
    console.log('\nBackup summary:');
    console.log(`  - Food Consumptions: ${userData.foodConsumptions.length}`);
    console.log(`  - Meal Plans: ${userData.mealPlans.length}`);
    console.log(`  - Daily Progress Scores: ${userData.dailyProgressScores.length}`);
    console.log(`  - Pantry Items: ${userData.pantryItems.length}`);
    console.log(`  - Shopping Lists: ${userData.shoppingLists.length}`);
    console.log(`  - Recommendations: ${userData.recommendations.length}`);
    console.log(`  - Progress Records: ${userData.progress.length}`);
    console.log(`  - AI Generation Logs: ${userData.aiGenerationLogs.length}`);

  } catch (error) {
    console.error('❌ Error backing up user data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupUserData();
