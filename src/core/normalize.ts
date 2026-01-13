/**
 * Normalize title by removing noise words and standardizing format
 */
export function normalizeTitle(title: string): string {
  const noiseWords = [
    '무료배송',
    '당일배송',
    '특가',
    '핫딜',
    '쿠폰',
    '세일',
    '할인',
    '오늘만',
    '마감임박',
    '최저가',
  ];

  let normalized = title.toLowerCase();

  // Remove noise words
  for (const word of noiseWords) {
    normalized = normalized.replace(new RegExp(word, 'gi'), '');
  }

  // Remove special characters except Korean, English, numbers
  normalized = normalized.replace(/[^\w\sㄱ-ㅎ가-힣]/g, '');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Extract brand hints from title/merchant
 */
export function extractBrands(text: string): string[] {
  const brands: string[] = [];
  const commonBrands = [
    '삼성',
    '애플',
    'Apple',
    'LG',
    '나이키',
    'Nike',
    '아디다스',
    'Adidas',
    '코카콜라',
    '네이버',
    '카카오',
  ];

  const lower = text.toLowerCase();
  for (const brand of commonBrands) {
    if (lower.includes(brand.toLowerCase())) {
      brands.push(brand);
    }
  }

  return brands;
}

/**
 * Parse price band for fingerprinting (round to 5000 won)
 */
export function getPriceBand(price: number): number {
  return Math.round(price / 5000) * 5000;
}

/**
 * Create summary text from profile
 */
export function createProfileSummary(profile: {
  categories: string[];
  keywords: string[];
  brands: string[];
  price_max: number | null;
  min_discount_rate: number | null;
  exclude_keywords: string[];
}): string {
  const parts: string[] = [];

  if (profile.categories.length > 0) {
    parts.push(`Categories: ${profile.categories.join(', ')}`);
  }

  if (profile.keywords.length > 0) {
    parts.push(`Keywords: ${profile.keywords.join(', ')}`);
  }

  if (profile.brands.length > 0) {
    parts.push(`Brands: ${profile.brands.join(', ')}`);
  }

  if (profile.price_max !== null) {
    parts.push(`Max price: ${profile.price_max.toLocaleString()}원`);
  }

  if (profile.min_discount_rate !== null) {
    parts.push(`Min discount: ${profile.min_discount_rate}%`);
  }

  if (profile.exclude_keywords.length > 0) {
    parts.push(`Excluding: ${profile.exclude_keywords.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No filters set';
}
