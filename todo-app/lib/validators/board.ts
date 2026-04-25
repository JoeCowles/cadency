import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  gradient: z.string(),
  scope: z.enum(['private', 'workspace', 'public']).default('workspace'),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  gradient: z.string().optional(),
  scope: z.enum(['private', 'workspace', 'public']).optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.number().int().optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().optional(),
});

export const reorderListsSchema = z.object({
  lists: z.array(z.string().uuid()),
});
