import { useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthContext';
import { AbilityProvider } from '@/auth/AbilityContext';
import { useThemeStore, syncSystemTheme } from '@/themes/themeStore';
import { supabase } from '@/lib/supabase';
import { LoginPage } from '@/auth/LoginPage';
import { AuthCallback } from '@/auth/AuthCallback';
import { ProfilePage } from '@/auth/ProfilePage';
import { HomePage } from '@/pages/HomePage';
import { LayoutEditorPage } from '@/pages/LayoutEditorPage';

const queryClient = new QueryClient();

function RootComponent() {
  const resolvedTheme = useThemeStore(s => s.resolvedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => syncSystemTheme();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AbilityProvider>
          <ConfigProvider theme={{
            algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: resolvedTheme === 'dark' ? { colorLink: '#4da6ff', colorPrimary: '#4da6ff' } : undefined,
          }}>
            <AntApp>
              <Outlet />
            </AntApp>
          </ConfigProvider>
        </AbilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProfilePage,
});

const layoutNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/layouts/new',
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: LayoutEditorPage,
});

const layoutEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/layouts/$layoutId',
  async beforeLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: LayoutEditorPage,
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallback,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, profileRoute, layoutNewRoute, layoutEditRoute, callbackRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
