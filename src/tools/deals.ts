import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  dealHot10InputSchema,
  dealByInterestsInputSchema,
  dealGetInputSchema,
  type DealHot10Input,
  type DealHot10Output,
  type DealByInterestsInput,
  type DealByInterestsOutput,
  type DealGetInput,
  type DealGetOutput,
  type DealListItem,
} from '../core/schema.js';
import { getDealsInWindow, getDeal, getAllDeals } from '../storage/dealsRepo.js';
import { getProfile } from '../storage/profilesRepo.js';
import {
  calculateMatchScore,
  calculateTrustScore,
  passesFilters,
  generateWhyRecommended,
  generateRiskNote,
  createScore,
  calculateCombinedScore,
} from '../core/scoring.js';
import { deduplicateDeals } from '../core/dedupe.js';
import { truncate } from '../core/normalize.js';

export const dealsHot10Tool = {
  name: 'deals_hot10',
  description:
    'Get top 10 trending deals in the specified time window. ' +
    'Returns deals sorted by popularity or discount rate. ' +
    'Fast cached response, no external calls.',
  inputSchema: zodToJsonSchema(dealHot10InputSchema),
  handler: async (input: DealHot10Input): Promise<DealHot10Output> => {
    try {
      const windowHours = input.window === '24h' ? 24 : 168;
      const deals = getDealsInWindow(windowHours, input.sort, 10);

      const items: DealListItem[] = deals.map((deal) => ({
        deal_id: deal.deal_id,
        title: truncate(deal.title, 120),
        price_current: deal.price_current,
        price_original: deal.price_original,
        discount_rate: deal.discount_rate,
        source: deal.source,
        merchant: deal.merchant,
        url: deal.url,
        category: deal.category,
        posted_at: deal.posted_at,
        score: createScore(deal.popularity_score, calculateTrustScore(deal)),
        why_recommended: ['High popularity score', 'Trending deal', 'Recent posting'].slice(0, 3),
        risk_note: generateRiskNote(deal),
      }));

      return {
        window: input.window,
        items,
      };
    } catch (error) {
      throw new Error(`Failed to get hot deals: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};

export const dealsByInterestsTool = {
  name: 'deals_by_interests',
  description:
    'Get personalized deals matching a saved interest profile. ' +
    'Filters by categories, keywords, brands, price, and discount rate. ' +
    'Returns scored and ranked results with explanation. ' +
    'Supports deduplication to remove similar deals.',
  inputSchema: zodToJsonSchema(dealByInterestsInputSchema),
  handler: async (input: DealByInterestsInput): Promise<DealByInterestsOutput> => {
    try {
      const profile = getProfile(input.profile_id);
      if (!profile) {
        throw new Error(`Profile not found: ${input.profile_id}`);
      }

      const allDeals = getAllDeals();
      const notes: string[] = [];

      // Filter by profile criteria
      const filtered = allDeals.filter((deal) => passesFilters(deal, profile));

      if (filtered.length === 0) {
        notes.push('No deals match your criteria. Try relaxing filters.');
      }

      // Score and enrich
      const scored = filtered.map((deal) => {
        const matchScore = calculateMatchScore(deal, profile);
        const trustScore = calculateTrustScore(deal);

        return {
          deal,
          matchScore,
          trustScore,
          combinedScore: calculateCombinedScore({
            match: matchScore,
            trust: trustScore,
            popularity: deal.popularity_score,
          }),
        };
      });

      // Sort by combined score
      scored.sort((a, b) => b.combinedScore - a.combinedScore);

      // Deduplicate if requested
      let finalDeals = scored;
      if (input.dedupe) {
        const beforeCount = finalDeals.length;

        // Map to include fingerprint for deduplication
        const withFingerprint = finalDeals.map(item => ({
          ...item,
          fingerprint: item.deal.fingerprint
        }));

        const deduplicated = deduplicateDeals(
          withFingerprint,
          (item) => item.combinedScore
        );

        finalDeals = deduplicated;

        if (beforeCount > finalDeals.length) {
          notes.push(`Removed ${beforeCount - finalDeals.length} duplicate deals`);
        }
      }

      // Limit results
      const limit = Math.min(input.limit ?? 20, 30);
      const limitedDeals = finalDeals.slice(0, limit);

      if (limitedDeals.length < finalDeals.length) {
        notes.push(`Showing top ${limitedDeals.length} of ${finalDeals.length} matches`);
      }

      // Build response items
      const items: DealListItem[] = limitedDeals.map(({ deal, matchScore, trustScore }) => ({
        deal_id: deal.deal_id,
        title: truncate(deal.title, 120),
        price_current: deal.price_current,
        price_original: deal.price_original,
        discount_rate: deal.discount_rate,
        source: deal.source,
        merchant: deal.merchant,
        url: deal.url,
        category: deal.category,
        posted_at: deal.posted_at,
        score: createScore(deal.popularity_score, trustScore, matchScore),
        why_recommended: generateWhyRecommended(deal, profile, matchScore).slice(0, 5),
        risk_note: generateRiskNote(deal),
      }));

      return {
        items,
        notes: notes.slice(0, 3),
      };
    } catch (error) {
      throw new Error(`Failed to get deals by interests: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};

export const dealsGetTool = {
  name: 'deals_get',
  description:
    'Get detailed information about a specific deal by ID. ' +
    'Includes conditions, observations, and pricing breakdown. ' +
    'Use this for full deal details after browsing lists.',
  inputSchema: zodToJsonSchema(dealGetInputSchema),
  handler: async (input: DealGetInput): Promise<DealGetOutput> => {
    try {
      const deal = getDeal(input.deal_id);
      if (!deal) {
        throw new Error(`Deal not found: ${input.deal_id}`);
      }

      const extra = JSON.parse(deal.extra_json);
      const trustScore = calculateTrustScore(deal);

      return {
        deal: {
          deal_id: deal.deal_id,
          title: truncate(deal.title, 120),
          price_current: deal.price_current,
          price_original: deal.price_original,
          discount_rate: deal.discount_rate,
          source: deal.source,
          merchant: deal.merchant,
          url: deal.url,
          category: deal.category,
          posted_at: deal.posted_at,
          score: createScore(deal.popularity_score, trustScore),
          why_recommended: [],
          risk_note: generateRiskNote(deal),
          conditions: extra.conditions || [],
          observations: extra.observations || [],
          price_components: {
            shipping_included: extra.shipping_info?.includes('무료') || false,
            shipping_fee: extra.shipping_fee || null,
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to get deal: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};
