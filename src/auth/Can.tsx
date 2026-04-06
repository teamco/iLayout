import { createContextualCan } from '@casl/react';
import type { AnyAbility } from '@casl/ability';
import type { Consumer } from 'react';
import { AbilityContext } from '@/auth/AbilityContext';

export const Can = createContextualCan(AbilityContext.Consumer as Consumer<AnyAbility>);
