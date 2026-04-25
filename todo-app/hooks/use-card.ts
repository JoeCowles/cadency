'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCardDetail(cardId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) throw new Error('Failed to fetch card');
      return res.json();
    },
    enabled: !!cardId,
  });

  return {
    card: data ?? null,
    isLoading,
  };
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update card');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
