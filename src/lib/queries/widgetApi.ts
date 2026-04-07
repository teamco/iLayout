import type { IUser, WidgetRecord } from '@/lib/types';
import { supabase } from '@/lib/supabase';

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getWidgets(userId: IUser['id']): Promise<WidgetRecord[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getPublicWidgets(): Promise<WidgetRecord[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'published')
    .order('name');

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getWidget(id: string): Promise<WidgetRecord | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as WidgetRecord;
}

export async function createWidget(widget: Partial<WidgetRecord>): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('widgets')
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

export async function updateWidget(id: string, updates: Partial<WidgetRecord>): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('widgets')
    .update({
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WidgetRecord;
}

export async function deleteWidget(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('widgets')
    .update({
      status: 'deleted',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
