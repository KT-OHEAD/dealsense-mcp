/**
 * 뽐뿌 RSS feed integration
 * Public RSS feed - no authentication needed
 *
 * RSS URL: https://www.ppomppu.co.kr/rss.php?id=ppomppu
 */

import Parser from 'rss-parser';

interface PpomppuItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
}

const parser = new Parser<{ items: PpomppuItem[] }>();

export async function fetchPpomppuDeals() {
  try {
    const feed = await parser.parseURL('https://www.ppomppu.co.kr/rss.php?id=ppomppu');

    return feed.items.map((item) => {
      const { price, merchant } = extractPriceAndMerchant(item.title);

      return {
        title: cleanTitle(item.title),
        url: item.link,
        price_current: price,
        price_original: null, // RSS doesn't provide original price
        merchant: merchant || '뽐뿌',
        source: 'community' as const,
        category: '기타',
        posted_at: item.pubDate || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Ppomppu RSS fetch error:', error);
    return [];
  }
}

/**
 * Extract price and merchant from title
 * Example: "[쿠팡] 삼성 갤럭시 버즈 39,000원"
 */
function extractPriceAndMerchant(title: string): { price: number; merchant: string | null } {
  // Extract merchant from brackets
  const merchantMatch = title.match(/\[(.*?)\]/);
  const merchant = merchantMatch ? merchantMatch[1] : null;

  // Extract price (숫자 + 원 pattern)
  const priceMatch = title.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

  return { price, merchant };
}

/**
 * Clean title by removing merchant tag and extra spaces
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\[.*?\]\s*/, '') // Remove [merchant]
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .substring(0, 120); // Limit length
}

/**
 * Fetch and filter by minimum discount
 */
export async function fetchPpomppuHighDiscountDeals(minPrice = 10000) {
  const deals = await fetchPpomppuDeals();

  return deals.filter((deal) => deal.price_current >= minPrice);
}
