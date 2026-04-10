import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth, AuthContext, type AuthContextValue } from '../useAuth';
import React from 'react';

describe('useAuth', () => {
  it('should return context value', () => {
    const mockValue: AuthContextValue = {
      session: null,
      user: null,
      loading: false,
      signOut: async () => {},
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(mockValue);
  });

  it('should return default context value if no provider', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toEqual({
      session: null,
      user: null,
      loading: true,
      signOut: expect.any(Function),
    });
  });

  it('should be able to call signOut from context', async () => {
    const signOutSpy = vi.fn().mockResolvedValue(undefined);
    const mockValue: AuthContextValue = {
      session: null,
      user: null,
      loading: false,
      signOut: signOutSpy,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await result.current.signOut();
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });
});
