import { calculate5x5x5Score } from '../lib/tracking/5x5x5-score';

async function testJohnScore() {
  const userId = 'cmk8sltur00016lmf3wecitlc';
  const targetDate = new Date('2026-01-13');
  
  console.log('=== Testing Score Calculation for John Davis ===\n');
  console.log(`Date: January 13, 2026`);
  console.log(`User ID: ${userId}\n`);
  
  const score = await calculate5x5x5Score(userId, targetDate);
  
  console.log('📊 Overall Score:', score.overallScore);
  console.log('\n🍽️ Meal Times:');
  console.log('-------------');
  
  score.mealTimes.forEach((meal) => {
    console.log(`\n${meal.mealTime}:`);
    console.log(`  Has Food: ${meal.hasFood ? '✅' : '❌'}`);
    console.log(`  Food Count: ${meal.foodCount}`);
    console.log(`  Systems Covered: ${meal.systemsCovered.length} (${meal.systemsCovered.join(', ')})`);
  });
  
  const mealsLogged = score.mealTimes.filter(m => m.hasFood).length;
  console.log(`\n📈 Total Meals Logged: ${mealsLogged}`);
  console.log(`   Expected: 1 (only LUNCH)`);
  console.log(`   Match: ${mealsLogged === 1 ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  console.log('\n🛡️ Defense Systems:');
  console.log('------------------');
  score.defenseSystems.forEach((sys) => {
    console.log(`${sys.system}: ${sys.foodsConsumed} foods (${sys.score} points)`);
  });
  
  console.log('\n🥗 Food Variety:');
  console.log(`  Total Unique Foods: ${score.foodVariety.totalUniqueFoods}`);
  console.log(`  Variety Score: ${score.foodVariety.varietyScore}`);
  
  process.exit(0);
}

testJohnScore().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
