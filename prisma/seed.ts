import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

enum DefenseSystem {
  ANGIOGENESIS = 'ANGIOGENESIS',
  REGENERATION = 'REGENERATION', 
  MICROBIOME = 'MICROBIOME',
  DNA_PROTECTION = 'DNA_PROTECTION',
  IMMUNITY = 'IMMUNITY'
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.progress.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'Sarah Martinez',
      email: 'sarah@example.com',
      password: hashedPassword,
      bio: 'Health enthusiast and recipe creator. Passionate about the 5x5x5 system!',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'John Davis',
      email: 'john@example.com',
      password: hashedPassword,
      bio: 'Nutrition coach helping people eat to beat disease.',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Emma Lee',
      email: 'emma@example.com',
      password: hashedPassword,
      bio: 'Home cook exploring the power of food as medicine.',
    },
  });

  console.log('✅ Created 3 users');

  // Create recipes
  const recipes = [
    {
      title: 'Tomato & Olive Oil Bruschetta',
      description: 'Classic Italian appetizer rich in lycopene and healthy fats that support blood vessel formation.',
      ingredients: [
        { name: 'Ripe tomatoes', amount: '4 large' },
        { name: 'Extra virgin olive oil', amount: '3 tbsp' },
        { name: 'Fresh basil', amount: '1/4 cup' },
        { name: 'Garlic cloves', amount: '2 cloves' },
        { name: 'Baguette', amount: '1 loaf' },
        { name: 'Balsamic vinegar', amount: '1 tsp' },
      ],
      instructions: `1. Dice tomatoes and place in a bowl.
2. Mince garlic and chop basil leaves.
3. Mix tomatoes, olive oil, garlic, basil, and balsamic vinegar.
4. Let mixture sit for 15 minutes to develop flavors.
5. Slice baguette and toast until golden.
6. Top each slice with tomato mixture.
7. Drizzle with extra olive oil if desired.
8. Serve immediately.`,
      prepTime: '15 min',
      cookTime: '5 min',
      servings: 6,
      defenseSystems: [DefenseSystem.ANGIOGENESIS],
      nutrients: {
        lycopene: '8.2mg',
        vitamin_c: '28mg',
        healthy_fats: '14g',
        polyphenols: 'High',
      },
      userId: user1.id,
    },
    {
      title: 'Berry Yogurt Power Bowl',
      description: 'Probiotic-rich breakfast bowl packed with antioxidants and gut-healthy bacteria.',
      ingredients: [
        { name: 'Greek yogurt', amount: '1 cup' },
        { name: 'Blueberries', amount: '1/2 cup' },
        { name: 'Strawberries', amount: '1/2 cup' },
        { name: 'Walnuts', amount: '1/4 cup' },
        { name: 'Honey', amount: '1 tbsp' },
        { name: 'Chia seeds', amount: '1 tbsp' },
      ],
      instructions: `1. Place Greek yogurt in a bowl.
2. Wash and slice strawberries.
3. Add blueberries and strawberries on top.
4. Chop walnuts and sprinkle over berries.
5. Add chia seeds for extra omega-3s.
6. Drizzle honey over the entire bowl.
7. Mix gently or eat layered.
8. Enjoy immediately for best texture.`,
      prepTime: '10 min',
      servings: 1,
      defenseSystems: [DefenseSystem.MICROBIOME],
      nutrients: {
        probiotics: '1 billion CFU',
        fiber: '8g',
        protein: '20g',
        antioxidants: 'Very High',
      },
      userId: user2.id,
    },
    {
      title: 'Green Tea Matcha Smoothie',
      description: 'Antioxidant powerhouse that protects DNA and promotes cellular health.',
      ingredients: [
        { name: 'Matcha green tea powder', amount: '1 tsp' },
        { name: 'Fresh spinach', amount: '1 cup' },
        { name: 'Banana', amount: '1 medium' },
        { name: 'Almond milk', amount: '1 cup' },
        { name: 'Chia seeds', amount: '1 tbsp' },
        { name: 'Honey', amount: '1 tsp' },
      ],
      instructions: `1. Add almond milk to blender first.
2. Add spinach leaves (they blend easier with liquid).
3. Peel and break banana into chunks.
4. Add matcha powder, chia seeds, and honey.
5. Blend on high for 45-60 seconds until smooth.
6. Check consistency; add more milk if too thick.
7. Pour into glass immediately.
8. Drink within 10 minutes for maximum nutrient retention.`,
      prepTime: '5 min',
      servings: 1,
      defenseSystems: [DefenseSystem.DNA_PROTECTION],
      nutrients: {
        egcg: '70mg',
        vitamin_k: '145mcg',
        antioxidants: 'Extremely High',
        catechins: '35mg',
      },
      userId: user3.id,
    },
    {
      title: 'Garlic Ginger Immunity Soup',
      description: 'Warming soup loaded with immune-boosting ingredients to fight infection.',
      ingredients: [
        { name: 'Garlic cloves', amount: '6 cloves' },
        { name: 'Fresh ginger', amount: '2 inches' },
        { name: 'Shiitake mushrooms', amount: '1 cup' },
        { name: 'Chicken broth', amount: '4 cups' },
        { name: 'Onion', amount: '1 large' },
        { name: 'Carrots', amount: '2 medium' },
        { name: 'Turmeric powder', amount: '1 tsp' },
      ],
      instructions: `1. Mince garlic and grate ginger.
2. Dice onion and slice carrots.
3. Slice mushrooms thinly.
4. Heat oil in large pot over medium heat.
5. Sauté onion, garlic, and ginger for 3 minutes.
6. Add carrots and mushrooms, cook 5 minutes.
7. Pour in broth and add turmeric.
8. Simmer for 20 minutes.
9. Season with salt and pepper to taste.
10. Serve hot with fresh herbs.`,
      prepTime: '10 min',
      cookTime: '25 min',
      servings: 4,
      defenseSystems: [DefenseSystem.IMMUNITY],
      nutrients: {
        allicin: 'High',
        gingerol: '25mg',
        beta_glucans: '450mg',
        vitamin_d: '200 IU',
      },
      userId: user1.id,
    },
    {
      title: 'Wild Salmon with Turmeric Rice',
      description: 'Omega-3 rich meal that promotes stem cell activation and tissue regeneration.',
      ingredients: [
        { name: 'Wild salmon fillet', amount: '6 oz' },
        { name: 'Brown rice', amount: '1 cup' },
        { name: 'Turmeric powder', amount: '1 tsp' },
        { name: 'Olive oil', amount: '2 tbsp' },
        { name: 'Lemon', amount: '1 whole' },
        { name: 'Fresh dill', amount: '2 tbsp' },
      ],
      instructions: `1. Cook brown rice according to package directions.
2. Add turmeric to rice while cooking.
3. Pat salmon dry with paper towel.
4. Season salmon with salt, pepper, and dill.
5. Heat olive oil in pan over medium-high heat.
6. Place salmon skin-side down, cook 4 minutes.
7. Flip and cook another 3-4 minutes.
8. Squeeze lemon juice over cooked salmon.
9. Serve salmon over turmeric rice.
10. Garnish with fresh dill and lemon wedges.`,
      prepTime: '10 min',
      cookTime: '20 min',
      servings: 2,
      defenseSystems: [DefenseSystem.REGENERATION],
      nutrients: {
        omega_3: '2.2g',
        vitamin_d: '450 IU',
        curcumin: '200mg',
        protein: '34g',
      },
      userId: user2.id,
    },
    {
      title: 'Kimchi Fried Rice Bowl',
      description: 'Fermented food powerhouse that supports gut microbiome diversity.',
      ingredients: [
        { name: 'Cooked rice', amount: '2 cups' },
        { name: 'Kimchi', amount: '1 cup' },
        { name: 'Egg', amount: '2 large' },
        { name: 'Sesame oil', amount: '1 tbsp' },
        { name: 'Green onions', amount: '2 stalks' },
        { name: 'Soy sauce', amount: '2 tbsp' },
      ],
      instructions: `1. Chop kimchi into bite-sized pieces.
2. Heat sesame oil in large pan or wok.
3. Add kimchi and stir-fry for 2 minutes.
4. Add cold cooked rice, breaking up clumps.
5. Stir-fry for 5 minutes until rice is heated.
6. Push rice to sides, crack eggs in center.
7. Scramble eggs, then mix with rice.
8. Add soy sauce and sliced green onions.
9. Stir everything together.
10. Serve hot, optionally topped with sesame seeds.`,
      prepTime: '5 min',
      cookTime: '10 min',
      servings: 2,
      defenseSystems: [DefenseSystem.MICROBIOME],
      nutrients: {
        probiotics: '2.6 billion CFU',
        vitamin_k: '68mcg',
        fiber: '3g',
        capsaicin: 'Medium',
      },
      userId: user3.id,
    },
  ];

  const createdRecipes = await Promise.all(
    recipes.map((recipe) =>
      prisma.recipe.create({
        data: recipe,
      })
    )
  );

  console.log('✅ Created 6 recipes');

  // Create ratings
  await prisma.rating.create({
    data: {
      value: 5,
      recipeId: createdRecipes[0].id,
      userId: user2.id,
    },
  });

  await prisma.rating.create({
    data: {
      value: 4,
      recipeId: createdRecipes[0].id,
      userId: user3.id,
    },
  });

  await prisma.rating.create({
    data: {
      value: 5,
      recipeId: createdRecipes[1].id,
      userId: user1.id,
    },
  });

  console.log('✅ Created ratings');

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'This recipe is amazing! Made it for dinner and everyone loved it.',
      recipeId: createdRecipes[0].id,
      userId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Perfect for breakfast! The probiotics really help with digestion.',
      recipeId: createdRecipes[1].id,
      userId: user3.id,
    },
  });

  console.log('✅ Created comments');

  // Create favorites
  await prisma.favorite.create({
    data: {
      recipeId: createdRecipes[0].id,
      userId: user2.id,
    },
  });

  await prisma.favorite.create({
    data: {
      recipeId: createdRecipes[1].id,
      userId: user1.id,
    },
  });

  console.log('✅ Created favorites');

  // Create progress entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.progress.create({
    data: {
      userId: user1.id,
      date: today,
      defenseSystem: DefenseSystem.ANGIOGENESIS,
      foodsConsumed: ['Tomatoes', 'Olive Oil', 'Red Wine', 'Dark Chocolate'],
      count: 4,
      notes: 'Feeling great! Tomato bruschetta was delicious.',
    },
  });

  await prisma.progress.create({
    data: {
      userId: user1.id,
      date: today,
      defenseSystem: DefenseSystem.MICROBIOME,
      foodsConsumed: ['Greek Yogurt', 'Kimchi', 'Sauerkraut'],
      count: 3,
      notes: 'Started my day with yogurt bowl.',
    },
  });

  console.log('✅ Created progress entries');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });