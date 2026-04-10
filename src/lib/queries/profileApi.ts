import type { IUser, ProfileRecord } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function getProfiles(): Promise<ProfileRecord[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('last_sign_in_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProfileRecord[];
}

export async function getProfile(
  userId: IUser['id'],
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ProfileRecord;
}

export async function blockUser(
  userId: IUser['id'],
  blocked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_blocked: blocked, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function forceLogoutUser(userId: IUser['id']): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_online: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateProfile(
  userId: IUser['id'],
  updates: Partial<Pick<ProfileRecord, 'full_name' | 'avatar_url'>>,
): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRecord;
}
