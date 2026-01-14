/**
 * Data ingestion scheduler
 * Run this as a separate process or cron job
 */

import { fetchNaverDeals } from './sources/naverShopping.js';
import { fetchPpomppuDeals } from './sources/ppomppuRSS.js';
import { insertDeal } from '../storage/dealsRepo.js';
import { generateFingerprint } from '../core/dedupe.js';
import { calculateTrustScore } from '../core/scoring.js';

const CATEGORIES = ['캠핑', '주방', '테크', '생활', '육아', '패션'];

export async function runIngestion() {
  console.log('[Ingestion] Starting data collection...');

  const allDeals = [];

  // 1. Naver Shopping API (official)
  if (process.env.NAVER_CLIENT_ID) {
    for (const category of CATEGORIES) {
      try {
        const deals = await fetchNaverDeals(category);
        allDeals.push(...deals);
        console.log(`[Naver] Fetched ${deals.length} deals for ${category}`);
      } catch (error) {
        console.error(`[Naver] Error for ${category}:`, error);
      }
    }
  }

  // 2. Community RSS (legal, public)
  try {
    const ppomppu = await fetchPpomppuDeals();
    allDeals.push(...ppomppu);
    console.log(`[Ppomppu] Fetched ${ppomppu.length} deals`);
  } catch (error) {
    console.error('[Ppomppu] Error:', error);
  }

  // 3. Normalize and store
  for (const deal of allDeals) {
    const normalized = normalizeDeal(deal);
    normalized.fingerprint = generateFingerprint(normalized);
    normalized.trust_score = calculateTrustScore(normalized);

    try {
      insertDeal(normalized);
    } catch (error) {
      // Skip duplicates
      if (!error.message.includes('UNIQUE constraint')) {
        console.error('[DB] Insert error:', error);
      }
    }
  }

  console.log(`[Ingestion] Completed. Total processed: ${allDeals.length}`);
}

function normalizeDeal(raw: any) {
  // Convert raw data to DealRecord format
  return {
    deal_id: `d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: raw.title.substring(0, 120),
    price_current: raw.price_current || 0,
    price_original: raw.price_original,
    discount_rate: calculateDiscountRate(raw.price_current, raw.price_original),
    source: raw.source || 'shop',
    merchant: raw.merchant || 'Unknown',
    url: raw.url,
    category: raw.category || '기타',
    posted_at: raw.posted_at || new Date().toISOString(),
    fingerprint: '',
    popularity_score: Math.random() * 0.5 + 0.3, // Will be updated later
    trust_score: 0,
    extra_json: JSON.stringify({}),
  };
}

function calculateDiscountRate(current: number, original: number | null): number | null {
  if (!original || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
}

// Run immediately if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestion().then(() => process.exit(0));
}
