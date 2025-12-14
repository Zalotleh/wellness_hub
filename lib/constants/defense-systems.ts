import { DefenseSystem, DefenseSystemInfo } from '@/types';

export const DEFENSE_SYSTEMS: Record<DefenseSystem, DefenseSystemInfo> = {
  [DefenseSystem.ANGIOGENESIS]: {
    id: 'angiogenesis',
    name: DefenseSystem.ANGIOGENESIS,
    displayName: 'Angiogenesis',
    icon: '🩸',
    description: 'Blood vessel formation and healthy circulation. Supports starving harmful cells while feeding healthy ones.',
    keyFoods: [
      // Fruits & Berries
      'Tomatoes', 'Apples', 'Blueberries', 'Strawberries', 'Raspberries', 'Blackberries', 
      'Cranberries', 'Cherries', 'Oranges', 'Grapefruit', 'Lemons', 'Kiwi', 'Peaches', 
      'Plums', 'Pomegranate', 'Red Grapes',
      
      // Vegetables
      'Bok Choy', 'Kale', 'Spinach', 'Swiss Chard', 'Artichokes', 'Beets', 'Carrots',
      'Pumpkin', 'Bell Peppers', 'Chili Peppers',
      
      // Legumes & Soy
      'Soybeans', 'Soy Milk', 'Tofu', 'Edamame', 'Black Beans', 'Chickpeas', 'Lentils',
      
      // Nuts & Seeds
      'Walnuts', 'Almonds', 'Pecans', 'Pine Nuts', 'Chia Seeds', 'Flaxseeds', 'Pumpkin Seeds',
      
      // Fish & Seafood
      'Salmon', 'Tuna', 'Mackerel', 'Sardines', 'Anchovies', 'Sea Bass', 'Halibut',
      
      // Beverages
      'Green Tea', 'Black Tea', 'Chamomile Tea', 'Jasmine Tea', 'Red Wine', 'Beer',
      'Coffee',
      
      // Oils & Fats
      'Extra Virgin Olive Oil', 'Canola Oil', 'Grapeseed Oil',
      
      // Other Foods
      'Dark Chocolate (>70% cacao)', 'Mushrooms', 'Cheese', 'Licorice Root',
    ],
    nutrients: [
      'Lycopene',
      'Resveratrol',
      'Genistein',
      'Ellagic Acid',
      'EGCG (Epigallocatechin gallate)',
      'Anthocyanins',
      'Beta-Carotene',
      'Omega-3 Fatty Acids',
      'Hydroxytyrosol',
      'Quercetin',
    ],
    color: 'angiogenesis',
    bgColor: 'bg-angiogenesis-light',
    borderColor: 'border-angiogenesis',
    textColor: 'text-angiogenesis-dark',
  },
  [DefenseSystem.REGENERATION]: {
    id: 'regeneration',
    name: DefenseSystem.REGENERATION,
    displayName: 'Regeneration',
    icon: '🔄',
    description: 'Tissue and organ regeneration through stem cell activation. Helps your body heal and rebuild itself.',
    keyFoods: [
      // Fish & Seafood
      'Wild Salmon', 'Mackerel', 'Sardines', 'Anchovies', 'Tuna', 'Black Cod', 'Oysters',
      'Mussels', 'Clams',
      
      // Fruits
      'Mangoes', 'Blueberries', 'Blackberries', 'Cranberries', 'Goji Berries', 'Plums',
      'Dark Grapes', 'Black Raspberries',
      
      // Nuts & Seeds
      'Walnuts', 'Pecans', 'Almonds', 'Chestnuts', 'Flaxseeds', 'Chia Seeds',
      
      // Vegetables
      'Seaweed', 'Kelp', 'Nori', 'Wakame', 'Spirulina', 'Chlorella', 'Kale',
      
      // Beverages
      'Black Tea', 'Green Tea', 'Coffee', 'Dark Beer', 'Red Wine',
      
      // Oils & Fats
      'Extra Virgin Olive Oil', 'Fish Oil', 'Algae Oil',
      
      // Other Foods
      'Dark Chocolate (>70% cacao)', 'Cocoa', 'Grass-Fed Beef', 'Pasture-Raised Chicken',
      'Free-Range Eggs',
    ],
    nutrients: [
      'Omega-3 Fatty Acids (EPA, DHA)',
      'Vitamin D',
      'Polyphenols',
      'Curcumin',
      'Resveratrol',
      'Pterostilbene',
      'Anthocyanins',
      'Fucoxanthin',
      'Astaxanthin',
    ],
    color: 'regeneration',
    bgColor: 'bg-regeneration-light',
    borderColor: 'border-regeneration',
    textColor: 'text-regeneration-dark',
  },
  [DefenseSystem.MICROBIOME]: {
    id: 'microbiome',
    name: DefenseSystem.MICROBIOME,
    displayName: 'Microbiome',
    icon: '🦠',
    description: 'Gut bacteria health and digestive wellness. Supports beneficial bacteria that protect your health.',
    keyFoods: [
      // Fermented Foods (Probiotics)
      'Kimchi', 'Sauerkraut', 'Kefir', 'Yogurt (plain, unsweetened)', 'Greek Yogurt',
      'Kombucha', 'Miso', 'Tempeh', 'Natto', 'Pickles (fermented)', 'Lassi',
      'Sourdough Bread', 'Aged Cheese (Gouda, Cheddar, Swiss)',
      
      // Prebiotic Foods (Feed Good Bacteria)
      'Chicory Root', 'Jerusalem Artichokes', 'Garlic', 'Onions', 'Leeks', 'Asparagus',
      'Bananas', 'Barley', 'Oats', 'Apples', 'Flaxseeds', 'Seaweed', 'Jicama',
      'Wheat Bran', 'Dandelion Greens',
      
      // High-Fiber Foods
      'Whole Grains', 'Brown Rice', 'Quinoa', 'Buckwheat', 'Farro', 'Bulgur',
      'Black Beans', 'Kidney Beans', 'Lentils', 'Chickpeas', 'Lima Beans',
      'Broccoli', 'Brussels Sprouts', 'Artichokes', 'Green Peas',
      
      // Polyphenol-Rich Foods
      'Blueberries', 'Blackberries', 'Pomegranate', 'Dark Chocolate', 'Red Wine',
      'Green Tea', 'Black Tea', 'Coffee', 'Extra Virgin Olive Oil',
      
      // Nuts & Seeds
      'Almonds', 'Walnuts', 'Pistachios', 'Chia Seeds', 'Flaxseeds', 'Pumpkin Seeds',
      
      // Other
      'Mushrooms', 'Kiwi', 'Cranberries',
    ],
    nutrients: [
      'Probiotics (Lactobacillus, Bifidobacterium)',
      'Prebiotics (Inulin, FOS, GOS)',
      'Dietary Fiber (Soluble & Insoluble)',
      'Polyphenols',
      'Omega-3 Fatty Acids',
      'Vitamins (B12, K2)',
      'Short-Chain Fatty Acids (Butyrate)',
    ],
    color: 'microbiome',
    bgColor: 'bg-microbiome-light',
    borderColor: 'border-microbiome',
    textColor: 'text-microbiome-dark',
  },
  [DefenseSystem.DNA_PROTECTION]: {
    id: 'dna-protection',
    name: DefenseSystem.DNA_PROTECTION,
    displayName: 'DNA Protection',
    icon: '🧬',
    description: 'Repairing DNA damage and slowing aging. Protects genetic material from harmful mutations.',
    keyFoods: [
      // Cruciferous Vegetables
      'Broccoli', 'Broccoli Sprouts', 'Cauliflower', 'Brussels Sprouts', 'Cabbage',
      'Kale', 'Bok Choy', 'Collard Greens', 'Arugula', 'Watercress', 'Radishes',
      'Turnips', 'Mustard Greens', 'Kohlrabi',
      
      // Leafy Greens
      'Spinach', 'Swiss Chard', 'Romaine Lettuce', 'Endive', 'Dandelion Greens',
      
      // Colorful Vegetables
      'Carrots', 'Sweet Potatoes', 'Pumpkin', 'Butternut Squash', 'Beets',
      'Red Bell Peppers', 'Tomatoes', 'Purple Cabbage',
      
      // Berries
      'Blueberries', 'Blackberries', 'Strawberries', 'Raspberries', 'Cranberries',
      'Acai Berries', 'Goji Berries', 'Black Currants',
      
      // Citrus Fruits
      'Oranges', 'Lemons', 'Limes', 'Grapefruits', 'Tangerines', 'Clementines',
      
      // Other Fruits
      'Kiwi', 'Papaya', 'Guava', 'Pomegranate', 'Apples', 'Grapes',
      
      // Herbs & Spices
      'Turmeric', 'Ginger', 'Garlic', 'Oregano', 'Rosemary', 'Thyme', 'Basil',
      'Cinnamon', 'Cumin', 'Black Pepper',
      
      // Beverages
      'Green Tea', 'White Tea', 'Black Tea', 'Oolong Tea', 'Coffee',
      
      // Nuts & Seeds
      'Walnuts', 'Almonds', 'Brazil Nuts', 'Sunflower Seeds', 'Sesame Seeds',
      
      // Legumes
      'Black Beans', 'Kidney Beans', 'Pinto Beans', 'Lentils', 'Chickpeas',
      
      // Other Foods
      'Dark Chocolate', 'Olive Oil', 'Mushrooms', 'Seaweed', 'Whole Grains',
    ],
    nutrients: [
      'Sulforaphane',
      'EGCG (Epigallocatechin gallate)',
      'Curcumin',
      'Anthocyanins',
      'Beta-Carotene',
      'Lycopene',
      'Vitamin C',
      'Vitamin E',
      'Folate',
      'Selenium',
      'Zinc',
      'Quercetin',
      'Resveratrol',
    ],
    color: 'dna',
    bgColor: 'bg-dna-light',
    borderColor: 'border-dna',
    textColor: 'text-dna-dark',
  },
  [DefenseSystem.IMMUNITY]: {
    id: 'immunity',
    name: DefenseSystem.IMMUNITY,
    displayName: 'Immunity',
    icon: '🛡️',
    description: 'Fighting infection and cancer. Strengthens immune response against harmful invaders.',
    keyFoods: [
      // Mushrooms (Beta-Glucans)
      'Shiitake Mushrooms', 'Maitake Mushrooms', 'Oyster Mushrooms', 'Enoki Mushrooms',
      'Reishi Mushrooms', 'Lion\'s Mane Mushrooms', 'Portobello Mushrooms', 
      'White Button Mushrooms', 'Cremini Mushrooms', 'Chaga Mushrooms',
      
      // Allium Vegetables
      'Garlic', 'Onions', 'Leeks', 'Shallots', 'Scallions', 'Chives',
      
      // Citrus Fruits
      'Oranges', 'Lemons', 'Limes', 'Grapefruits', 'Tangerines', 'Clementines',
      'Kumquats',
      
      // Berries
      'Blueberries', 'Blackberries', 'Strawberries', 'Raspberries', 'Cranberries',
      'Elderberries', 'Acai Berries',
      
      // Cruciferous Vegetables
      'Broccoli', 'Cauliflower', 'Brussels Sprouts', 'Kale', 'Cabbage',
      
      // Other Vegetables
      'Spinach', 'Red Bell Peppers', 'Sweet Potatoes', 'Carrots', 'Tomatoes',
      'Pumpkin', 'Squash',
      
      // Herbs & Spices
      'Ginger', 'Turmeric', 'Black Pepper', 'Oregano', 'Thyme', 'Rosemary',
      'Sage', 'Cinnamon', 'Cayenne Pepper', 'Echinacea',
      
      // Nuts & Seeds
      'Almonds', 'Walnuts', 'Brazil Nuts', 'Sunflower Seeds', 'Pumpkin Seeds',
      
      // Seafood
      'Oysters', 'Crab', 'Lobster', 'Mussels', 'Salmon', 'Tuna', 'Sardines',
      
      // Fermented Foods
      'Yogurt', 'Kefir', 'Kimchi', 'Sauerkraut', 'Miso', 'Tempeh',
      
      // Fruits
      'Pomegranate', 'Kiwi', 'Papaya', 'Watermelon', 'Guava', 'Apples',
      
      // Beverages
      'Green Tea', 'Black Tea', 'Chamomile Tea', 'Ginger Tea', 'Elderberry Tea',
      
      // Legumes
      'Chickpeas', 'Lentils', 'Black Beans', 'Kidney Beans',
      
      // Other Foods
      'Dark Chocolate', 'Extra Virgin Olive Oil', 'Honey (raw)', 'Spirulina',
      'Chlorella', 'Wheat Germ', 'Nutritional Yeast',
    ],
    nutrients: [
      'Beta-Glucans',
      'Allicin',
      'Vitamin C',
      'Vitamin D',
      'Vitamin E',
      'Vitamin A',
      'Zinc',
      'Selenium',
      'Polyphenols',
      'Anthocyanins',
      'Quercetin',
      'Curcumin',
      'Gingerol',
      'Probiotics',
    ],
    color: 'immunity',
    bgColor: 'bg-immunity-light',
    borderColor: 'border-immunity',
    textColor: 'text-immunity-dark',
  },
};

export const DEFENSE_SYSTEM_ARRAY = Object.values(DEFENSE_SYSTEMS);

export const getDefenseSystemInfo = (system: DefenseSystem): DefenseSystemInfo => {
  return DEFENSE_SYSTEMS[system];
};