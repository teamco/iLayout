import type { IUser, ProfileRecord } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { createTableApi } from '@idevconn/supabase';

const profileTable = createTableApi<ProfileRecord>(supabase, 'profiles');

export async function getProfiles(): Promise<ProfileRecord[]> {
  return profileTable.getAll({
    order: { column: 'last_sign_in_at', ascending: false },
  });
}

export async function getProfile(
  userId: IUser['id'],
): Promise<ProfileRecord | null> {
  return profileTable.getById(userId);
}

export async function blockUser(
  userId: IUser['id'],
  blocked: boolean,
): Promise<void> {
  await profileTable.update(userId, {
    is_blocked: blocked,
    updated_at: new Date().toISOString(),
  } as Partial<ProfileRecord>);
}

export async function forceLogoutUser(userId: IUser['id']): Promise<void> {
  await profileTable.update(userId, {
    is_online: false,
    updated_at: new Date().toISOString(),
  } as Partial<ProfileRecord>);
}

export async function updateProfile(
  userId: IUser['id'],
  updates: Partial<Pick<ProfileRecord, 'full_name' | 'avatar_url'>>,
): Promise<ProfileRecord> {
  const result = await profileTable.update(userId, {
    ...updates,
    updated_at: new Date().toISOString(),
  } as Partial<ProfileRecord>);

  if (!result) throw new Error('Failed to update profile');
  return result;
}
