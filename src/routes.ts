export const ERoutes = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  PROFILE_OVERVIEW: '/profile/overview',
  PROFILE_LAYOUTS: '/profile/layouts',
  PROFILE_WIDGETS: '/profile/widgets',
  PROFILE_USERS: '/profile/users',
  USER_PROFILE: '/users/$userId',
  AUTH_CALLBACK: '/auth/callback',
  // Short paths (current user / owner)
  LAYOUT_NEW: '/layouts/new',
  LAYOUT_EDIT: '/layouts/$layoutId',
  // Widget editor
  WIDGET_NEW: '/widgets/new',
  WIDGET_EDIT: '/widgets/$widgetId/edit',
  // Namespaced paths (other users)
  USER_LAYOUT_NEW: '/users/$userId/layouts/new',
  USER_LAYOUT_EDIT: '/users/$userId/layouts/$layoutId',
} as const;

export type ERoutes = (typeof ERoutes)[keyof typeof ERoutes];
