// src/lib/countries.ts — International phone country list (ISO2 + dial code + flag).
// No external dependencies/CDN; flags are emoji. E.164 output: `+<dial><national number>`.
// Comprehensive but curated list (no libphonenumber-level country-specific length validation —
// actual validation is done server-side with E.164 format + field settings).
export interface Country {
  iso2: string;
  name: string;
  dial: string; // country code (excluding +)
  flag: string;
}

export const COUNTRIES: Country[] = [
  { iso2: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷' },
  { iso2: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { iso2: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { iso2: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { iso2: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { iso2: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱' },
  { iso2: 'BE', name: 'Belgium', dial: '32', flag: '🇧🇪' },
  { iso2: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹' },
  { iso2: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸' },
  { iso2: 'PT', name: 'Portugal', dial: '351', flag: '🇵🇹' },
  { iso2: 'CH', name: 'Switzerland', dial: '41', flag: '🇨🇭' },
  { iso2: 'AT', name: 'Austria', dial: '43', flag: '🇦🇹' },
  { iso2: 'SE', name: 'Sweden', dial: '46', flag: '🇸🇪' },
  { iso2: 'NO', name: 'Norway', dial: '47', flag: '🇳🇴' },
  { iso2: 'DK', name: 'Denmark', dial: '45', flag: '🇩🇰' },
  { iso2: 'FI', name: 'Finland', dial: '358', flag: '🇫🇮' },
  { iso2: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪' },
  { iso2: 'PL', name: 'Poland', dial: '48', flag: '🇵🇱' },
  { iso2: 'CZ', name: 'Czechia', dial: '420', flag: '🇨🇿' },
  { iso2: 'GR', name: 'Greece', dial: '30', flag: '🇬🇷' },
  { iso2: 'RO', name: 'Romania', dial: '40', flag: '🇷🇴' },
  { iso2: 'BG', name: 'Bulgaria', dial: '359', flag: '🇧🇬' },
  { iso2: 'HU', name: 'Hungary', dial: '36', flag: '🇭🇺' },
  { iso2: 'RU', name: 'Russia', dial: '7', flag: '🇷🇺' },
  { iso2: 'UA', name: 'Ukraine', dial: '380', flag: '🇺🇦' },
  { iso2: 'AZ', name: 'Azerbaijan', dial: '994', flag: '🇦🇿' },
  { iso2: 'GE', name: 'Georgia', dial: '995', flag: '🇬🇪' },
  { iso2: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { iso2: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦' },
  { iso2: 'QA', name: 'Qatar', dial: '974', flag: '🇶🇦' },
  { iso2: 'KW', name: 'Kuwait', dial: '965', flag: '🇰🇼' },
  { iso2: 'IL', name: 'Israel', dial: '972', flag: '🇮🇱' },
  { iso2: 'EG', name: 'Egypt', dial: '20', flag: '🇪🇬' },
  { iso2: 'MA', name: 'Morocco', dial: '212', flag: '🇲🇦' },
  { iso2: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
  { iso2: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬' },
  { iso2: 'IN', name: 'India', dial: '91', flag: '🇮🇳' },
  { iso2: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰' },
  { iso2: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
  { iso2: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵' },
  { iso2: 'KR', name: 'South Korea', dial: '82', flag: '🇰🇷' },
  { iso2: 'ID', name: 'Indonesia', dial: '62', flag: '🇮🇩' },
  { iso2: 'MY', name: 'Malaysia', dial: '60', flag: '🇲🇾' },
  { iso2: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬' },
  { iso2: 'TH', name: 'Thailand', dial: '66', flag: '🇹🇭' },
  { iso2: 'VN', name: 'Vietnam', dial: '84', flag: '🇻🇳' },
  { iso2: 'PH', name: 'Philippines', dial: '63', flag: '🇵🇭' },
  { iso2: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺' },
  { iso2: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿' },
  { iso2: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { iso2: 'MX', name: 'Mexico', dial: '52', flag: '🇲🇽' },
  { iso2: 'BR', name: 'Brazil', dial: '55', flag: '🇧🇷' },
  { iso2: 'AR', name: 'Argentina', dial: '54', flag: '🇦🇷' },
  { iso2: 'CL', name: 'Chile', dial: '56', flag: '🇨🇱' },
  { iso2: 'CO', name: 'Colombia', dial: '57', flag: '🇨🇴' },
];

export function findCountry(iso2?: string): Country {
  const c = COUNTRIES.find((x) => x.iso2 === (iso2 ?? '').toUpperCase());
  return c ?? COUNTRIES[0]; // default
}

// E.164 merge: dial + digits-only national number. Leading 0 is stripped.
export function toE164(dial: string, national: string): string {
  const digits = (national ?? '').replace(/\D/g, '').replace(/^0+/, '');
  return digits ? `+${dial}${digits}` : '';
}

// Split E.164 value (if any) into country + national number (by matching dial).
export function splitE164(
  value: string,
  fallbackIso2?: string,
): { iso2: string; national: string } {
  const v = (value ?? '').trim();
  if (v.startsWith('+')) {
    const digits = v.slice(1);
    // Select the longest matching dial code (e.g. 90 vs 9).
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => digits.startsWith(c.dial));
    if (match) {
      return { iso2: match.iso2, national: digits.slice(match.dial.length) };
    }
  }
  return { iso2: findCountry(fallbackIso2).iso2, national: v.replace(/^\+/, '') };
}
