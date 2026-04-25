'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface FsNode {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  type: 'file' | 'folder';
  mimeType: string | null;
  size: number | null;
  storagePath: string | null;
  cardId: string | null;
  attachmentId: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export function useFiles(workspaceId: string, parentId?: string | null) {
  const queryKey = ['files', workspaceId, parentId ?? 'root'];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = parentId
        ? `/api/workspaces/${workspaceId}/files?parentId=${parentId}`
        : `/api/workspaces/${workspaceId}/files`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json() as Promise<FsNode[]>;
    },
    enabled: !!workspaceId,
  });

  return { nodes: data ?? [], isLoading };
}

export function useCreateFolder(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; parentId?: string | null }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/files/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json() as Promise<FsNode>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId, variables.parentId ?? 'root'] });
    },
  });
}

export function useUploadFile(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, parentId }: { file: File; parentId?: string | null }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parentId', parentId);

      const res = await fetch(`/api/workspaces/${workspaceId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload file');
      return res.json() as Promise<FsNode>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId, variables.parentId ?? 'root'] });
    },
  });
}

export function useRenameNode(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, name }: { nodeId: string; name: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/files/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      return res.json() as Promise<FsNode>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId] });
    },
  });
}

export function useDeleteNode(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/files/${nodeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId] });
    },
  });
}

export function useMoveNode(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, parentId }: { nodeId: string; parentId: string | null }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/files/${nodeId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });
      if (!res.ok) throw new Error('Failed to move');
      return res.json() as Promise<FsNode>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId] });
    },
  });
}
