import { DefenseSystem } from '@prisma/client';

/**
 * Transform FoodConsumption entries to the old Progress format for backward compatibility
 * This allows existing code to work with the new FoodConsumption table structure
 */
export function transformFoodConsumptionToProgress(consumptions: any[]) {
  return consumptions.flatMap(consumption => {
    // Group food items by defense system
    const systemGroups = new Map<DefenseSystem, string[]>();
    
    consumption.foodItems?.forEach((foodItem: any) => {
      foodItem.defenseSystems?.forEach((sysBenefit: any) => {
        const system = sysBenefit.defenseSystem as DefenseSystem;
        if (!systemGroups.has(system)) {
          systemGroups.set(system, []);
        }
        if (!systemGroups.get(system)!.includes(foodItem.name)) {
          systemGroups.get(system)!.push(foodItem.name);
        }
      });
    });
    
    // Create a progress entry for each defense system
    return Array.from(systemGroups.entries()).map(([system, foods]) => ({
      id: `${consumption.id}-${system}`,
      userId: consumption.userId,
      date: consumption.date,
      defenseSystem: system,
      foodsConsumed: foods,
      count: foods.length,
      notes: consumption.notes,
      createdAt: consumption.createdAt,
      updatedAt: consumption.updatedAt,
    }));
  });
}
