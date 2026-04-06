import { useAbility } from '@/auth/AbilityContext';
import { EAction, ESubject } from '@/auth/abilities';

export function useCanEdit(): boolean {
  const ability = useAbility();
  return ability.can(EAction.EDIT, ESubject.LAYOUT);
}
