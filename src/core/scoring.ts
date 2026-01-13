import type { Score } from './schema.js';

interface Deal {
  title: string;
  merchant: string;
  url: string;
  price_current: number;
  discount_rate: number | null;
  posted_at: string;
  popularity_score: number;
  trust_score: number;
}

interface Profile {
  categories: string[];
  keywords: string[];
  brands: string[];
  price_max: number | null;
  min_discount_rate: number | null;
  exclude_keywords: string[];
}

/**
 * Calculate match score based on profile
 */
export function calculateMatchScore(
  deal: { title: string; merchant: string; category: string },
  profile: Profile
): number {
  let score = 0;
  const titleLower = deal.title.toLowerCase();
  const merchantLower = deal.merchant.toLowerCase();

  // Exclude keywords check (immediate disqualification)
  for (const keyword of profile.exclude_keywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return 0;
    }
  }

  // Category match (+0.4)
  if (profile.categories.length > 0) {
    for (const cat of profile.categories) {
      if (deal.category.toLowerCase().includes(cat.toLowerCase())) {
        score += 0.4;
        break;
      }
    }
  }

  // Keyword match (up to +0.4)
  if (profile.keywords.length > 0) {
    let keywordMatches = 0;
    for (const keyword of profile.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    score += Math.min(0.4, (keywordMatches / profile.keywords.length) * 0.4);
  }

  // Brand match (+0.2)
  if (profile.brands.length > 0) {
    for (const brand of profile.brands) {
      const brandLower = brand.toLowerCase();
      if (titleLower.includes(brandLower) || merchantLower.includes(brandLower)) {
        score += 0.2;
        break;
      }
    }
  }

  return Math.min(1, score);
}

/**
 * Calculate trust score based on risk patterns
 */
export function calculateTrustScore(deal: Deal): number {
  let score = 1.0;
  const titleLower = deal.title.toLowerCase();
  const urlLower = deal.url.toLowerCase();

  // Risk keywords detection
  const riskPatterns = [
    { keywords: ['옵션', '선택', '추가금'], penalty: 0.15 },
    { keywords: ['품절', '예약'], penalty: 0.2 },
    { keywords: ['랜덤', '무작위'], penalty: 0.25 },
    { keywords: ['리퍼', '리퍼브', '중고'], penalty: 0.3 },
    { keywords: ['해외배송', '배송비별도'], penalty: 0.15 },
  ];

  for (const pattern of riskPatterns) {
    for (const keyword of pattern.keywords) {
      if (titleLower.includes(keyword)) {
        score -= pattern.penalty;
        break;
      }
    }
  }

  // Trusted domains bonus
  const trustedDomains = [
    'coupang.com',
    'naver.com',
    'gmarket.com',
    '11st.co.kr',
    'ssg.com',
    'auction.co.kr',
  ];

  for (const domain of trustedDomains) {
    if (urlLower.includes(domain)) {
      score += 0.1;
      break;
    }
  }

  // Age penalty (deals older than 7 days)
  const postedDate = new Date(deal.posted_at);
  const now = new Date();
  const ageInDays = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays > 7) {
    score -= 0.2;
  } else if (ageInDays > 3) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Check if deal passes profile filters
 */
export function passesFilters(deal: Deal, profile: Profile): boolean {
  // Price filter
  if (profile.price_max !== null && deal.price_current > profile.price_max) {
    return false;
  }

  // Discount rate filter
  if (profile.min_discount_rate !== null) {
    if (deal.discount_rate === null) {
      return false; // Conservative: exclude deals without discount info
    }
    if (deal.discount_rate < profile.min_discount_rate) {
      return false;
    }
  }

  // Exclude keywords
  const titleLower = deal.title.toLowerCase();
  for (const keyword of profile.exclude_keywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Generate why_recommended reasons
 */
export function generateWhyRecommended(
  deal: { title: string; merchant: string; category: string; discount_rate: number | null },
  profile: Profile,
  matchScore: number
): string[] {
  const reasons: string[] = [];

  // Category match
  for (const cat of profile.categories) {
    if (deal.category.toLowerCase().includes(cat.toLowerCase())) {
      reasons.push(`Matches your interest in ${cat}`);
      break;
    }
  }

  // Keyword match
  const titleLower = deal.title.toLowerCase();
  const matchedKeywords: string[] = [];
  for (const keyword of profile.keywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }
  if (matchedKeywords.length > 0) {
    reasons.push(`Contains keywords: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }

  // Brand match
  for (const brand of profile.brands) {
    if (
      titleLower.includes(brand.toLowerCase()) ||
      deal.merchant.toLowerCase().includes(brand.toLowerCase())
    ) {
      reasons.push(`From preferred brand: ${brand}`);
      break;
    }
  }

  // Discount
  if (deal.discount_rate !== null && deal.discount_rate >= 30) {
    reasons.push(`High discount rate: ${deal.discount_rate}%`);
  }

  // Match quality
  if (matchScore >= 0.8) {
    reasons.push('Strong match with your profile');
  }

  return reasons.slice(0, 5);
}

/**
 * Generate risk note
 */
export function generateRiskNote(deal: Deal): string | null {
  const titleLower = deal.title.toLowerCase();
  const risks: string[] = [];

  if (titleLower.includes('옵션') || titleLower.includes('선택')) {
    risks.push('options may vary price');
  }

  if (titleLower.includes('품절') || titleLower.includes('예약')) {
    risks.push('availability uncertain');
  }

  if (titleLower.includes('배송비별도') || titleLower.includes('해외배송')) {
    risks.push('shipping fees may apply');
  }

  if (titleLower.includes('중고') || titleLower.includes('리퍼')) {
    risks.push('refurbished/used item');
  }

  if (risks.length === 0) return null;

  const note = risks.join(', ');
  return note.length > 140 ? note.substring(0, 137) + '...' : note;
}

/**
 * Create score object
 */
export function createScore(
  popularity: number,
  trust: number,
  match?: number
): Score {
  const score: Score = {
    popularity: Math.max(0, Math.min(1, popularity)),
    trust: Math.max(0, Math.min(1, trust)),
  };

  if (match !== undefined) {
    score.match = Math.max(0, Math.min(1, match));
  }

  return score;
}

/**
 * Calculate combined score for sorting
 */
export function calculateCombinedScore(score: Score): number {
  const weights = {
    match: 0.5,
    trust: 0.3,
    popularity: 0.2,
  };

  let combined = 0;

  if (score.match !== undefined) {
    combined += score.match * weights.match;
  }

  combined += score.trust * weights.trust;
  combined += score.popularity * weights.popularity;

  return combined;
}
