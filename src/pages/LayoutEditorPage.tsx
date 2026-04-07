import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { App as AntApp, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import App from '@/App';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useLayout, useCreateLayout, useSaveLayout } from '@/lib/hooks/useLayoutQueries';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';
import { ERoutes } from '@/routes';

export function LayoutEditorPage() {
  const { layoutId } = useParams({ strict: false }) as { userId?: string; layoutId?: string };
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { t } = useTranslation();
  const isNew = !layoutId;

  const { data: layout, isLoading, error: loadError } = useLayout(isNew ? undefined : layoutId);
  const createMutation = useCreateLayout();
  const saveMutation = useSaveLayout();

  useErrorNotification(loadError, 'Failed to load layout');
  useErrorNotification(createMutation.error, 'Failed to create layout');
  useErrorNotification(saveMutation.error, 'Failed to save layout');

  // Load layout data into Zustand store when fetched
  useEffect(() => {
    if (layout?.data) {
      useLayoutStore.setState({ root: layout.data });
      // Sync layoutMode from loaded layout
      const mode = (layout as unknown as Record<string, unknown>).mode as 'viewport' | 'scroll' | undefined;
      useLayoutStore.setState({ layoutMode: mode ?? 'viewport' });
    }
  }, [layout]);

  // Reset store for new layouts
  useEffect(() => {
    if (isNew) {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = (searchParams.get('mode') as 'viewport' | 'scroll') || 'viewport';
      useLayoutStore.getState().setLayoutMode(mode);
      if (mode !== 'scroll') {
        useLayoutStore.setState({ root: { id: crypto.randomUUID(), type: 'leaf' } });
      }
      useLayoutStore.getState().setEditMode(true);
    }
  }, [isNew]);

  function handleSave() {
    const root = useLayoutStore.getState().root;

    if (isNew) {
      createMutation.mutate(root, {
        onSuccess: async (created) => {
          void message.success(t('layout.layoutCreated'));
          await navigate({
            to: ERoutes.LAYOUT_EDIT as string,
            params: { layoutId: created.id },
          });
        },
      });
    } else {
      saveMutation.mutate({ id: layoutId, data: root }, {
        onSuccess: () => void message.success(t('layout.layoutSaved')),
      });
    }
  }

  if (!isNew && isLoading) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <App
      onSave={handleSave}
      saving={createMutation.isPending || saveMutation.isPending}
    />
  );
}
