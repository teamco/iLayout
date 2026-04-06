import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Spin, message } from 'antd';
import App from '@/App';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useLayout, useCreateLayout, useSaveLayout } from '@/lib/hooks/useLayoutQueries';

export function LayoutEditorPage() {
  const { userId, layoutId } = useParams({ strict: false }) as { userId: string; layoutId: string };
  const navigate = useNavigate();
  const isNew = layoutId === 'new';

  const { data: layout, isLoading } = useLayout(isNew ? undefined : layoutId);
  const createMutation = useCreateLayout();
  const saveMutation = useSaveLayout();

  // Load layout data into Zustand store when fetched
  useEffect(() => {
    if (layout?.data) {
      useLayoutStore.setState({ root: layout.data });
    }
  }, [layout]);

  // Reset store for new layouts
  useEffect(() => {
    if (isNew) {
      useLayoutStore.setState({ root: { id: crypto.randomUUID(), type: 'leaf' } });
      useLayoutStore.getState().setEditMode(true);
    }
  }, [isNew]);

  function handleSave() {
    const root = useLayoutStore.getState().root;

    if (isNew) {
      createMutation.mutate(root, {
        onSuccess: (created) => {
          message.success('Layout created');
          navigate({
            to: '/users/$userId/layouts/$layoutId' as string,
            params: { userId, layoutId: created.id },
          });
        },
        onError: (err) => message.error(err.message),
      });
    } else {
      saveMutation.mutate({ id: layoutId, data: root }, {
        onSuccess: () => message.success('Layout saved'),
        onError: (err) => message.error(err.message),
      });
    }
  }

  if (!isNew && isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <App
      layoutId={isNew ? undefined : layoutId}
      onSave={handleSave}
      saving={createMutation.isPending || saveMutation.isPending}
    />
  );
}
