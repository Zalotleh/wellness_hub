import { prisma } from '../lib/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  
  console.log('Users in database:');
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) - ID: ${u.id}`);
  });
  
  if (users.length > 0) {
    const firstUser = users[0];
    console.log(`\nChecking foods for first user: ${firstUser.name}`);
    
    const today = new Date('2026-01-12');
    today.setHours(0, 0, 0, 0);
    
    const foods = await prisma.foodConsumption.findMany({
      where: {
        userId: firstUser.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        foodItems: {
          include: {
            defenseSystems: true
          }
        }
      }
    });
    
    console.log(`\nTotal foods logged for ${today.toDateString()}:`, foods.length);
    
    if (foods.length > 0) {
      console.log('\nFoods by system:');
      const bySys: Record<string, Set<string>> = {};
      foods.forEach(f => {
        f.foodItems.forEach(item => {
          item.defenseSystems.forEach(ds => {
            if (!bySys[ds.system]) bySys[ds.system] = new Set();
            bySys[ds.system].add(item.name);
          });
        });
      });
      Object.keys(bySys).sort().forEach(sys => {
        console.log(`  ${sys}: ${bySys[sys].size} unique foods - ${Array.from(bySys[sys]).slice(0, 5).join(', ')}${bySys[sys].size > 5 ? '...' : ''}`);
      });
    }
  }
}

checkUsers().finally(() => process.exit(0));
