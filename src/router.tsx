import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
} from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallback } from '@/auth/AuthCallback';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProfileSection } from '@/pages/profile/ProfileSection';
import { OverviewSection } from '@/pages/profile/OverviewSection';
import { LayoutsSection } from '@/pages/profile/LayoutsSection';
import { WidgetsSection } from '@/pages/profile/WidgetsSection';
import { UsersSection } from '@/pages/profile/UsersSection';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { HomePage } from '@/pages/HomePage';
import { LayoutEditorPage } from '@/pages/LayoutEditorPage';
import { WidgetEditorPage } from '@/pages/WidgetEditorPage';
import { RootComponent } from '@/pages/RootComponent';
import { NotFound } from '@/pages/NotFound';
import { ERoutes } from '@/routes';

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw redirect({ to: ERoutes.LOGIN });
  }
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.HOME,
  beforeLoad: requireAuth,
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.LOGIN,
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: ERoutes.HOME });
    }
  },
  component: LoginPage,
});

// Profile layout route with nested children
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.PROFILE,
  beforeLoad: requireAuth,
  component: ProfilePage,
});

const profileIndexRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/',
  component: ProfileSection,
});

const profileOverviewRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/overview',
  component: OverviewSection,
});

const profileLayoutsRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/layouts',
  component: LayoutsSection,
});

const profileWidgetsRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/widgets',
  component: WidgetsSection,
});

const profileUsersRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: '/users',
  component: UsersSection,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.USER_PROFILE,
  beforeLoad: requireAuth,
  component: UserProfilePage,
});

const layoutNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.LAYOUT_NEW,
  beforeLoad: requireAuth,
  component: LayoutEditorPage,
});

const layoutEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.LAYOUT_EDIT,
  beforeLoad: requireAuth,
  component: LayoutEditorPage,
});

const userLayoutEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.USER_LAYOUT_EDIT,
  beforeLoad: requireAuth,
  component: LayoutEditorPage,
});

const widgetNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.WIDGET_NEW,
  beforeLoad: requireAuth,
  component: WidgetEditorPage,
});

const widgetEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.WIDGET_EDIT,
  beforeLoad: requireAuth,
  component: WidgetEditorPage,
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.AUTH_CALLBACK,
  component: AuthCallback,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  profileRoute.addChildren([
    profileIndexRoute,
    profileOverviewRoute,
    profileLayoutsRoute,
    profileWidgetsRoute,
    profileUsersRoute,
  ]),
  userProfileRoute,
  layoutNewRoute,
  layoutEditRoute,
  userLayoutEditRoute,
  widgetNewRoute,
  widgetEditRoute,
  callbackRoute,
]);

export const router = createRouter({ routeTree, defaultNotFoundComponent: NotFound });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
