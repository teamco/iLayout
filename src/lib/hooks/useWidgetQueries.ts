import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IUser, WidgetRecord } from '@/lib/types';
import * as api from '@/lib/queries/widgetApi';

const KEYS = {
  widgets: (userId: string) => ['widgets', userId] as const,
  publicWidgets: ['widgets', 'public'] as const,
  widget: (id: string) => ['widgets', 'detail', id] as const,
};

export function useWidgets(userId: IUser['id'] | undefined) {
  return useQuery({
    queryKey: KEYS.widgets(userId!),
    queryFn: () => api.getWidgets(userId!),
    enabled: !!userId,
  });
}

export function usePublicWidgets() {
  return useQuery({
    queryKey: KEYS.publicWidgets,
    queryFn: api.getPublicWidgets,
  });
}

export function useWidget(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.widget(id!),
    queryFn: () => api.getWidget(id!),
    enabled: !!id,
  });
}

export function useCreateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WidgetRecord>) => api.createWidget(data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEYS.widget(created.id), created);
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WidgetRecord> }) =>
      api.updateWidget(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.widget(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteWidget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}
