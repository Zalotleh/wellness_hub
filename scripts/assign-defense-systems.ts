import { PrismaClient, DefenseSystem, BenefitStrength } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = 'cmk8sltuv00026lmf3ui32pge';

// Map foods to defense systems based on keywords and nutritional knowledge
// 5 Defense Systems: ANGIOGENESIS, REGENERATION, MICROBIOME, DNA_PROTECTION, IMMUNITY
const foodSystemMap: Record<string, Array<{system: DefenseSystem, strength: BenefitStrength}>> = {
  // Oats - Microbiome, DNA Protection
  'oats': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  
  // Fermented foods
  'kefir': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'HIGH' }
  ],
  'sauerkraut': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'HIGH' }
  ],
  'kimchi': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'HIGH' }
  ],
  'yogurt': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'MEDIUM' }
  ],
  'miso': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'MEDIUM' }
  ],
  
  // Berries - Angiogenesis, DNA Protection
  'blueberr': [
    { system: 'ANGIOGENESIS', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'HIGH' }
  ],
  'strawberr': [
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' },
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  'blackberr': [
    { system: 'ANGIOGENESIS', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'HIGH' }
  ],
  'pomegranate': [
    { system: 'ANGIOGENESIS', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'HIGH' }
  ],
  
  // Nuts and seeds
  'walnut': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' }
  ],
  'almond': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' }
  ],
  'chia': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'MICROBIOME', strength: 'HIGH' }
  ],
  'flax': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'MICROBIOME', strength: 'HIGH' }
  ],
  'sesame': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'REGENERATION', strength: 'MEDIUM' }
  ],
  
  // Vegetables
  'broccoli': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'ANGIOGENESIS', strength: 'HIGH' }
  ],
  'mushroom': [
    { system: 'IMMUNITY', strength: 'HIGH' },
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' }
  ],
  'tomato': [
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' },
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  'cucumber': [
    { system: 'MICROBIOME', strength: 'LOW' }
  ],
  'avocado': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' }
  ],
  'dandelion': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  
  // Greens
  'greens': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'sprouts': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'REGENERATION', strength: 'MEDIUM' }
  ],
  
  // Legumes
  'chickpea': [
    { system: 'MICROBIOME', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  'quinoa': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  
  // Healthy fats
  'olive oil': [
    { system: 'ANGIOGENESIS', strength: 'HIGH' },
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  'tahini': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' }
  ],
  
  // Aromatics
  'garlic': [
    { system: 'IMMUNITY', strength: 'HIGH' },
    { system: 'ANGIOGENESIS', strength: 'MEDIUM' }
  ],
  'onion': [
    { system: 'IMMUNITY', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'scallion': [
    { system: 'IMMUNITY', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  
  // Spices
  'cinnamon': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'turmeric': [
    { system: 'DNA_PROTECTION', strength: 'HIGH' },
    { system: 'IMMUNITY', strength: 'HIGH' }
  ],
  'cumin': [
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'paprika': [
    { system: 'ANGIOGENESIS', strength: 'LOW' }
  ],
  
  // Fruits
  'banana': [
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'lemon': [
    { system: 'DNA_PROTECTION', strength: 'MEDIUM' },
    { system: 'IMMUNITY', strength: 'MEDIUM' }
  ],
  
  // Cheese
  'cheese': [
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  'cheddar': [
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  
  // Breads
  'sourdough': [
    { system: 'MICROBIOME', strength: 'MEDIUM' }
  ],
  
  // Additional common ingredients
  'vanilla': [
    { system: 'DNA_PROTECTION', strength: 'LOW' }
  ],
  'maple': [
    { system: 'MICROBIOME', strength: 'LOW' }
  ],
  'honey': [
    { system: 'IMMUNITY', strength: 'MEDIUM' },
    { system: 'MICROBIOME', strength: 'LOW' }
  ]
};

async function assignDefenseSystems() {
  try {
    console.log('🔄 Assigning defense systems to food items...\n');
    
    const consumptions = await prisma.foodConsumption.findMany({
      where: { userId: USER_ID },
      include: {
        foodItems: {
          include: {
            defenseSystems: true
          }
        }
      }
    });
    
    let totalAssigned = 0;
    let totalSystemsAdded = 0;
    
    for (const consumption of consumptions) {
      console.log(`\nProcessing ${consumption.mealTime} on ${consumption.date.toISOString().split('T')[0]}`);
      
      for (const foodItem of consumption.foodItems) {
        if (foodItem.defenseSystems.length > 0) {
          continue; // Skip if already has systems
        }
        
        const foodNameLower = foodItem.name.toLowerCase();
        const matchedSystems: Array<{system: DefenseSystem, strength: BenefitStrength}> = [];
        
        // Check each keyword for a match
        for (const [keyword, systems] of Object.entries(foodSystemMap)) {
          if (foodNameLower.includes(keyword)) {
            matchedSystems.push(...systems);
          }
        }
        
        // Remove duplicates (in case multiple keywords matched)
        const uniqueSystems = matchedSystems.filter((system, index, self) =>
          index === self.findIndex(s => s.system === system.system)
        );
        
        if (uniqueSystems.length > 0) {
          await prisma.defenseSystemBenefit.createMany({
            data: uniqueSystems.map(s => ({
              foodItemId: foodItem.id,
              defenseSystem: s.system,
              strength: s.strength
            }))
          });
          
          console.log(`  ✅ ${foodItem.name} → ${uniqueSystems.length} systems`);
          totalAssigned++;
          totalSystemsAdded += uniqueSystems.length;
        } else {
          console.log(`  ⚠️  ${foodItem.name} → no match`);
        }
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`  Foods assigned: ${totalAssigned}`);
    console.log(`  Total systems added: ${totalSystemsAdded}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignDefenseSystems();
