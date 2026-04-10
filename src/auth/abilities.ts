import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability';
import type { User } from '@supabase/supabase-js';
import type { IUser } from '@/lib/types.ts';

export const EAction = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  PUBLISH: 'publish',
  MANAGE: 'manage',
} as const;

export type EAction = (typeof EAction)[keyof typeof EAction];

export const ESubject = {
  LOGIN: 'login',
  LAYOUT: 'layout',
  WIDGET: 'widget',
  ALL: 'all',
} as const;

export type ESubject = (typeof ESubject)[keyof typeof ESubject];

export type LayoutSubject = { kind: 'layout'; user_id: IUser['id'] };
export type WidgetSubject = { kind: 'widget'; user_id: string };

export type AppAbility = MongoAbility<
  [EAction, LayoutSubject | WidgetSubject | ESubject | string]
>;

function isAdmin(email?: string): boolean {
  if (!email) return false;
  const admins = (import.meta.env.VITE_ADMINS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export function defineAbilityFor(user: User | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility,
  );

  if (user && isAdmin(user.email)) {
    can(EAction.MANAGE, ESubject.ALL);
  } else if (user) {
    can(EAction.VIEW, ESubject.LAYOUT);
    can(EAction.CREATE, ESubject.LAYOUT);
    can(EAction.EDIT, ESubject.LAYOUT, { user_id: { $eq: user.id } });
    can(EAction.DELETE, ESubject.LAYOUT, { user_id: { $eq: user.id } });
    can(EAction.PUBLISH, ESubject.LAYOUT, { user_id: { $eq: user.id } });

    can(EAction.VIEW, ESubject.WIDGET);
    can(EAction.CREATE, ESubject.WIDGET);
    can(EAction.EDIT, ESubject.WIDGET, { user_id: { $eq: user.id } });
    can(EAction.DELETE, ESubject.WIDGET, { user_id: { $eq: user.id } });
    can(EAction.PUBLISH, ESubject.WIDGET, { user_id: { $eq: user.id } });

    cannot(EAction.VIEW, ESubject.LOGIN);
  } else {
    can(EAction.VIEW, ESubject.LAYOUT);
    can(EAction.VIEW, ESubject.WIDGET);
    can(EAction.VIEW, ESubject.LOGIN);
  }

  return build();
}
