import { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/auth/AuthContext';
import { AbilityProvider } from '@/auth/AbilityProvider';
import { useThemeStore, syncSystemTheme } from '@/themes/themeStore';

const queryClient = new QueryClient();

const RTL_LANGUAGES = new Set(['he', 'ar']);

export function RootComponent() {
  const resolvedTheme = useThemeStore(s => s.resolvedTheme);
  const { i18n } = useTranslation();
  const direction = RTL_LANGUAGES.has(i18n.language) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [resolvedTheme, direction, i18n.language]);

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
          <ConfigProvider
            direction={direction}
            theme={{
              algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
              token: resolvedTheme === 'dark' ? { colorLink: '#4da6ff', colorPrimary: '#4da6ff' } : undefined,
            }}
          >
            <AntApp>
              <Outlet />
            </AntApp>
          </ConfigProvider>
        </AbilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
