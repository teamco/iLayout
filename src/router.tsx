import { useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthContext';
import { useThemeStore, syncSystemTheme } from '@/themes/themeStore';
import { supabase } from '@/lib/supabase';
import App from '@/App';
import { LoginPage } from '@/auth/LoginPage';
import { AuthCallback } from '@/auth/AuthCallback';
import { ProfilePage } from '@/auth/ProfilePage';

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
        <ConfigProvider theme={{
          algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: resolvedTheme === 'dark' ? { colorLink: '#4da6ff', colorPrimary: '#4da6ff' } : undefined,
        }}>
          <Outlet />
        </ConfigProvider>
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
  component: App,
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

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallback,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, profileRoute, callbackRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
