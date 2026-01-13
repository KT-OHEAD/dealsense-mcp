import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

let db: Database.Database | null = null;

export function initDatabase(dbPath: string): Database.Database {
  if (db) return db;

  // Ensure directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  createTables(db);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function createTables(db: Database.Database): void {
  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      profile_id TEXT PRIMARY KEY,
      categories TEXT NOT NULL,
      keywords TEXT NOT NULL,
      brands TEXT NOT NULL,
      price_max INTEGER,
      min_discount_rate REAL,
      exclude_keywords TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Deals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      deal_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price_current INTEGER NOT NULL,
      price_original INTEGER,
      discount_rate REAL,
      source TEXT NOT NULL,
      merchant TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      posted_at TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      popularity_score REAL NOT NULL,
      trust_score REAL NOT NULL,
      extra_json TEXT NOT NULL
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_posted_at ON deals(posted_at);
    CREATE INDEX IF NOT EXISTS idx_deals_fingerprint ON deals(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
  `);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
