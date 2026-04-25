'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBoardDetail(boardId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error('Failed to fetch board');
      return res.json();
    },
    enabled: !!boardId,
  });

  return {
    board: data ?? null,
    isLoading,
  };
}

export function useCreateList(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create list');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useReorderLists(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { listIds: string[] }) => {
      const res = await fetch(`/api/boards/${boardId}/lists/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to reorder lists');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string }) => {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update list');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useCreateCard(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { title: string; description?: string }) => {
      const res = await fetch(`/api/lists/${listId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create card');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, ...body }: { cardId: string; listId: string; position: number }) => {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to move card');
      return res.json();
    },
    onMutate: async ({ cardId, listId, position }) => {
      await queryClient.cancelQueries({ queryKey: ['board'] });

      const queries = queryClient.getQueriesData<Record<string, unknown>>({ queryKey: ['board'] });
      const previousData: Array<[readonly unknown[], Record<string, unknown> | undefined]> = [];

      for (const [queryKey, data] of queries) {
        if (!data) continue;
        previousData.push([queryKey, structuredClone(data)]);

        const board = data as Record<string, unknown>;
        const lists = board.lists as Array<Record<string, unknown>> | undefined;
        if (!lists) continue;

        let movedCard: Record<string, unknown> | null = null;

        for (const list of lists) {
          const cards = list.cards as Array<Record<string, unknown>> | undefined;
          if (!cards) continue;
          const cardIndex = cards.findIndex((c) => c.id === cardId);
          if (cardIndex !== -1) {
            movedCard = cards.splice(cardIndex, 1)[0];
            break;
          }
        }

        if (movedCard) {
          for (const list of lists) {
            if (list.id === listId) {
              const cards = (list.cards as Array<Record<string, unknown>>) ?? [];
              movedCard.listId = listId;
              cards.splice(position, 0, movedCard);
              list.cards = cards;
              break;
            }
          }
          queryClient.setQueryData(queryKey, board);
        }
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useReorderCards(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { cardIds: string[] }) => {
      const res = await fetch(`/api/lists/${listId}/cards/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to reorder cards');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
