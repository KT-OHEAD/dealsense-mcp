# DealSense MCP

**Remote MCP server for hot deal aggregation with normalization, deduplication, and risk assessment**

DealSense provides intelligent deal recommendations through the Model Context Protocol. Instead of simple web search results, it offers:

- **Normalization**: Standardized deal format across sources
- **Deduplication**: Fingerprint-based removal of duplicate deals
- **Risk Assessment**: Trust scores and warnings for each deal
- **Explainable Recommendations**: Clear reasons why each deal matches your interests

## Why Not Just Web Search?

Web search returns raw, unstructured results. DealSense adds value through:

1. **Normalization**: Converts deals from various formats into consistent, structured data
2. **Deduplication**: Removes duplicate listings using intelligent fingerprinting (title normalization + merchant + price band)
3. **Trust Signals**: Analyzes patterns to detect risks (refurbs, variable pricing, shipping fees, availability issues)
4. **Match Explanation**: Provides specific reasons why each deal matches your profile (category, keywords, brands, discount threshold)
5. **Fast Response**: Pre-aggregated cache ensures sub-second response times (no real-time scraping)

## Tools Provided

### Interest Profile Management

1. **`interests.upsert`** - Create/update interest profile
   - Input: categories, keywords, brands, price_max, min_discount_rate, exclude_keywords
   - Output: profile_id and normalized settings

2. **`interests.list`** - List saved profiles
   - Input: optional profile_id filter
   - Output: all matching profiles with summaries

3. **`interests.delete`** - Delete a profile
   - Input: profile_id
   - Output: confirmation status

### Deal Discovery

4. **`deals.hot10`** - Top 10 trending deals
   - Input: window ("24h" or "7d"), sort ("popularity" or "discount")
   - Output: 10 deals with scores and risk notes

5. **`deals.by_interests`** - Personalized recommendations
   - Input: profile_id, limit (default 20, max 30), dedupe flag
   - Output: Scored deals matching profile criteria with explanations

6. **`deals.get`** - Detailed deal information
   - Input: deal_id
   - Output: Full deal details including conditions, shipping info

### Trust & Verification

7. **`deals.verify`** - Assess deal trustworthiness
   - Input: deal_id, url, or title (at least one required)
   - Output: trust_score, warnings, risk_level, notes

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone or download this repository
cd dealsense-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
PORT=3000
DATABASE_PATH=./data/deals.db

# Optional security
# API_KEY=your-secret-key
# ALLOWED_ORIGINS=https://example.com

# Optional rate limiting (disabled by default)
# RATE_LIMIT_ENABLED=false
# RATE_LIMIT_MAX=60
# RATE_LIMIT_WINDOW_MS=60000
```

### Development Mode

```bash
npm run dev
```

## Testing with MCP Inspector

Install MCP Inspector:

```bash
npm install -g @modelcontextprotocol/inspector
```

Connect to your server:

```bash
mcp-inspector http://localhost:3000/mcp
```

Or connect to deployed instance:

```bash
mcp-inspector https://your-domain.com/mcp
```

### Test Each Tool

1. **List available tools** - Should show 7 tools
2. **Create a profile**: Call `interests.upsert`
   ```json
   {
     "categories": ["캠핑"],
     "keywords": ["텐트", "침낭"],
     "price_max": 50000,
     "exclude_keywords": ["중고"]
   }
   ```
3. **Get recommendations**: Call `deals.by_interests` with returned profile_id
4. **Check hot deals**: Call `deals.hot10` with window "24h"
5. **Verify a deal**: Call `deals.verify` with a deal_id from results

## API Examples

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "uptimeSec": 123
}
```

### MCP Protocol

DealSense uses the MCP protocol over HTTP. For direct testing, use the MCP Inspector (recommended) rather than raw HTTP calls, as the protocol involves JSON-RPC message framing.

If using API_KEY authentication:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3000/mcp
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t dealsense-mcp .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_PATH=/app/data/deals.db \
  -v $(pwd)/data:/app/data \
  dealsense-mcp
```

### Render.com (Free Tier)

1. Create a new Web Service
2. Connect your Git repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables (PORT is auto-set by Render)
6. Deploy

**Note**: Free tier has cold starts (~30s) and may sleep after inactivity.

### Fly.io

```bash
# Install flyctl
brew install flyctl

