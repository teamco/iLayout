import type { IUser, WidgetRecord } from '@/lib/types';
import { supabase, authService } from '@/lib/supabase';
import { createTableApi } from '@idevconn/supabase';

const widgetTable = createTableApi<WidgetRecord>(supabase, 'widgets');

async function currentUserId(): Promise<string> {
  const { user } = await authService.getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getWidgets(userId: IUser['id']): Promise<WidgetRecord[]> {
  const { data, error } = await widgetTable
    .query()
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getPublicWidgets(): Promise<WidgetRecord[]> {
  const { data, error } = await widgetTable
    .query()
    .select('*')
    .eq('is_public', true)
    .eq('status', 'published')
    .order('name');

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getWidget(id: string): Promise<WidgetRecord | null> {
  return widgetTable.getById(id);
}

export async function createWidget(
  widget: Partial<WidgetRecord>,
): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const { data, error } = await widgetTable
    .query()
    .insert({
      user_id: userId,
      name: widget.name ?? 'Empty',
      description: widget.description ?? 'Empty widget',
      thumbnail: widget.thumbnail ?? null,
      content: widget.content ?? { value: '' },
      category: widget.category ?? 'utility',
      resource: widget.resource ?? 'empty',
      config: widget.config ?? { isEditable: false, isClonable: true },
      tags: widget.tags ?? ['empty', 'widget', 'default'],
      status: 'draft',
      is_public: widget.is_public ?? false,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WidgetRecord;
}

export async function updateWidget(
  id: string,
  updates: Partial<WidgetRecord>,
): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const result = await widgetTable.update(id, {
    ...updates,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });

  if (!result) throw new Error('Failed to update widget');
  return result;
}

export async function deleteWidget(id: string): Promise<void> {
  const userId = await currentUserId();
  await widgetTable.update(id, {
    status: 'deleted',
    updated_by: userId,
    updated_at: new Date().toISOString(),
  } as Partial<WidgetRecord>);
}
