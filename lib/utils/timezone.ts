/**
 * Timezone Utilities
 * 
 * Handles date/time conversions for users in different timezones.
 * All dates are stored in UTC at noon (12:00:00) to prevent timezone shifting.
 */

/**
 * Normalize a date to noon UTC
 * This prevents timezone shifting when storing dates in the database
 * 
 * @example
 * // Jan 13, 2026 in any timezone -> 2026-01-13T12:00:00.000Z
 * normalizeToNoonUTC(new Date('2026-01-13'))
 */
export function normalizeToNoonUTC(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

/**
 * Get today's date normalized to noon UTC
 * Use this for all "today" date queries
 */
export function getTodayNoonUTC(): Date {
  return normalizeToNoonUTC(new Date());
}

/**
 * Get user's local date at noon UTC
 * Converts user's timezone date to UTC noon for database storage
 * 
 * @param userTimezone - IANA timezone string (e.g., "America/New_York")
 * @param localDate - Optional date in user's timezone, defaults to today
 */
export function getUserLocalDateNoonUTC(
  userTimezone: string | null | undefined,
  localDate?: Date
): Date {
  const date = localDate || new Date();
  
  if (!userTimezone) {
    // No timezone preference, use current date
    return normalizeToNoonUTC(date);
  }
  
  try {
    // Get user's local date string (YYYY-MM-DD)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    
    // Create UTC date at noon
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  } catch (error) {
    console.error('Error converting user timezone:', error);
    return normalizeToNoonUTC(date);
  }
}

/**
 * Get date range for a specific day in user's timezone
 * Returns [startOfDay, endOfDay] in UTC for database queries
 * 
 * @param userTimezone - IANA timezone string
 * @param date - Optional date, defaults to today
 */
export function getUserDayRangeUTC(
  userTimezone: string | null | undefined,
  date?: Date
): { start: Date; end: Date } {
  const noonUTC = getUserLocalDateNoonUTC(userTimezone, date);
  
  // Start of day: noon UTC - 12 hours = midnight UTC same day
  const start = new Date(noonUTC.getTime() - 12 * 60 * 60 * 1000);
  
  // End of day: noon UTC + 12 hours = midnight UTC next day
  const end = new Date(noonUTC.getTime() + 12 * 60 * 60 * 1000);
  
  return { start, end };
}

/**
 * Format date for display in user's timezone
 * 
 * @param date - UTC date from database
 * @param userTimezone - IANA timezone string
 * @param options - Intl.DateTimeFormat options
 */
export function formatDateInUserTimezone(
  date: Date,
  userTimezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (!userTimezone) {
    return date.toLocaleDateString('en-US', options);
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: userTimezone,
    }).format(date);
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    return date.toLocaleDateString('en-US', options);
  }
}

/**
 * Detect user's timezone from browser
 * Use this on the client side
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'UTC';
  }
}

/**
 * Parse date string from user input
 * Assumes date string is in user's timezone
 * 
 * @param dateString - ISO date string (YYYY-MM-DD) in user's timezone
 * @param userTimezone - IANA timezone string
 */
export function parseDateInUserTimezone(
  dateString: string,
  userTimezone: string | null | undefined
): Date {
  // Parse as YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }
  
  // Create date at noon UTC (month is 0-indexed)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/**
 * Get date string in user's timezone (YYYY-MM-DD)
 * 
 * @param date - UTC date
 * @param userTimezone - IANA timezone string
 */
export function getDateStringInUserTimezone(
  date: Date,
  userTimezone: string | null | undefined
): string {
  if (!userTimezone) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    return formatter.format(date); // Returns YYYY-MM-DD
  } catch (error) {
    console.error('Error getting date string:', error);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
