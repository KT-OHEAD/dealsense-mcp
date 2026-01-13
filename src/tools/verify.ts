import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  dealVerifyInputSchema,
  type DealVerifyInput,
  type DealVerifyOutput,
} from '../core/schema.js';
import { getDeal } from '../storage/dealsRepo.js';
import { calculateTrustScore } from '../core/scoring.js';

export const dealsVerifyTool = {
  name: 'deals_verify',
  description:
    'Verify deal trustworthiness and identify potential risks. ' +
    'Analyzes title, URL, and merchant patterns without external calls. ' +
    'Returns trust score, warnings, and risk level assessment.',
  inputSchema: zodToJsonSchema(dealVerifyInputSchema),
  handler: async (input: DealVerifyInput): Promise<DealVerifyOutput> => {
    try {
      // Validate input: at least one field required
      if (!input.deal_id && !input.url && !input.title) {
        throw new Error('At least one of deal_id, url, or title is required');
      }

      let deal = null;
      let title = input.title || '';
      let url = input.url || '';

      // If deal_id provided, fetch from DB
      if (input.deal_id) {
        deal = getDeal(input.deal_id);
        if (!deal) {
          throw new Error(`Deal not found: ${input.deal_id}`);
        }
        title = deal.title;
        url = deal.url;
      }

      // Calculate trust score
      let trustScore = 0;
      if (deal) {
        trustScore = calculateTrustScore(deal);
      } else {
        // Rule-based analysis for standalone title/url
        trustScore = analyzeStandalone(title, url);
      }

      // Generate warnings
      const warnings = generateWarnings(title, url);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (trustScore >= 0.8) {
        riskLevel = 'low';
      } else if (trustScore >= 0.5) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }

      // Generate notes
      const notes = generateVerifyNotes(title, url, trustScore);

      return {
        trust_score: trustScore,
        warnings: warnings.slice(0, 5),
        risk_level: riskLevel,
        notes: notes.slice(0, 3),
      };
    } catch (error) {
      throw new Error(`Failed to verify deal: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};

function analyzeStandalone(title: string, url: string): number {
  let score = 1.0;
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  // Risk patterns
  const riskPatterns = [
    { keywords: ['옵션', '선택', '추가금'], penalty: 0.15 },
    { keywords: ['품절', '예약'], penalty: 0.2 },
    { keywords: ['랜덤', '무작위'], penalty: 0.25 },
    { keywords: ['리퍼', '리퍼브', '중고'], penalty: 0.3 },
    { keywords: ['해외배송', '배송비별도'], penalty: 0.15 },
  ];

  for (const pattern of riskPatterns) {
    for (const keyword of pattern.keywords) {
      if (titleLower.includes(keyword)) {
        score -= pattern.penalty;
        break;
      }
    }
  }

  // Trusted domains
  const trustedDomains = [
    'coupang.com',
    'naver.com',
    'gmarket.com',
    '11st.co.kr',
    'ssg.com',
    'auction.co.kr',
  ];

  for (const domain of trustedDomains) {
    if (urlLower.includes(domain)) {
      score += 0.1;
      break;
    }
  }

  return Math.max(0, Math.min(1, score));
}

function generateWarnings(title: string, url: string): string[] {
  const warnings: string[] = [];
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  if (titleLower.includes('옵션') || titleLower.includes('선택') || titleLower.includes('추가금')) {
    warnings.push('Options may change the final price.');
  }

  if (titleLower.includes('품절') || titleLower.includes('예약')) {
    warnings.push('Availability may be unstable.');
  }

  if (titleLower.includes('배송비별도') || titleLower.includes('해외배송') || urlLower.includes('shipping')) {
    warnings.push('Shipping fee may apply.');
  }

  if (titleLower.includes('중고') || titleLower.includes('리퍼') || titleLower.includes('리퍼브')) {
    warnings.push('Refurb/used item possibility.');
  }

  if (titleLower.includes('랜덤') || titleLower.includes('무작위')) {
    warnings.push('Random selection - exact item not guaranteed.');
  }

  return warnings;
}

function generateVerifyNotes(title: string, url: string, trustScore: number): string[] {
  const notes: string[] = [];

  if (trustScore >= 0.8) {
    notes.push('Deal appears trustworthy based on analysis');
  } else if (trustScore >= 0.5) {
    notes.push('Moderate risk detected - verify details carefully');
  } else {
    notes.push('High risk detected - proceed with caution');
  }

  // Check URL
  if (url.includes('example.com')) {
    notes.push('Sample URL - verify actual merchant domain');
  }

  // Check title length
  if (title.length > 100) {
    notes.push('Long title may indicate complex conditions');
  }

  return notes;
}
