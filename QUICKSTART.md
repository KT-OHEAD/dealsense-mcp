# DealSense MCP - Quick Start Guide

## Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Start the server
npm start
```

Server will start on http://localhost:3000

## Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Expected output:
# {"status":"ok","uptimeSec":123}
```

## Testing with MCP Inspector

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Connect to your server
mcp-inspector http://localhost:3000/mcp
```

## Example Tool Calls (via Inspector)

### 1. Create Interest Profile

Tool: `interests.upsert`

Input:
```json
{
  "categories": ["캠핑", "아웃도어"],
  "keywords": ["텐트", "침낭"],
  "brands": ["코베아"],
  "price_max": 50000,
  "exclude_keywords": ["중고", "리퍼"]
}
```

Output will include a `profile_id` (e.g., "p_abc123...")

### 2. Get Hot Deals

Tool: `deals.hot10`

Input:
```json
{
  "window": "24h",
  "sort": "popularity"
}
```

Returns top 10 trending deals.

### 3. Get Personalized Recommendations

Tool: `deals.by_interests`

Input:
```json
{
  "profile_id": "p_abc123...",
  "limit": 20,
  "dedupe": true
}
```

Returns deals matching your profile with:
- Match scores
- Why recommended (explanations)
- Risk notes
- Trust scores

### 4. Verify a Deal

Tool: `deals.verify`

Input (using deal from previous results):
```json
{
  "deal_id": "d_0001"
}
```

Returns trust assessment with warnings and risk level.

## Development Mode

For auto-reload during development:

```bash
npm run dev
```

## Database

SQLite database is created at `./data/deals.db`

Includes 50+ sample deals across categories:
- 캠핑 (Camping)
- 주방 (Kitchen)
- 테크 (Tech)
- 생활 (Lifestyle)
- 육아 (Parenting)
- 패션 (Fashion)

## Environment Variables

Copy `.env.example` to `.env` to customize:

```env
PORT=3000
DATABASE_PATH=./data/deals.db

# Optional security
# API_KEY=your-secret-key
# ALLOWED_ORIGINS=https://example.com
```

## Deployment

See main README.md for:
- Docker deployment
- Render.com (free tier)
- Fly.io
- Railway

## Architecture Highlights

✅ **Stateless**: No sessions, profile IDs stored in database
✅ **Fast**: <500ms response time, cached queries
✅ **Secure**: Origin validation, API key auth (optional)
✅ **Smart**: Deduplication, trust scoring, match explanations
✅ **Standard**: Full MCP protocol compliance

## Need Help?

- Read the comprehensive [README.md](./README.md)
- Check tool definitions in `src/tools/`
- Review scoring logic in `src/core/scoring.ts`
- Understand deduplication in `src/core/dedupe.ts`

## What Makes This Different from Web Search?

1. **Normalization**: Standardized format across all sources
2. **Deduplication**: Fingerprint-based removal of duplicates
3. **Trust Signals**: Risk pattern detection and scoring
4. **Match Explanation**: Clear reasons for each recommendation
5. **No Real-time Scraping**: Sub-second responses from cache

---

Built for PlayMCP submission - Ready for production deployment!
