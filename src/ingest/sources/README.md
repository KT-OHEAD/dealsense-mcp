# Adding Data Sources

This directory is for implementing custom deal ingestion sources.

## Overview

DealSense MCP is designed to work with various deal sources. To add a new source:

1. **Create a source file**: e.g., `mySource.ts`
2. **Implement fetch logic**: Retrieve deals from API, RSS, or scraping
3. **Normalize to common schema**: Map to `DealRecord` format
4. **Generate fingerprint**: Use `generateFingerprint()` for deduplication
5. **Calculate scores**: Use `calculateTrustScore()` or set manually
6. **Insert to DB**: Use `insertDeal()` from `dealsRepo`

## Example Source Template

```typescript
import { insertDeal, type DealRecord } from '../storage/dealsRepo.js';
import { generateFingerprint } from '../core/dedupe.js';
import { calculateTrustScore } from '../core/scoring.js';

export async function ingestFromMySource(): Promise<void> {
  // 1. Fetch raw deals (example: from API)
  const rawDeals = await fetchFromAPI();

  // 2. Normalize and insert
  for (const raw of rawDeals) {
    const deal: DealRecord = {
      deal_id: `d_${raw.id}`,
      title: raw.title.substring(0, 120),
      price_current: raw.price,
      price_original: raw.original_price,
      discount_rate: calculateDiscount(raw.price, raw.original_price),
      source: 'community', // or 'shop', 'manual'
      merchant: raw.seller,
      url: raw.link,
      category: mapCategory(raw.category),
      posted_at: new Date(raw.timestamp).toISOString(),
      fingerprint: '', // will set below
      popularity_score: raw.views / 10000, // normalize
      trust_score: 0, // will calculate below
      extra_json: JSON.stringify({ /* additional data */ }),
    };

    deal.fingerprint = generateFingerprint(deal);
    deal.trust_score = calculateTrustScore(deal);

    insertDeal(deal);
  }
}
```

## Scheduling Ingestion

For production use, run ingest functions via cron or scheduled jobs (e.g., every 30 minutes).

## Notes

- Keep ingestion separate from MCP tool handlers (no external calls in tools)
- Use fingerprinting for automatic deduplication
- Respect rate limits and terms of service for external sources
