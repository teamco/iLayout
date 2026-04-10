import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import React from 'react';
import { AuthContext } from './useAuth';

describe('useAuth', () => {
  it('should return context value', () => {
    const mockValue = {
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
});
