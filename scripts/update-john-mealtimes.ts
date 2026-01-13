import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateJohnMealTimes() {
  try {
    // Find John Davis
    const user = await prisma.user.findUnique({
      where: { email: 'john@example.com' },
    });

    if (!user) {
      console.log('❌ User john@example.com not found');
      return;
    }

    console.log('✅ Found user:', user.email, user.id);

    // Get today's consumptions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const consumptions = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`\n📊 Found ${consumptions.length} consumptions for today`);

    if (consumptions.length === 0) {
      console.log('⚠️ No consumptions to update');
      return;
    }

    // Update each consumption with different meal times
    const mealTimes = ['BREAKFAST', 'LUNCH', 'DINNER', 'MORNING_SNACK', 'AFTERNOON_SNACK'];
    
    for (let i = 0; i < consumptions.length; i++) {
      const consumption = consumptions[i];
      const newMealTime = mealTimes[i % mealTimes.length];
      
      await prisma.foodConsumption.update({
        where: { id: consumption.id },
        data: { mealTime: newMealTime },
      });

      console.log(`✅ Updated consumption ${i + 1}: ${consumption.mealTime} → ${newMealTime}`);
    }

    // Verify updates
    const updated = await prisma.foodConsumption.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        mealTime: true,
        createdAt: true,
      },
    });

    console.log('\n📋 Updated consumptions:');
    updated.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.mealTime} (${c.id})`);
    });

    console.log('\n✅ All meal times updated successfully!');
    console.log(`\n🔄 Now refresh the progress page to see the changes reflected.`);

  } catch (error) {
    console.error('❌ Error updating meal times:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateJohnMealTimes();
