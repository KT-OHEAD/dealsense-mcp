import { z } from 'zod';

// Profile schemas
export const profileInputSchema = z.object({
  profile_id: z.string().nullable().optional(),
  categories: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  brands: z.array(z.string()).default([]),
  price_max: z.number().nullable().optional(),
  min_discount_rate: z.number().nullable().optional(),
  exclude_keywords: z.array(z.string()).default([]),
});

export const profileOutputSchema = z.object({
  profile_id: z.string(),
  summary: z.string(),
  normalized: z.object({
    categories: z.array(z.string()),
    keywords: z.array(z.string()),
    brands: z.array(z.string()),
    price_max: z.number().nullable(),
    min_discount_rate: z.number().nullable(),
    exclude_keywords: z.array(z.string()),
  }),
});

export const profileListInputSchema = z.object({
  profile_id: z.string().nullable().optional(),
});

export const profileListOutputSchema = z.object({
  profiles: z.array(
    z.object({
      profile_id: z.string(),
      summary: z.string(),
      normalized: z.object({
        categories: z.array(z.string()),
        keywords: z.array(z.string()),
        brands: z.array(z.string()),
        price_max: z.number().nullable(),
        min_discount_rate: z.number().nullable(),
        exclude_keywords: z.array(z.string()),
      }),
      updated_at: z.string(),
    })
  ),
});

export const profileDeleteInputSchema = z.object({
  profile_id: z.string(),
});

export const profileDeleteOutputSchema = z.object({
  status: z.literal('ok'),
});

// Deal schemas
export const dealHot10InputSchema = z.object({
  window: z.enum(['24h', '7d']).default('24h'),
  sort: z.enum(['popularity', 'discount']).default('popularity'),
});

export const scoreSchema = z.object({
  popularity: z.number(),
  match: z.number().optional(),
  trust: z.number(),
});

export const dealListItemSchema = z.object({
  deal_id: z.string(),
  title: z.string(),
  price_current: z.number(),
  price_original: z.number().nullable(),
  discount_rate: z.number().nullable(),
  source: z.enum(['community', 'shop', 'manual']),
  merchant: z.string(),
  url: z.string(),
  category: z.string(),
  posted_at: z.string(),
  score: scoreSchema,
  why_recommended: z.array(z.string()),
  risk_note: z.string().nullable(),
});

export const dealHot10OutputSchema = z.object({
  window: z.string(),
  items: z.array(dealListItemSchema),
});

export const dealByInterestsInputSchema = z.object({
  profile_id: z.string(),
  limit: z.number().nullable().optional(),
  dedupe: z.boolean().default(true),
});

export const dealByInterestsOutputSchema = z.object({
  items: z.array(dealListItemSchema),
  notes: z.array(z.string()),
});

export const dealGetInputSchema = z.object({
  deal_id: z.string(),
});

export const dealGetOutputSchema = z.object({
  deal: dealListItemSchema.extend({
    conditions: z.array(z.string()),
    observations: z.array(z.string()),
    price_components: z.object({
      shipping_included: z.boolean(),
      shipping_fee: z.number().nullable(),
    }),
  }),
});

export const dealVerifyInputSchema = z.object({
  deal_id: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const dealVerifyOutputSchema = z.object({
  trust_score: z.number(),
  warnings: z.array(z.string()),
  risk_level: z.enum(['low', 'medium', 'high']),
  notes: z.array(z.string()),
});

// Type exports
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfileOutput = z.infer<typeof profileOutputSchema>;
export type ProfileListInput = z.infer<typeof profileListInputSchema>;
export type ProfileListOutput = z.infer<typeof profileListOutputSchema>;
export type ProfileDeleteInput = z.infer<typeof profileDeleteInputSchema>;
export type ProfileDeleteOutput = z.infer<typeof profileDeleteOutputSchema>;

export type DealHot10Input = z.infer<typeof dealHot10InputSchema>;
export type DealHot10Output = z.infer<typeof dealHot10OutputSchema>;
export type DealByInterestsInput = z.infer<typeof dealByInterestsInputSchema>;
export type DealByInterestsOutput = z.infer<typeof dealByInterestsOutputSchema>;
export type DealGetInput = z.infer<typeof dealGetInputSchema>;
export type DealGetOutput = z.infer<typeof dealGetOutputSchema>;
export type DealVerifyInput = z.infer<typeof dealVerifyInputSchema>;
export type DealVerifyOutput = z.infer<typeof dealVerifyOutputSchema>;

export type DealListItem = z.infer<typeof dealListItemSchema>;
export type Score = z.infer<typeof scoreSchema>;
