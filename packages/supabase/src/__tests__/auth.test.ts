import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('AuthService', () => {
  let mockSupabase: any;
  let authService: AuthService;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: { session: {}, user: {} }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    };
    authService = new AuthService(mockSupabase as SupabaseClient);
  });

  it('calls signInWithOAuth when provider is specified', async () => {
    await authService.login({
      provider: 'google',
      redirectTo: 'http://localhost:3000',
    });
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000' },
    });
  });

  it('calls signInWithOtp when email but no password is provided', async () => {
    await authService.login({
      email: 'test@example.com',
      redirectTo: 'http://localhost:3000',
    });
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { emailRedirectTo: 'http://localhost:3000' },
    });
  });

  it('calls signInWithPassword when both email and password are provided', async () => {
    await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('throws error for invalid login options', async () => {
    await expect(authService.login({})).rejects.toThrow(
      'Invalid login options',
    );
  });

  it('calls signOut on logout', async () => {
    const callback = vi.fn();
    await authService.logout(callback);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it('throws error when provider is not in allowed list', async () => {
    const serviceWithConfig = new AuthService(mockSupabase as SupabaseClient, {
      allowedProviders: ['google'],
    });
    await expect(
      serviceWithConfig.login({ provider: 'github' as any }),
    ).rejects.toThrow('Provider "github" is not allowed by configuration.');
  });
});
