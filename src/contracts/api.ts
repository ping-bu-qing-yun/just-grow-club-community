import { z } from 'zod';

export const userRoleSchema = z.enum(['member', 'host', 'operator']);
export const activityLifecycleSchema = z.enum(['pre', 'formal', 'archived']);
export const participationStatusSchema = z.enum(['interested', 'joined']);
export const activityCategorySchema = z.enum(['饭搭子', '咖啡', '运动', '徒步', '看展', '桌游']);
export const contentTypeSchema = z.enum(['activity', 'need', 'life']);
export const contentStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected', 'archived']);

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

export const contentCreateSchema = z.object({
  body: z.string().trim().min(1).max(5_000),
  tags: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  image: z.string().trim().max(512).optional(),
}).strict();

export const cursorSchema = z.string().trim().min(1).max(512);

export const cursorPageQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();
