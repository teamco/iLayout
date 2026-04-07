import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IUser, ProfileRecord } from '@/lib/types';
import * as api from '@/lib/queries/profileApi';

const KEYS = {
  profiles: ['profiles'] as const,
  profile: (userId: string) => ['profiles', userId] as const,
};

export function useProfiles() {
  return useQuery({
    queryKey: KEYS.profiles,
    queryFn: api.getProfiles,
  });
}

export function useProfile(userId: IUser['id'] | undefined) {
  return useQuery({
    queryKey: KEYS.profile(userId!),
    queryFn: () => api.getProfile(userId!),
    enabled: !!userId,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: IUser['id']; blocked: boolean }) =>
      api.blockUser(userId, blocked),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYS.profiles });
    },
  });
}

export function useForceLogoutUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: IUser['id']) => api.forceLogoutUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYS.profiles });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: IUser['id']; updates: Partial<Pick<ProfileRecord, 'full_name' | 'avatar_url'>> }) =>
      api.updateProfile(userId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.profile(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: KEYS.profiles });
    },
  });
}
