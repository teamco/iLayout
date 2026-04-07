import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { defineAbilityFor } from '@/auth/abilities';
import { AbilityContext } from '@/auth/abilityContext';

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ability = useMemo(() => defineAbilityFor(user), [user]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
