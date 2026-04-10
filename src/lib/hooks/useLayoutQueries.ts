import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LayoutNode } from '@/layout/types';
import type { IUser, LayoutStatus } from '@/lib/types';
import * as api from '@/lib/queries/layoutApi';

const KEYS = {
  layouts: (userId: string) => ['layouts', userId] as const,
  layout: (id: string) => ['layouts', 'detail', id] as const,
  published: (userId: string) => ['layouts', 'published', userId] as const,
  history: (id: string) => ['layouts', 'history', id] as const,
};

export function useLayouts(userId: IUser['id'] | undefined) {
  return useQuery({
    queryKey: KEYS.layouts(userId!),
    queryFn: () => api.getLayouts(userId!),
    enabled: !!userId,
  });
}

export function useLayout(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.layout(id!),
    queryFn: () => api.getLayout(id!),
    enabled: !!id,
  });
}

export function usePublishedLayout(userId: IUser['id'] | undefined) {
  return useQuery({
    queryKey: KEYS.published(userId!),
    queryFn: () => api.getPublishedLayout(userId!),
    enabled: !!userId,
  });
}

export function useVersionHistory(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.history(id!),
    queryFn: () => api.getVersionHistory(id!),
    enabled: !!id,
  });
}

export function useCreateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LayoutNode) => api.createLayout(data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEYS.layout(created.id), created);
      void queryClient.invalidateQueries({
        queryKey: KEYS.layouts(created.user_id),
      });
    },
  });
}

export function useSaveLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LayoutNode }) =>
      api.saveLayout(id, data),
    onSuccess: (saved, variables) => {
      queryClient.setQueryData(KEYS.layout(variables.id), saved);
      void queryClient.invalidateQueries({
        queryKey: KEYS.layouts(saved.user_id),
      });
      void queryClient.invalidateQueries({
        queryKey: KEYS.history(variables.id),
      });
    },
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      status,
    }: {
      id: string;
      version: number;
      status: LayoutStatus;
    }) => api.setStatus(id, version, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });
}
