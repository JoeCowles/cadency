'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useNotifications() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });

  return {
    notifications: data?.notifications ?? [],
    isLoading,
  };
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
