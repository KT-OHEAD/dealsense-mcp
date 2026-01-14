/**
 * Naver Shopping API integration
 * Free tier: 25,000 requests/day
 *
 * Setup:
 * 1. Visit https://developers.naver.com/
 * 2. Create application
 * 3. Get Client ID and Secret
 * 4. Set environment variables:
 *    NAVER_CLIENT_ID=your_client_id
 *    NAVER_CLIENT_SECRET=your_client_secret
 */

import axios from 'axios';

interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;  // Low price (할인가)
  hprice: string;  // High price (정가)
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

export async function fetchNaverDeals(query: string, options = { display: 100 }) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Naver API credentials not configured');
  }

  try {
    const response = await axios.get<{ items: NaverShoppingItem[] }>(
      'https://openapi.naver.com/v1/search/shop.json',
      {
        params: {
          query,
          display: Math.min(options.display, 100), // Max 100 per request
          sort: 'date', // Sort by newest
        },
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    );

    return response.data.items.map((item) => {
      const priceCurrent = parseInt(item.lprice);
      const priceOriginal = item.hprice ? parseInt(item.hprice) : null;

      return {
        title: cleanHtmlTags(item.title),
        price_current: priceCurrent,
        price_original: priceOriginal,
        merchant: item.mallName,
        url: item.link,
        category: item.category1 || '기타',
        source: 'shop' as const,
        posted_at: new Date().toISOString(),
        image: item.image,
        brand: item.brand || item.maker,
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Naver API error:', error.response?.data);
    }
    throw error;
  }
}

/**
 * Remove HTML tags from Naver API response
 */
function cleanHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Search for deals with discount filter
 */
export async function fetchNaverDiscountDeals(query: string, minDiscountRate = 30) {
  const deals = await fetchNaverDeals(query);

  return deals.filter((deal) => {
    if (!deal.price_original) return false;
    const discountRate =
      ((deal.price_original - deal.price_current) / deal.price_original) * 100;
    return discountRate >= minDiscountRate;
  });
}

/**
 * Fetch best sellers (high discount items)
 */
export async function fetchNaverBestDeals() {
  const keywords = ['특가', '할인', '핫딜', '세일'];
  const allDeals = [];

  for (const keyword of keywords) {
    const deals = await fetchNaverDeals(keyword, { display: 50 });
    allDeals.push(...deals);

    // Rate limiting: wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allDeals;
}
