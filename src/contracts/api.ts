import { z } from 'zod';

export const userRoleSchema = z.enum(['member', 'host', 'operator']);
export const activityLifecycleSchema = z.enum(['pre', 'formal', 'archived']);
export const participationStatusSchema = z.enum(['interested', 'joined', 'cancelled', 'waitlisted']);
export const activityCategorySchema = z.string().trim().min(1).max(120);
export const contentTypeSchema = z.enum(['activity', 'need', 'life']);
export const contentStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected', 'archived', 'hidden']);

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fields: z.record(z.string(), z.string()).optional(),
});

export const apiErrorEnvelopeSchema = z.object({ error: apiErrorSchema });

export const loginRequestSchema = z.object({
  phone: z.string().trim().min(6).max(32),
  password: z.string().min(1).max(256),
}).strict();

export const createActivityInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  category: activityCategorySchema,
  description: z.string().trim().min(1).max(20_000),
  dateLabel: z.string().trim().min(1).max(120),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location: z.string().trim().min(1).max(255),
  capacity: z.number().int().min(2).max(50),
  price: z.number().int().min(0).max(999_999),
}).strict();
export const updateActivityInputSchema = createActivityInputSchema.partial().strict();

export const contentCreateSchema = z.object({
  body: z.string().trim().min(1).max(5_000),
  tags: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  image: z.string().trim().max(512).optional(),
}).strict();

export const basicProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(120),
  birthDate: z.string().max(10),
  gender: z.string().trim().min(1).max(64),
  education: z.string().trim().max(64),
  occupation: z.string().trim().max(120),
  height: z.string().trim().max(16),
  city: z.string().trim().max(160),
  hometown: z.string().trim().max(120),
  relationship: z.string().trim().max(64),
  bio: z.string().trim().max(5_000),
  tags: z.array(z.string().trim().min(1).max(120)).max(20),
  preferences: z.array(z.string().trim().min(1).max(120)).max(20),
}).strict();

export const profileRecordSchema = z.object({
  onboardingComplete: z.boolean(),
  onboardingStep: z.number().int().min(0).max(3),
  lightAnswers: z.array(z.array(z.string().trim().min(1).max(160)).max(12)).length(3),
  qaAnswers: z.record(z.string().trim().min(1).max(160), z.string().trim().max(5_000)),
  profile: basicProfileSchema,
}).strict();

export const cursorSchema = z.string().trim().min(1).max(512);

export const cursorPageQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

export const activityListQuerySchema = cursorPageQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().min(1).max(64).optional(),
  theme: z.enum(['low', 'deep', 'walk', 'workshop', 'other']).optional(),
  lifecycle: z.enum(['pre', 'formal']).optional(),
});

export const contentListQuerySchema = cursorPageQuerySchema.extend({
  type: z.enum(['need', 'life']),
  q: z.string().trim().max(120).optional(),
});

export const notificationListQuerySchema = cursorPageQuerySchema;

export const cursorPageMetaSchema = z.object({
  nextCursor: cursorSchema.nullable(),
});
