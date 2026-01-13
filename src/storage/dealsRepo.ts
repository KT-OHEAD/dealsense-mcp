import { getDatabase } from './db.js';

export interface DealRecord {
  deal_id: string;
  title: string;
  price_current: number;
  price_original: number | null;
  discount_rate: number | null;
  source: 'community' | 'shop' | 'manual';
  merchant: string;
  url: string;
  category: string;
  posted_at: string;
  fingerprint: string;
  popularity_score: number;
  trust_score: number;
  extra_json: string;
}

export function insertDeal(deal: DealRecord): void {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO deals (
      deal_id, title, price_current, price_original, discount_rate,
      source, merchant, url, category, posted_at, fingerprint,
      popularity_score, trust_score, extra_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    deal.deal_id,
    deal.title,
    deal.price_current,
    deal.price_original,
    deal.discount_rate,
    deal.source,
    deal.merchant,
    deal.url,
    deal.category,
    deal.posted_at,
    deal.fingerprint,
    deal.popularity_score,
    deal.trust_score,
    deal.extra_json
  );
}

export function getDeal(deal_id: string): DealRecord | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM deals WHERE deal_id = ?').get(deal_id) as any;

  if (!row) return null;

  return {
    deal_id: row.deal_id,
    title: row.title,
    price_current: row.price_current,
    price_original: row.price_original,
    discount_rate: row.discount_rate,
    source: row.source,
    merchant: row.merchant,
    url: row.url,
    category: row.category,
    posted_at: row.posted_at,
    fingerprint: row.fingerprint,
    popularity_score: row.popularity_score,
    trust_score: row.trust_score,
    extra_json: row.extra_json,
  };
}

export function getDealsInWindow(
  windowHours: number,
  sort: 'popularity' | 'discount',
  limit: number
): DealRecord[] {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  let orderBy = 'popularity_score DESC';
  if (sort === 'discount') {
    orderBy = 'discount_rate DESC NULLS LAST';
  }

  const rows = db
    .prepare(
      `SELECT * FROM deals
       WHERE posted_at >= ?
       ORDER BY ${orderBy}
       LIMIT ?`
    )
    .all(cutoff, limit) as any[];

  return rows.map((row) => ({
    deal_id: row.deal_id,
    title: row.title,
    price_current: row.price_current,
    price_original: row.price_original,
    discount_rate: row.discount_rate,
    source: row.source,
    merchant: row.merchant,
    url: row.url,
    category: row.category,
    posted_at: row.posted_at,
    fingerprint: row.fingerprint,
    popularity_score: row.popularity_score,
    trust_score: row.trust_score,
    extra_json: row.extra_json,
  }));
}

export function getAllDeals(): DealRecord[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM deals ORDER BY posted_at DESC').all() as any[];

  return rows.map((row) => ({
    deal_id: row.deal_id,
    title: row.title,
    price_current: row.price_current,
    price_original: row.price_original,
    discount_rate: row.discount_rate,
    source: row.source,
    merchant: row.merchant,
    url: row.url,
    category: row.category,
    posted_at: row.posted_at,
    fingerprint: row.fingerprint,
    popularity_score: row.popularity_score,
    trust_score: row.trust_score,
    extra_json: row.extra_json,
  }));
}
