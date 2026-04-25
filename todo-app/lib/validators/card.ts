import { z } from 'zod';

export const createCardSchema = z.object({
  title: z.string().min(1).max(500),
  position: z.number().int().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  cover: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
});

export const moveCardSchema = z.object({
  listId: z.string().uuid(),
  position: z.number().int().optional(),
});

export const reorderCardsSchema = z.object({
  cards: z.array(z.string().uuid()),
});

export const setCardLabelsSchema = z.object({
  label_ids: z.array(z.string().uuid()),
});

export const setCardMembersSchema = z.object({
  user_ids: z.array(z.string().uuid()),
});
