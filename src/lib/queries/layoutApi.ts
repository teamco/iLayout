import type { LayoutNode } from '@/layout/types';
import type { IUser, LayoutRecord, LayoutStatus } from '@/lib/types';
import { supabase, authService } from '@/lib/supabase';
import { createTableApi } from '@idevconn/supabase';

const layoutTable = createTableApi<LayoutRecord>(supabase, 'layouts');

async function currentUserId(): Promise<string> {
  const { user } = await authService.getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getLayouts(userId: IUser['id']): Promise<LayoutRecord[]> {
  const { data, error } = await layoutTable
    .query()
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('id')
    .order('version', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const result: LayoutRecord[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      result.push(row as LayoutRecord);
    }
  }
  return result;
}

export async function getLayout(id: string): Promise<LayoutRecord | null> {
  const { data, error } = await layoutTable
    .query()
    .select('*')
    .eq('id', id)
    .neq('status', 'deleted')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as LayoutRecord;
}

export async function getLayoutVersion(
  id: string,
  version: number,
): Promise<LayoutRecord | null> {
  const { data, error } = await layoutTable
    .query()
    .select('*')
    .eq('id', id)
    .eq('version', version)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as LayoutRecord;
}

export async function getPublishedLayout(
  userId: IUser['id'],
): Promise<LayoutRecord | null> {
  const { data, error } = await layoutTable
    .query()
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as LayoutRecord;
}

export async function createLayout(data: LayoutNode): Promise<LayoutRecord> {
  const userId = await currentUserId();
  const { data: row, error } = await layoutTable
    .query()
    .insert({
      user_id: userId,
      version: 1,
      status: 'draft' as LayoutStatus,
      data,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return row as LayoutRecord;
}

export async function saveLayout(
  id: string,
  data: LayoutNode,
): Promise<LayoutRecord> {
  const userId = await currentUserId();

  const { data: current, error: fetchError } = await layoutTable
    .query()
    .select('version, user_id')
    .eq('id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  const nextVersion = (current?.version ?? 0) + 1;

  const { data: row, error } = await layoutTable
    .query()
    .insert({
      id,
      user_id: current.user_id,
      version: nextVersion,
      status: 'draft' as LayoutStatus,
      data,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return row as LayoutRecord;
}

export async function setStatus(
  id: string,
  version: number,
  status: LayoutStatus,
): Promise<void> {
  const userId = await currentUserId();

  // Only 1 published layout per user — unpublish all user's layouts first
  if (status === 'published') {
    await layoutTable
      .query()
      .update({
        status: 'draft',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'published');
  }

  const { error } = await layoutTable
    .query()
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', version);

  if (error) throw error;
}

export async function getVersionHistory(id: string): Promise<LayoutRecord[]> {
  const { data, error } = await layoutTable
    .query()
    .select('*')
    .eq('id', id)
    .order('version', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LayoutRecord[];
}
