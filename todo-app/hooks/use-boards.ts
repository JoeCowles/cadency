'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBoards(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (!res.ok) throw new Error('Failed to fetch boards');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  return {
    boards: data?.boards ?? [],
    isLoading,
  };
}

export function useCreateBoard(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; description?: string; gradient: string; scope: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create board');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const res = await fetch(`/api/boards/${boardId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to toggle star');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