# Login and launch
fly launch

# Deploy
fly deploy
```

### Railway

1. Create new project from GitHub repo
2. Railway auto-detects Node.js and builds
3. Add environment variables in dashboard
4. Deploy automatically on push

## Performance & Constraints

- **Response Time**: <500ms average (cached queries)
- **Response Size**: All responses < 24KB (enforced limits)
- **External Calls**: Zero per tool invocation (pre-aggregated data)
- **Rate Limiting**: Optional, memory-based (60 req/min/IP default)

### List Size Limits

- `deals.hot10`: Always 10 items
- `deals.by_interests`: Max 30 items (clamped)
- `why_recommended`: Max 5 reasons per deal
- `risk_note`: Max 140 characters
- `notes`: Max 3 items

## Data Model

### Profile

```typescript
{
  profile_id: string,
  categories: string[],
  keywords: string[],
  brands: string[],
  price_max: number | null,
  min_discount_rate: number | null,
  exclude_keywords: string[]
}
```

### Deal

```typescript
{
  deal_id: string,
  title: string,           // max 120 chars
  price_current: number,
  price_original: number | null,
  discount_rate: number | null,
  source: "community" | "shop" | "manual",
  merchant: string,
  url: string,
  category: string,
  posted_at: string,       // ISO 8601
  score: {
    popularity: number,    // 0-1
    trust: number,         // 0-1
    match?: number         // 0-1 (only in by_interests)
  },
  why_recommended: string[],
  risk_note: string | null
}
```

## Security

### DNS Rebinding Protection

Set `ALLOWED_ORIGINS` to whitelist permitted origins:

```env
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

Requests from unlisted origins receive 403 Forbidden.

### API Key Authentication

Enable with:

```env
API_KEY=your-secret-key-here
```

Clients must include header:

```
X-API-Key: your-secret-key-here
```

### Rate Limiting

Optional memory-based limiting:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
```

Exceeding limit returns 429 Too Many Requests.

## Architecture

### Stateless Design

- No server-side sessions or cookies
- Profile IDs stored in database, not memory
- Each request is independent
- Horizontally scalable

### Scoring Algorithm

**Match Score** (0-1):
- Category match: +0.4
- Keyword matches: up to +0.4 (proportional)
- Brand match: +0.2
- Exclude keywords: immediate 0

**Trust Score** (0-1):
- Base: 1.0
- Risk keywords (옵션, 중고, etc.): -0.15 to -0.3
- Trusted domains: +0.1
- Age penalty: -0.1 to -0.2 (>3 days old)

**Combined Score**:
- 50% match, 30% trust, 20% popularity

### Deduplication

Fingerprint = `normalize(title) + merchant + price_band`

- Title normalization: remove noise words, lowercase, strip special chars
- Price band: round to 5,000 KRW
- Groups with same fingerprint → keep highest combined score

## Extending DealSense

### Adding Data Sources

See `src/ingest/sources/README.md` for guide on implementing custom sources.

Key steps:
1. Fetch deals from source (API, RSS, scrape)
2. Normalize to `DealRecord` schema
3. Generate fingerprint and trust score
4. Insert to database

Run ingestion separately (cron/scheduler), not in tool handlers.

### Sample Data

Included seed data (50+ deals, 2 profiles) for testing. Auto-seeded on first run.

Categories: 캠핑, 주방, 테크, 생활, 육아, 패션

## Troubleshooting

**Database locked error**:
- Check DATABASE_PATH permissions
- Ensure directory exists
- SQLite WAL mode is enabled

**Origin forbidden**:
- Check ALLOWED_ORIGINS matches request origin
- Leave empty to allow all (dev only)

**401 Unauthorized**:
- Verify API_KEY matches X-API-Key header
- Remove API_KEY to disable auth

**Tools not appearing in Inspector**:
- Confirm server is running (`/health` returns 200)
- Check MCP endpoint URL is correct
- Review server logs for errors

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- TypeScript strict mode compliance
- All tools respond < 500ms
- Response size < 24KB
- No external HTTP calls in tool handlers
- Tests pass with MCP Inspector
