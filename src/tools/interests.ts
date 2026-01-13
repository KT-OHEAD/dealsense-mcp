import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  profileInputSchema,
  profileListInputSchema,
  profileDeleteInputSchema,
  type ProfileInput,
  type ProfileOutput,
  type ProfileListInput,
  type ProfileListOutput,
  type ProfileDeleteInput,
  type ProfileDeleteOutput,
} from '../core/schema.js';
import { createProfileSummary } from '../core/normalize.js';
import { upsertProfile, listProfiles, deleteProfile } from '../storage/profilesRepo.js';

export const interestsUpsertTool = {
  name: 'interests_upsert',
  description:
    'Create or update a user interest profile for personalized deal recommendations. ' +
    'Accepts categories, keywords, brands, price limits, and exclusions. ' +
    'Returns a profile_id that can be used to fetch matching deals.',
  inputSchema: zodToJsonSchema(profileInputSchema),
  handler: async (input: ProfileInput): Promise<ProfileOutput> => {
    try {
      const record = upsertProfile({
        profile_id: input.profile_id,
        categories: input.categories,
        keywords: input.keywords,
        brands: input.brands,
        price_max: input.price_max,
        min_discount_rate: input.min_discount_rate,
        exclude_keywords: input.exclude_keywords,
      });

      const summary = createProfileSummary({
        categories: record.categories,
        keywords: record.keywords,
        brands: record.brands,
        price_max: record.price_max,
        min_discount_rate: record.min_discount_rate,
        exclude_keywords: record.exclude_keywords,
      });

      return {
        profile_id: record.profile_id,
        summary,
        normalized: {
          categories: record.categories,
          keywords: record.keywords,
          brands: record.brands,
          price_max: record.price_max,
          min_discount_rate: record.min_discount_rate,
          exclude_keywords: record.exclude_keywords,
        },
      };
    } catch (error) {
      throw new Error(`Failed to upsert profile: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};

export const interestsListTool = {
  name: 'interests_list',
  description:
    'List all saved interest profiles or get a specific profile by ID. ' +
    'Returns profile details including categories, keywords, and filters.',
  inputSchema: zodToJsonSchema(profileListInputSchema),
  handler: async (input: ProfileListInput): Promise<ProfileListOutput> => {
    try {
      const records = listProfiles(input.profile_id);

      return {
        profiles: records.map((record) => ({
          profile_id: record.profile_id,
          summary: createProfileSummary({
            categories: record.categories,
            keywords: record.keywords,
            brands: record.brands,
            price_max: record.price_max,
            min_discount_rate: record.min_discount_rate,
            exclude_keywords: record.exclude_keywords,
          }),
          normalized: {
            categories: record.categories,
            keywords: record.keywords,
            brands: record.brands,
            price_max: record.price_max,
            min_discount_rate: record.min_discount_rate,
            exclude_keywords: record.exclude_keywords,
          },
          updated_at: record.updated_at,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to list profiles: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};

export const interestsDeleteTool = {
  name: 'interests_delete',
  description: 'Delete an interest profile by ID. This action cannot be undone.',
  inputSchema: zodToJsonSchema(profileDeleteInputSchema),
  handler: async (input: ProfileDeleteInput): Promise<ProfileDeleteOutput> => {
    try {
      const deleted = deleteProfile(input.profile_id);
      if (!deleted) {
        throw new Error(`Profile not found: ${input.profile_id}`);
      }
      return { status: 'ok' };
    } catch (error) {
      throw new Error(`Failed to delete profile: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  },
};
