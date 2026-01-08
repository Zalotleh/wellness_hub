/**
 * Country data for localization and user preferences
 * Includes common countries with ISO codes and timezones
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2 code
  name: string;
  flag: string; // Emoji flag
  timezones: string[]; // Common IANA timezones
}

export const COUNTRIES: Country[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    timezones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    timezones: ['Europe/London'],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    timezones: [
      'America/St_Johns',
      'America/Halifax',
      'America/Toronto',
      'America/Winnipeg',
      'America/Edmonton',
      'America/Vancouver',
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    timezones: [
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Adelaide',
      'Australia/Perth',
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    timezones: ['Europe/Berlin'],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    timezones: ['Europe/Paris'],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    timezones: ['Europe/Madrid'],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    timezones: ['Europe/Rome'],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    timezones: ['Europe/Amsterdam'],
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    timezones: ['Europe/Stockholm'],
  },
  {
    code: 'NO',
    name: 'Norway',
    flag: '🇳🇴',
    timezones: ['Europe/Oslo'],
  },
  {
    code: 'DK',
    name: 'Denmark',
    flag: '🇩🇰',
    timezones: ['Europe/Copenhagen'],
  },
  {
    code: 'FI',
    name: 'Finland',
    flag: '🇫🇮',
    timezones: ['Europe/Helsinki'],
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    timezones: ['Europe/Dublin'],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    timezones: ['Pacific/Auckland'],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    timezones: ['Asia/Tokyo'],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    timezones: ['Asia/Seoul'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    timezones: ['Asia/Singapore'],
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    timezones: ['Asia/Kolkata'],
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    timezones: ['America/Mexico_City', 'America/Tijuana', 'America/Cancun'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    timezones: ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza'],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    timezones: ['America/Argentina/Buenos_Aires'],
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    timezones: ['America/Santiago'],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    timezones: ['Africa/Johannesburg'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    timezones: ['Asia/Dubai'],
  },
  {
    code: 'IL',
    name: 'Israel',
    flag: '🇮🇱',
    timezones: ['Asia/Jerusalem'],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    timezones: ['Europe/Zurich'],
  },
  {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    timezones: ['Europe/Vienna'],
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    timezones: ['Europe/Brussels'],
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    timezones: ['Europe/Warsaw'],
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    timezones: ['Europe/Lisbon'],
  },
  {
    code: 'GR',
    name: 'Greece',
    flag: '🇬🇷',
    timezones: ['Europe/Athens'],
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    flag: '🇨🇿',
    timezones: ['Europe/Prague'],
  },
  {
    code: 'HU',
    name: 'Hungary',
    flag: '🇭🇺',
    timezones: ['Europe/Budapest'],
  },
  {
    code: 'RO',
    name: 'Romania',
    flag: '🇷🇴',
    timezones: ['Europe/Bucharest'],
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    timezones: ['Asia/Bangkok'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    timezones: ['Asia/Kuala_Lumpur'],
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    timezones: ['Asia/Manila'],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    timezones: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    timezones: ['Asia/Ho_Chi_Minh'],
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    timezones: ['Europe/Istanbul'],
  },
];

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/**
 * Get timezones for a country
 */
export function getTimezonesForCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  return country?.timezones || [];
}

/**
 * Detect user's timezone using browser API
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone:', error);
    return 'UTC';
  }
}

/**
 * Suggest country based on detected timezone
 */
export function suggestCountryFromTimezone(timezone: string): Country | undefined {
  return COUNTRIES.find((country) => country.timezones.includes(timezone));
}
