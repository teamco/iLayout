import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LayoutNode } from '@/layout/types';
import type { LayoutStatus } from '@/lib/types';
import * as api from '@/lib/layoutApi';

const KEYS = {
  myLayouts: ['layouts', 'my'] as const,
  layout: (id: string) => ['layouts', id] as const,
  published: (userId: string) => ['layouts', 'published', userId] as const,
  history: (id: string) => ['layouts', 'history', id] as const,
};

export function useMyLayouts() {
  return useQuery({
    queryKey: KEYS.myLayouts,
    queryFn: api.getMyLayouts,
  });
}

export function useLayout(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.layout(id!),
    queryFn: () => api.getLayout(id!),
    enabled: !!id,
  });
}

export function usePublishedLayout(userId: string | undefined) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.myLayouts });
    },
  });
}

export function useSaveLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LayoutNode }) => api.saveLayout(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.myLayouts });
      queryClient.invalidateQueries({ queryKey: KEYS.layout(variables.id) });
      queryClient.invalidateQueries({ queryKey: KEYS.history(variables.id) });
    },
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, status }: { id: string; version: number; status: LayoutStatus }) =>
      api.setStatus(id, version, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.myLayouts });
      queryClient.invalidateQueries({ queryKey: KEYS.layout(variables.id) });
      queryClient.invalidateQueries({ queryKey: KEYS.history(variables.id) });
    },
  });
}
