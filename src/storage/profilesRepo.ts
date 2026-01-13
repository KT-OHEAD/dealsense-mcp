import { getDatabase } from './db.js';
import { randomBytes } from 'crypto';

export interface ProfileRecord {
  profile_id: string;
  categories: string[];
  keywords: string[];
  brands: string[];
  price_max: number | null;
  min_discount_rate: number | null;
  exclude_keywords: string[];
  created_at: string;
  updated_at: string;
}

function generateProfileId(): string {
  return 'p_' + randomBytes(8).toString('hex');
}

export function upsertProfile(input: {
  profile_id?: string | null;
  categories: string[];
  keywords: string[];
  brands: string[];
  price_max: number | null | undefined;
  min_discount_rate: number | null | undefined;
  exclude_keywords: string[];
}): ProfileRecord {
  const db = getDatabase();
  const now = new Date().toISOString();

  const profile_id = input.profile_id || generateProfileId();

  const existing = db
    .prepare('SELECT * FROM profiles WHERE profile_id = ?')
    .get(profile_id) as any;

  const record: ProfileRecord = {
    profile_id,
    categories: input.categories,
    keywords: input.keywords,
    brands: input.brands,
    price_max: input.price_max ?? null,
    min_discount_rate: input.min_discount_rate ?? null,
    exclude_keywords: input.exclude_keywords,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO profiles (
      profile_id, categories, keywords, brands, price_max,
      min_discount_rate, exclude_keywords, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile_id) DO UPDATE SET
      categories = excluded.categories,
      keywords = excluded.keywords,
      brands = excluded.brands,
      price_max = excluded.price_max,
      min_discount_rate = excluded.min_discount_rate,
      exclude_keywords = excluded.exclude_keywords,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    record.profile_id,
    JSON.stringify(record.categories),
    JSON.stringify(record.keywords),
    JSON.stringify(record.brands),
    record.price_max,
    record.min_discount_rate,
    JSON.stringify(record.exclude_keywords),
    record.created_at,
    record.updated_at
  );

  return record;
}

export function getProfile(profile_id: string): ProfileRecord | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM profiles WHERE profile_id = ?')
    .get(profile_id) as any;

  if (!row) return null;

  return {
    profile_id: row.profile_id,
    categories: JSON.parse(row.categories),
    keywords: JSON.parse(row.keywords),
    brands: JSON.parse(row.brands),
    price_max: row.price_max,
    min_discount_rate: row.min_discount_rate,
    exclude_keywords: JSON.parse(row.exclude_keywords),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listProfiles(profile_id?: string | null): ProfileRecord[] {
  const db = getDatabase();

  let rows: any[];
  if (profile_id) {
    rows = db
      .prepare('SELECT * FROM profiles WHERE profile_id = ? ORDER BY updated_at DESC')
      .all(profile_id);
  } else {
    rows = db.prepare('SELECT * FROM profiles ORDER BY updated_at DESC').all();
  }

  return rows.map((row) => ({
    profile_id: row.profile_id,
    categories: JSON.parse(row.categories),
    keywords: JSON.parse(row.keywords),
    brands: JSON.parse(row.brands),
    price_max: row.price_max,
    min_discount_rate: row.min_discount_rate,
    exclude_keywords: JSON.parse(row.exclude_keywords),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function deleteProfile(profile_id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM profiles WHERE profile_id = ?').run(profile_id);
  return result.changes > 0;
}
