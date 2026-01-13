import { normalizeTitle, getPriceBand } from './normalize.js';

/**
 * Generate fingerprint for deduplication
 */
export function generateFingerprint(deal: {
  title: string;
  merchant: string;
  price_current: number;
}): string {
  const normalizedTitle = normalizeTitle(deal.title);
  const priceBand = getPriceBand(deal.price_current);
  const merchantNorm = deal.merchant.toLowerCase().replace(/\s+/g, '');

  return `${normalizedTitle}|${merchantNorm}|${priceBand}`;
}

/**
 * Deduplicate deals by fingerprint, keeping best match
 */
export function deduplicateDeals<T extends { fingerprint: string }>(
  deals: T[],
  scoreFunc: (deal: T) => number
): T[] {
  const groups = new Map<string, T[]>();

  // Group by fingerprint
  for (const deal of deals) {
    const existing = groups.get(deal.fingerprint) || [];
    existing.push(deal);
    groups.set(deal.fingerprint, existing);
  }

  // Pick best from each group
  const result: T[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Sort by score (descending)
      group.sort((a, b) => scoreFunc(b) - scoreFunc(a));
      result.push(group[0]);
    }
  }

  return result;
}
