import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  UserPreferences,
  UpdateUserPreferencesRequest,
  NotificationPreferences,
  DefenseSystem,
} from '@/types';

/**
 * GET /api/user/preferences
 * Retrieve user's preferences including dietary restrictions, focus systems, and notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        defaultDietaryRestrictions: true,
        defaultFocusSystems: true,
        defaultServings: true,
        country: true,
        timezone: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    const preferences: UserPreferences = {
      defaultDietaryRestrictions: user.defaultDietaryRestrictions,
      defaultFocusSystems: user.defaultFocusSystems as unknown as DefenseSystem[],
      defaultServings: user.defaultServings,
      country: user.country,
      timezone: user.timezone,
      notificationPreferences: user.notificationPreferences as NotificationPreferences | null,
    };

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/preferences
 * Update user's preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body: UpdateUserPreferencesRequest = await request.json();

    // Validation
    const validationError = validatePreferences(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (body.defaultDietaryRestrictions !== undefined) {
      updateData.defaultDietaryRestrictions = body.defaultDietaryRestrictions;
    }

    if (body.defaultFocusSystems !== undefined) {
      updateData.defaultFocusSystems = body.defaultFocusSystems;
    }

    if (body.defaultServings !== undefined) {
      updateData.defaultServings = body.defaultServings;
    }

    if (body.country !== undefined) {
      updateData.country = body.country;
    }

    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    if (body.notificationPreferences !== undefined) {
      updateData.notificationPreferences = body.notificationPreferences;
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        defaultDietaryRestrictions: true,
        defaultFocusSystems: true,
        defaultServings: true,
        country: true,
        timezone: true,
        notificationPreferences: true,
      },
    });

    const preferences: UserPreferences = {
      defaultDietaryRestrictions: updatedUser.defaultDietaryRestrictions,
      defaultFocusSystems: updatedUser.defaultFocusSystems as unknown as DefenseSystem[],
      defaultServings: updatedUser.defaultServings,
      country: updatedUser.country,
      timezone: updatedUser.timezone,
      notificationPreferences: updatedUser.notificationPreferences as NotificationPreferences | null,
    };

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Validate user preferences update request
 */
function validatePreferences(body: UpdateUserPreferencesRequest): string | null {
  // Validate defaultServings
  if (body.defaultServings !== undefined) {
    if (typeof body.defaultServings !== 'number') {
      return 'defaultServings must be a number.';
    }
    if (body.defaultServings < 1 || body.defaultServings > 12) {
      return 'defaultServings must be between 1 and 12.';
    }
  }

  // Validate defaultFocusSystems
  if (body.defaultFocusSystems !== undefined) {
    if (!Array.isArray(body.defaultFocusSystems)) {
      return 'defaultFocusSystems must be an array.';
    }

    const validSystems = [
      'ANGIOGENESIS',
      'REGENERATION',
      'MICROBIOME',
      'DNA_PROTECTION',
      'IMMUNITY',
    ];

    for (const system of body.defaultFocusSystems) {
      if (!validSystems.includes(system)) {
        return `Invalid defense system: ${system}. Valid systems are: ${validSystems.join(', ')}.`;
      }
    }

    if (body.defaultFocusSystems.length > 5) {
      return 'You can select up to 5 defense systems.';
    }
  }

  // Validate defaultDietaryRestrictions
  if (body.defaultDietaryRestrictions !== undefined) {
    if (!Array.isArray(body.defaultDietaryRestrictions)) {
      return 'defaultDietaryRestrictions must be an array.';
    }

    // Basic validation - ensure strings
    for (const restriction of body.defaultDietaryRestrictions) {
      if (typeof restriction !== 'string') {
        return 'All dietary restrictions must be strings.';
      }
      if (restriction.length > 100) {
        return 'Dietary restriction names must be less than 100 characters.';
      }
    }
  }

  // Validate country (ISO country code)
  if (body.country !== undefined && body.country !== null) {
    if (typeof body.country !== 'string') {
      return 'country must be a string.';
    }
    if (body.country.length !== 2 && body.country.length !== 3) {
      return 'country must be a valid ISO country code (2 or 3 characters).';
    }
  }

  // Validate timezone (IANA timezone)
  if (body.timezone !== undefined && body.timezone !== null) {
    if (typeof body.timezone !== 'string') {
      return 'timezone must be a string.';
    }
    // Basic check for timezone format (e.g., "America/New_York")
    if (!body.timezone.includes('/') && body.timezone !== 'UTC') {
      return 'timezone must be a valid IANA timezone (e.g., "America/New_York", "UTC").';
    }
  }

  // Validate notification preferences
  if (body.notificationPreferences !== undefined && body.notificationPreferences !== null) {
    const notifPrefs = body.notificationPreferences;

    if (typeof notifPrefs !== 'object') {
      return 'notificationPreferences must be an object.';
    }

    // Validate boolean fields
    if (notifPrefs.enabled !== undefined && typeof notifPrefs.enabled !== 'boolean') {
      return 'notificationPreferences.enabled must be a boolean.';
    }

    // Validate maxPerDay
    if (notifPrefs.maxPerDay !== undefined) {
      if (typeof notifPrefs.maxPerDay !== 'number') {
        return 'notificationPreferences.maxPerDay must be a number.';
      }
      if (notifPrefs.maxPerDay < 0 || notifPrefs.maxPerDay > 10) {
        return 'notificationPreferences.maxPerDay must be between 0 and 10.';
      }
    }

    // Validate minGapMinutes
    if (notifPrefs.minGapMinutes !== undefined) {
      if (typeof notifPrefs.minGapMinutes !== 'number') {
        return 'notificationPreferences.minGapMinutes must be a number.';
      }
      if (notifPrefs.minGapMinutes < 0 || notifPrefs.minGapMinutes > 1440) {
        return 'notificationPreferences.minGapMinutes must be between 0 and 1440 (24 hours).';
      }
    }

    // Validate time strings (HH:mm format)
    const timeFields = [
      'progress.dailySummaryTime',
      'progress.weeklyPlanningTime',
      'doNotDisturb.startTime',
      'doNotDisturb.endTime',
    ];

    for (const field of timeFields) {
      const value = getNestedValue(notifPrefs, field);
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string') {
          return `${field} must be a string.`;
        }
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return `${field} must be in HH:mm format (e.g., "14:30").`;
        }
      }
    }
  }

  return null;
}

/**
 * Helper function to get nested object value by path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
