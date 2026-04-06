import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { defineAbilityFor, type AppAbility } from '@/auth/abilities';

export const AbilityContext = createContext<AppAbility | null>(null);

export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability) throw new Error('useAbility must be used within AbilityProvider');
  return ability;
}

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ability = useMemo(() => defineAbilityFor(user), [user]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
