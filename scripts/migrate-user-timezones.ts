/**
 * Migration script: Set default timezone for existing users
 * 
 * Updates all users without a timezone to UTC
 * Run this once after deploying timezone updates
 */

import { prisma } from '../lib/prisma';

async function migrateUserTimezones() {
  console.log('=== Timezone Migration ===\n');

  try {
    // Count users without timezone
    const usersWithoutTimezone = await prisma.user.count({
      where: {
        timezone: null,
      },
    });

    console.log(`Found ${usersWithoutTimezone} users without timezone set\n`);

    if (usersWithoutTimezone === 0) {
      console.log('✅ All users already have timezone set');
      return;
    }

    // Update users to UTC as default
    const result = await prisma.user.updateMany({
      where: {
        timezone: null,
      },
      data: {
        timezone: 'UTC',
      },
    });

    console.log(`✅ Updated ${result.count} users to UTC timezone\n`);

    // Optional: Try to guess timezone from country code if available
    const usersWithCountry = await prisma.user.findMany({
      where: {
        country: { not: null },
        timezone: 'UTC', // Just updated
      },
      select: {
        id: true,
        country: true,
      },
    });

    if (usersWithCountry.length > 0) {
      console.log(`Found ${usersWithCountry.length} users with country codes`);
      console.log('Attempting to set more specific timezones...\n');

      // Basic country to timezone mapping
      const countryToTimezone: Record<string, string> = {
        US: 'America/New_York',
        CA: 'America/Toronto',
        GB: 'Europe/London',
        FR: 'Europe/Paris',
        DE: 'Europe/Berlin',
        ES: 'Europe/Madrid',
        IT: 'Europe/Rome',
        JP: 'Asia/Tokyo',
        CN: 'Asia/Shanghai',
        AU: 'Australia/Sydney',
        BR: 'America/Sao_Paulo',
        MX: 'America/Mexico_City',
        IN: 'Asia/Kolkata',
        // Add more as needed
      };

      for (const user of usersWithCountry) {
        if (user.country && countryToTimezone[user.country]) {
          await prisma.user.update({
            where: { id: user.id },
            data: { timezone: countryToTimezone[user.country] },
          });
          console.log(`  Updated user ${user.id}: ${user.country} → ${countryToTimezone[user.country]}`);
        }
      }
    }

    console.log('\n✅ Timezone migration completed successfully');

    // Summary
    const timezoneSummary = await prisma.user.groupBy({
      by: ['timezone'],
      _count: true,
    });

    console.log('\nTimezone Distribution:');
    console.log('---------------------');
    timezoneSummary.forEach(({ timezone, _count }) => {
      console.log(`${timezone || 'NULL'}: ${_count} users`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUserTimezones()
  .then(() => {
    console.log('\n=== Migration Complete ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
