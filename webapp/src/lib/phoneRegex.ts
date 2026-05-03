// lib/phoneRegex.ts

export type Country = 'GH' | 'NG' | 'KE' | 'ZA' | 'US' | 'UK' | 'GLOBAL';

export const COUNTRY_LABELS: Record<Country, string> = {
  GH: '🇬🇭 Ghana',
  NG: '🇳🇬 Nigeria',
  KE: '🇰🇪 Kenya',
  ZA: '🇿🇦 South Africa',
  US: '🇺🇸 USA/Canada',
  UK: '🇬🇧 United Kingdom',
  GLOBAL: '🌐 Global',
};

export function getPhoneRegex(country: Country): RegExp {
  switch (country) {
    case 'GH':
      // All Ghanaian networks: MTN (024,025,053,054,055,059)
      // Telecel (020,050), AT (026,027,056,057), Glo (023), Expresso (028)
      // Supports: 0XXXXXXXXX, +233XXXXXXXXX, 00233XXXXXXXXX
      // Also handles spaces and hyphens: 024 412 3456, 054-123-4567
      return /(?:\+233|00233|0)[25][0-9]{1,2}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
    case 'NG':
      // Nigeria: +234, 0 followed by 7xx/8xx/9xx
      return /(?:\+234|00234|0)[789][01][0-9][-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
    case 'KE':
      // Kenya: +254, 07xx or 01xx
      return /(?:\+254|00254|0)[71][0-9]{1,2}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3,4}/g;
    case 'ZA':
      // South Africa: +27, 0 followed by 6x/7x/8x
      return /(?:\+27|0027|0)[678][0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    case 'US':
      // USA/Canada: +1, 10-digit
      return /(?:\+1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    case 'UK':
      // UK: +44
      return /(?:\+44|0044|0)[1-9][0-9]{2,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
    case 'GLOBAL':
    default:
      // Generic international format
      return /(?:\+?[0-9]{1,3}[-.\s]?)?\(?[0-9]{2,4}\)?[-.\s]?[0-9]{3,5}[-.\s]?[0-9]{3,6}/g;
  }
}

export function extractPhoneNumbers(text: string, country: Country): string[] {
  const regex = getPhoneRegex(country);
  const matches = text.match(regex) || [];
  // Normalize: remove extra spaces and deduplicate
  const cleaned = matches.map(n => n.replace(/\s+/g, ' ').trim());
  return [...new Set(cleaned)];
}
