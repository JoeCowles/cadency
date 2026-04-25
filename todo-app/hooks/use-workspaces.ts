'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useWorkspaces() {
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return res.json();
    },
  });

  return {
    workspaces: data?.workspaces ?? [],
    isLoading,
  };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; description?: string; color?: string }) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create workspace');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; description?: string; color?: string }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update workspace');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete workspace');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
