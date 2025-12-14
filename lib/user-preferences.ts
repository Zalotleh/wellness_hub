// Server-side helper to get user's measurement preference from database

import { prisma } from '@/lib/prisma';
import { MeasurementSystem } from '@/lib/shopping/measurement-system';

/**
 * Get user's measurement preference from database
 * Falls back to 'imperial' if user not found or not set
 */
export async function getUserMeasurementSystem(userId: string): Promise<MeasurementSystem> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { measurementSystem: true } as any,
    });

    if (!user) {
      return 'imperial';
    }

    const system = (user as any).measurementSystem;
    return (system === 'metric' ? 'metric' : 'imperial') as MeasurementSystem;
  } catch (error) {
    console.error('Error fetching user measurement preference:', error);
    return 'imperial';
  }
}
